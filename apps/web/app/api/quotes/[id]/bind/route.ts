import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api-base";

const API_BASE = getApiBaseUrl();
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteProps): Promise<NextResponse> {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", APP_URL));
  }

  // Determine portal path based on which access token is present
  let portalPath = "";
  if (cookieStore.get("access_token_agent")) {
    portalPath = "/agent";
  } else if (cookieStore.get("access_token_partner")) {
    portalPath = "/partner";
  }
  // default to customer portal (empty string) if neither agent nor partner
  const formData = await req.formData();
  const quoteId = String(formData.get("quoteId") ?? "").trim();

  const upstream = await fetch(`${API_BASE}/api/v1/portal/quotes/${id}/bind`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ quoteId })
  });

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({ message: "Unable to bind policy" })) as { message?: string };
    return NextResponse.redirect(
      new URL(`${portalPath}/quotes?quoteRequestId=${id}&error=${encodeURIComponent(err.message ?? "Unable to bind policy")}`, APP_URL)
    );
  }

  return NextResponse.redirect(new URL(`${portalPath}/policies`, APP_URL));
}
