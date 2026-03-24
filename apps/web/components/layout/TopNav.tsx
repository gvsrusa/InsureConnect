import Link from "next/link";
import { cookies } from "next/headers";
import NavTabs from "./NavTabs";
import RoleSwitcher from "./RoleSwitcher";

type NavVariant = "customer" | "agent" | "partner";

interface TopNavProps {
  variant: NavVariant;
}

export default async function TopNav({
  variant
}: TopNavProps): Promise<React.JSX.Element> {
  const cookieStore = await cookies();
  const hasToken = !!cookieStore.get("access_token")?.value;
  const userRolesRaw = cookieStore.get("user_roles")?.value;
  const availableRoles: string[] = userRolesRaw
    ? (JSON.parse(userRolesRaw) as string[])
    : [];

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
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

        {/* Nav tabs */}
        <NavTabs variant={variant} />

        {/* Right slot */}
        <div className="flex shrink-0 items-center gap-2">
          {hasToken ? (
            <>
              {availableRoles.length > 1 && (
                <RoleSwitcher availableRoles={availableRoles} currentVariant={variant} />
              )}
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:bg-gray-100 hover:text-ink"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-pine px-4 py-1.5 text-sm font-semibold text-white hover:bg-pine-dark transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
