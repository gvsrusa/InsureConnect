import { NextRequest, NextResponse } from "next/server";

/** Routes that require a valid access_token cookie */
const PROTECTED_PATTERNS = [
  /^\/dashboard/,
  /^\/policies/,
  /^\/agent(?!\/|$)/,   // /agent page but not /agent/* (that's the agent portal)
  /^\/agent\/dashboard/,
  /^\/agent\/quotes/,
  /^\/agent\/policies/,
  /^\/partner\/dashboard/,
  /^\/partner\/quotes/,
  /^\/partner\/policies/
];

function resolvePortal(pathname: string): "customer" | "agent" | "partner" {
  if (pathname.startsWith("/agent/")) {
    return "agent";
  }

  if (pathname.startsWith("/partner/")) {
    return "partner";
  }

  return "customer";
}

function accessCookieName(portal: "customer" | "agent" | "partner"): string {
  if (portal === "agent") return "access_token_agent";
  if (portal === "partner") return "access_token_partner";
  return "access_token_customer";
}

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const portal = resolvePortal(pathname);
  const token = req.cookies.get(accessCookieName(portal))?.value;

  // Inject pathname as a header so nested server components can read it
  const res = NextResponse.next({
    request: {
      headers: new Headers({
        ...Object.fromEntries(req.headers),
        "x-pathname": pathname
      })
    }
  });

  // Redirect unauthenticated users trying to access protected routes
  const isProtected = PROTECTED_PATTERNS.some((re) => re.test(pathname));
  if (isProtected && !token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("portal", portal);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Run middleware on all routes except:
     * - _next/static, _next/image
     * - favicon.ico
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/).*)"
  ]
};
