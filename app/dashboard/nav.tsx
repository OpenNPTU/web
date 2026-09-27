"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "總覽" },
  { href: "/dashboard/schedule", label: "課表查詢" },
  { href: "/dashboard/grades", label: "成績查詢" },
  { href: "/dashboard/attendance", label: "出缺勤" },
];

const mobileQuery = "(max-width: 859px)";

export function DashNav() {
  const path = usePathname();
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const current = items.find((item) => item.href === path) ?? items[0];
  const menuHidden = mobile && !open;

  useEffect(() => {
    const media = window.matchMedia(mobileQuery);
    const sync = () => {
      setMobile(media.matches);
      if (!media.matches) setOpen(false);
    };

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <nav ref={root} className={open ? "dash-nav is-open" : "dash-nav"} aria-label="主選單">
      <button
        type="button"
        className="dash-nav-toggle"
        aria-expanded={open}
        aria-controls="dash-menu"
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        {current.label}
        <svg className="dash-nav-caret" viewBox="0 0 12 8" width="12" height="8" aria-hidden="true">
          <path
            d="M1 1.5 6 6.5 11 1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <ul id="dash-menu" className="dash-links" aria-hidden={menuHidden} inert={menuHidden || undefined}>
        {items.map((item) => {
          const active = path === item.href;
          return (
            <li key={item.href}>
              <Link href={item.href} className="dash-link" aria-current={active ? "page" : undefined}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
