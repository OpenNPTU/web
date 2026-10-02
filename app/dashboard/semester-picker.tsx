"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

// Semester switcher: picking an option navigates immediately — the server
// re-renders the page with ?sem=... — no submit button needed. Uncontrolled
// select keyed by the server's selected value, so the DOM keeps the user's
// pick while pending and snaps to the server's answer after re-render.
export function SemesterPicker({
  options,
  selected,
}: {
  options: Array<{ value: string; label: string }>;
  selected?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  if (options.length === 0) return null;

  return (
    <select
      key={selected}
      className="dash-picker-select"
      aria-label="選擇學期"
      defaultValue={selected}
      disabled={pending}
      onChange={(event) => {
        const value = event.target.value;
        if (!value || value === selected) return;
        startTransition(() =>
          router.push(`${pathname}?sem=${encodeURIComponent(value)}`),
        );
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
