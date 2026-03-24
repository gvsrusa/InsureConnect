import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type Portal = "customer" | "agent" | "partner";

function normalizePortal(value: string | null): Portal {
  if (value === "agent") return "agent";
  if (value === "partner") return "partner";
  return "customer";
}

function accessCookieName(portal: Portal): string {
  if (portal === "agent") return "access_token_agent";
  if (portal === "partner") return "access_token_partner";
  return "access_token_customer";
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const portal = normalizePortal(req.nextUrl.searchParams.get("portal"));
  const cookieStore = await cookies();

  cookieStore.delete(accessCookieName(portal));
  cookieStore.delete("access_token");

  const hasAnyRoleSession = Boolean(
    cookieStore.get("access_token_customer")?.value ||
      cookieStore.get("access_token_agent")?.value ||
      cookieStore.get("access_token_partner")?.value
  );

  if (!hasAnyRoleSession) {
    cookieStore.delete("user_roles");
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return NextResponse.redirect(new URL(`/login?portal=${portal}`, base));
}
