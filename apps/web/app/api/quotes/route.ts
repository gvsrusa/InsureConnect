import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api-base";

const API_BASE = getApiBaseUrl();
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", APP_URL));
  }

  const formData = await req.formData();
  const payload = {
    businessName: String(formData.get("businessName") ?? "").trim(),
    coverageType: String(formData.get("coverageType") ?? "AUTO").trim().toUpperCase(),
    state: String(formData.get("state") ?? "TX").trim().toUpperCase(),
    annualRevenue: Number(formData.get("annualRevenue") ?? 0)
  };

  const upstream = await fetch(`${API_BASE}/api/v1/portal/quotes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({ message: "Unable to create quote" })) as { message?: string };
    return NextResponse.redirect(
      new URL(`/quotes?error=${encodeURIComponent(err.message ?? "Unable to create quote")}`, APP_URL)
    );
  }

  const data = await upstream.json() as { quoteRequestId: string };
  return NextResponse.redirect(new URL(`/quotes?quoteRequestId=${data.quoteRequestId}`, APP_URL));
}
