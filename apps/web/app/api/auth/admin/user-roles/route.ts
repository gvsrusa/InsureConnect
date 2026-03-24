import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api-base";

const API_BASE = getApiBaseUrl();

type Portal = "customer" | "agent" | "partner" | "admin";
type RoleMutationAction = "add" | "remove";

function normalizePortal(value: string | undefined): Portal {
  if (value === "admin") return "admin";
  if (value === "agent") return "agent";
  if (value === "partner") return "partner";
  return "customer";
}

function accessCookieName(portal: Portal): string {
  if (portal === "admin") return "access_token_admin";
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

function buildAdminUserRolesPath(email: string, action?: RoleMutationAction): string {
  const encodedEmail = encodeURIComponent(email);
  if (!action) {
    return `/api/v1/auth/admin/users/${encodedEmail}/roles`;
  }
  return `/api/v1/auth/admin/users/${encodedEmail}/roles/${action}`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const portal = normalizePortal(req.nextUrl.searchParams.get("portal") ?? undefined);
  const email = req.nextUrl.searchParams.get("email") ?? "";
  const token = await resolveToken(portal);

  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  if (!email) {
    return NextResponse.json({ message: "Email is required" }, { status: 400 });
  }

  const upstream = await fetch(`${API_BASE}${buildAdminUserRolesPath(email)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!upstream.ok) {
    const err = (await upstream.json().catch(() => ({ message: "Unable to fetch user roles" }))) as {
      message?: string;
    };
    return NextResponse.json({ message: err.message ?? "Unable to fetch user roles" }, { status: upstream.status });
  }

  const data = (await upstream.json()) as unknown;
  return NextResponse.json(data);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as {
    portal?: string;
    email?: string;
    action?: RoleMutationAction;
    roles?: string[];
  };

  const portal = normalizePortal(body.portal);
  const token = await resolveToken(portal);
  const email = body.email ?? "";
  const action = body.action ?? "add";

  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  if (!email) {
    return NextResponse.json({ message: "Email is required" }, { status: 400 });
  }

  const upstream = await fetch(`${API_BASE}${buildAdminUserRolesPath(email, action)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ roles: body.roles ?? [] })
  });

  if (!upstream.ok) {
    const err = (await upstream.json().catch(() => ({ message: "Unable to update user roles" }))) as {
      message?: string;
    };
    return NextResponse.json({ message: err.message ?? "Unable to update user roles" }, { status: upstream.status });
  }

  const data = (await upstream.json()) as unknown;
  return NextResponse.json(data);
}
