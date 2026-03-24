import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type Portal = "customer" | "agent" | "partner";

function resolvePortal(pathname: string): Portal {
  if (pathname.startsWith("/agent/")) return "agent";
  if (pathname.startsWith("/partner/")) return "partner";
  return "customer";
}

function accessCookieName(portal: Portal): string {
  if (portal === "agent") return "access_token_agent";
  if (portal === "partner") return "access_token_partner";
  return "access_token_customer";
}

export async function getAuthToken(portal?: Portal): Promise<string | undefined> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "/";
  const resolvedPortal = portal ?? resolvePortal(pathname);

  return (
    cookieStore.get(accessCookieName(resolvedPortal))?.value ??
    cookieStore.get("access_token")?.value
  );
}

/** Throws a redirect to `to` if no token present. Returns the token. */
export async function requireAuth(to = "/login", portal?: Portal): Promise<string> {
  const token = await getAuthToken(portal);
  if (!token) {
    const targetPortal = portal ?? "customer";
    redirect(`${to}?portal=${targetPortal}`);
  }
  return token;
}
