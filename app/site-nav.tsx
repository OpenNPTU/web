"use client";

import Link from "next/link";
import { AccountMenu, type NavUser } from "./account-menu";
import { ThemeSwitch } from "./theme-switch";

export function SiteNav({ user = null }: { user?: NavUser | null }) {
  return (
    <nav className="site-nav" aria-label="主要">
      <Link href="/" className="site-brand">
        <span className="wordmark">OpenNPTU</span>
      </Link>
      <div className="site-nav-end">
        <ThemeSwitch />
        {user ? (
          <Link href="/dashboard" className="nav-login">
            總覽
          </Link>
        ) : null}
        <AccountMenu user={user} />
      </div>
    </nav>
  );
}
