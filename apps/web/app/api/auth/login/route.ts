import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api-base";

const API_BASE = getApiBaseUrl();

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json() as { email?: string; password?: string };

  const upstream = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({ message: "Login failed" })) as { message?: string };
    return NextResponse.json({ message: err.message ?? "Login failed" }, { status: upstream.status });
  }

  const data = await upstream.json() as { accessToken?: string; user?: { availableRoles?: string[] } };
  const cookieStore = await cookies();

  if (data.accessToken) {
    cookieStore.set("access_token", data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15
    });
  }

  const availableRoles = data.user?.availableRoles ?? [];
  cookieStore.set("user_roles", JSON.stringify(availableRoles), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15
  });

  return NextResponse.json({ ok: true });
}
