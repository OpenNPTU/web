"use client";

import Link from "next/link";
import { AccountMenu } from "./account-menu";
import { ThemeSwitch } from "./theme-switch";

export function SiteNav({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <nav className="site-nav" aria-label="主要">
      <Link href={signedIn ? "/dashboard" : "/"} className="site-brand">
        <span className="wordmark">OpenNPTU</span>
      </Link>
      <div className="site-nav-end">
        <ThemeSwitch />
        <AccountMenu signedIn={signedIn} />
      </div>
    </nav>
  );
}
