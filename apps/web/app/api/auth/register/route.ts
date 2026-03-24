import { NextRequest, NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api-base";

const API_BASE = getApiBaseUrl();

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json() as { name?: string; fullName?: string; email?: string; password?: string };

  const upstream = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: body.fullName ?? body.name,
      email: body.email,
      password: body.password
    })
  });

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({ message: "Registration failed" })) as { message?: string };
    return NextResponse.json({ message: err.message ?? "Registration failed" }, { status: upstream.status });
  }

  const data = await upstream.json() as unknown;
  return NextResponse.json(data, { status: 201 });
}
