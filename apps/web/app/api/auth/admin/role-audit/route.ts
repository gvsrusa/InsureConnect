import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api-base";

const API_BASE = getApiBaseUrl();

type Portal = "customer" | "agent" | "partner";

function normalizePortal(value: string | undefined): Portal {
  if (value === "agent") return "agent";
  if (value === "partner") return "partner";
  return "customer";
}

function accessCookieName(portal: Portal): string {
  if (portal === "agent") return "access_token_agent";
  if (portal === "partner") return "access_token_partner";
  return "access_token_customer";
}

async function resolveToken(portal: Portal): Promise<string | undefined> {
  const cookieStore = await cookies();
  return (
    cookieStore.get(accessCookieName(portal))?.value ??
    cookieStore.get("access_token")?.value
  );
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const portal = normalizePortal(req.nextUrl.searchParams.get("portal") ?? undefined);
  const email = req.nextUrl.searchParams.get("email") ?? "";
  const limit = req.nextUrl.searchParams.get("limit") ?? "50";
  const token = await resolveToken(portal);

  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const upstreamUrl = new URL(`${API_BASE}/api/v1/auth/admin/role-audit`);
  upstreamUrl.searchParams.set("limit", limit);
  if (email) {
    upstreamUrl.searchParams.set("email", email);
  }

  const upstream = await fetch(upstreamUrl.toString(), {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!upstream.ok) {
    const err = (await upstream.json().catch(() => ({ message: "Unable to fetch role audit logs" }))) as {
      message?: string;
    };
    return NextResponse.json(
      { message: err.message ?? "Unable to fetch role audit logs" },
      { status: upstream.status }
    );
  }

  const data = (await upstream.json()) as unknown;
  return NextResponse.json(data);
}
