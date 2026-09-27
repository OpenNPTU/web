import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="dash-head">
      <div>
        <p className="dash-kicker">{eyebrow}</p>
        <h1 className="dash-title">{title}</h1>
      </div>
      {children}
    </header>
  );
}
