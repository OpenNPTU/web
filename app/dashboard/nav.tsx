"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "總覽" },
  { href: "/dashboard/schedule", label: "課表查詢" },
  { href: "/dashboard/grades", label: "成績查詢" },
  { href: "/dashboard/attendance", label: "出缺勤" },
];

export function DashNav() {
  const path = usePathname();

  return (
    <nav className="dash-nav" aria-label="主選單">
      <ul className="dash-links">
        {items.map((item) => {
          const current = path === item.href;
          return (
            <li key={item.href}>
              <Link href={item.href} className="dash-link" aria-current={current ? "page" : undefined}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
