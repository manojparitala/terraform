"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cx } from "./ui";

export function NavLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "rounded-full px-2.5 py-2 text-sm font-medium whitespace-nowrap transition-colors sm:px-3",
        active ? "bg-basil-100 text-basil-900" : "text-stone-700 hover:bg-stone-900/5 hover:text-ink",
        className,
      )}
    >
      {children}
    </Link>
  );
}
