"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavVariant = "customer" | "agent" | "partner";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: Record<NavVariant, NavItem[]> = {
  customer: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Policies", href: "/policies" },
    { label: "My Agent", href: "/agent" }
  ],
  agent: [
    { label: "Dashboard", href: "/agent/dashboard" },
    { label: "Quotes", href: "/agent/quotes" },
    { label: "Policies", href: "/agent/policies" }
  ],
  partner: [
    { label: "Dashboard", href: "/partner/dashboard" },
    { label: "Quotes", href: "/partner/quotes" },
    { label: "Policies", href: "/partner/policies" }
  ]
};

function isActivePath(pathname: string, href: string): boolean {
  if (pathname === href) {
    return true;
  }

  return pathname.startsWith(`${href}/`);
}

export default function NavTabs({ variant }: { variant: NavVariant }): React.JSX.Element {
  const pathname = usePathname() ?? "";
  const items = NAV_ITEMS[variant];

  return (
    <nav className="flex items-center gap-1" aria-label="Primary navigation">
      {items.map((item) => {
        const isActive = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-pine/10 text-pine"
                : "text-[var(--color-muted)] hover:bg-gray-100 hover:text-ink"
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
