import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api-base";

const API_BASE = getApiBaseUrl();

type Portal = "customer" | "agent" | "partner" | "admin";

function normalizePortal(value: string | undefined): Portal {
  if (value === "admin") return "admin";
  if (value === "agent") return "agent";
  if (value === "partner") return "partner";
  return "customer";
}

function candidateRolesForPortal(portal: Portal): string[] {
  if (portal === "admin") return ["ADMIN"];
  if (portal === "agent") return ["AGENT"];
  if (portal === "partner") return ["PARTNER_UNDERWRITER", "PARTNER_VIEWER"];
  return ["CUSTOMER"];
}

function accessCookieName(portal: Portal): string {
  if (portal === "admin") return "access_token_admin";
  if (portal === "agent") return "access_token_agent";
  if (portal === "partner") return "access_token_partner";
  return "access_token_customer";
}

function portalFromRole(role: string): Portal {
  if (role === "ADMIN") return "admin";
  if (role === "AGENT") return "agent";
  if (role === "PARTNER_UNDERWRITER" || role === "PARTNER_VIEWER") return "partner";
  return "customer";
}

function uniqueRolesByPortal(roles: string[]): string[] {
  const seen = new Set<Portal>();
  const out: string[] = [];

  for (const role of roles) {
    const portal = portalFromRole(role);
    if (seen.has(portal)) continue;
    seen.add(portal);
    out.push(role);
  }

  return out;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json() as { email?: string; password?: string; portal?: string };
  const portal = normalizePortal(body.portal);
  const roleCandidates = candidateRolesForPortal(portal);

  let data: {
    accessToken?: string;
    user?: {
      availableRoles?: string[];
      fullName?: string;
      email?: string;
      role?: string;
    };
  } | null = null;
  let finalErrorStatus = 401;
  let finalErrorMessage = "Login failed";

  for (const role of roleCandidates) {
    const upstream = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password, role })
    });

    if (upstream.ok) {
      data = await upstream.json() as {
        accessToken?: string;
        user?: {
          availableRoles?: string[];
          fullName?: string;
          email?: string;
          role?: string;
        };
      };
      break;
    }

    const err = await upstream.json().catch(() => ({ message: "Login failed" })) as { message?: string };
    finalErrorStatus = upstream.status;
    finalErrorMessage = err.message ?? "Login failed";
  }

  if (!data) {
    return NextResponse.json({ message: finalErrorMessage }, { status: finalErrorStatus });
  }
  const cookieStore = await cookies();

  if (data.accessToken) {
    cookieStore.set(accessCookieName(portal), data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15
    });
  }

  const availableRoles = data.user?.availableRoles ?? [];

  // Pre-mint one token per portal to support seamless role-tab switching.
  const fallbackRoles = uniqueRolesByPortal(
    availableRoles.filter((role) => !roleCandidates.includes(role))
  );

  for (const role of fallbackRoles) {
    const rolePortal = portalFromRole(role);
    const roleRes = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password, role })
    });

    if (!roleRes.ok) continue;

    const roleData = await roleRes.json() as { accessToken?: string };
    if (!roleData.accessToken) continue;

    cookieStore.set(accessCookieName(rolePortal), roleData.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15
    });
  }

  // Legacy fallback cookie for any old code paths.
  if (data.accessToken) {
    cookieStore.set("access_token", data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15
    });
  }

  cookieStore.set("user_roles", JSON.stringify(availableRoles), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15
  });

  if (data.user?.fullName) {
    cookieStore.set("user_name", data.user.fullName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15
    });
  }

  if (data.user?.email) {
    cookieStore.set("user_email", data.user.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15
    });
  }

  if (data.user?.role) {
    cookieStore.set("user_primary_role", data.user.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15
    });
  }

  return NextResponse.json({ ok: true });
}
