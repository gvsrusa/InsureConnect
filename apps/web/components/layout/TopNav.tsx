import Link from "next/link";
import { cookies } from "next/headers";
import NavTabs from "./NavTabs";
import AccountMenu from "./AccountMenu";

type NavVariant = "customer" | "agent" | "partner";

interface TopNavProps {
  variant: NavVariant;
}

function accessCookieName(variant: NavVariant): string {
  if (variant === "agent") return "access_token_agent";
  if (variant === "partner") return "access_token_partner";
  return "access_token_customer";
}

function homeHref(variant: NavVariant): string {
  if (variant === "agent") return "/agent/dashboard";
  if (variant === "partner") return "/partner/dashboard";
  return "/dashboard";
}

export default async function TopNav({
  variant
}: TopNavProps): Promise<React.JSX.Element> {
  const cookieStore = await cookies();
  const hasToken = Boolean(
    cookieStore.get(accessCookieName(variant))?.value ||
      cookieStore.get("access_token")?.value
  );
  const userRolesRaw = cookieStore.get("user_roles")?.value;
  const availableRoles: string[] = userRolesRaw
    ? (JSON.parse(userRolesRaw) as string[])
    : [];
  const displayName = cookieStore.get("user_name")?.value ?? "Signed in user";
  const email = cookieStore.get("user_email")?.value ?? "No email available";

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-3 py-2 sm:px-6 sm:py-0">
        <div className="flex min-h-14 items-center justify-between gap-3">
          {/* Logo */}
          <Link
            href={homeHref(variant)}
            className="flex shrink-0 items-center gap-2 text-pine"
            aria-label="InsureConnect home"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              aria-hidden
            >
              <rect width="28" height="28" rx="7" fill="var(--color-pine)" />
              <path
                d="M14 5L21 9V15C21 19.1421 17.4183 22.5 14 23C10.5817 22.5 7 19.1421 7 15V9L14 5Z"
                fill="white"
              />
            </svg>
            <span className="hidden text-sm font-semibold tracking-tight sm:block">
              InsureConnect
            </span>
          </Link>

          {/* Right slot */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {hasToken ? (
              <AccountMenu
                currentVariant={variant}
                displayName={displayName}
                email={email}
                availableRoles={availableRoles}
              />
            ) : (
              <>
                <Link
                  href="/admin/login"
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-gray-100 hover:text-ink sm:px-3 sm:text-sm"
                >
                  Admin Login
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg bg-pine px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-pine-dark sm:px-4 sm:text-sm"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="pb-1 sm:pb-0">
          {/* Nav tabs */}
          <NavTabs variant={variant} />
        </div>
      </div>
    </header>
  );
}
