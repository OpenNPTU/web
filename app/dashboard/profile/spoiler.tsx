"use client";

import { useState } from "react";

// Shoulder-surfing guard for sensitive profile fields. The value stays in
// the DOM (devtools and screen readers can reach it) but is blurred until
// clicked; clicking again covers it back up.
export function Spoiler({ value }: { value: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      className={open ? "spoiler is-open" : "spoiler"}
      onClick={() => setOpen((current) => !current)}
      aria-pressed={open}
      title={open ? "點擊隱藏" : "點擊顯示"}
    >
      <span className={open ? undefined : "spoiler-veil"} aria-hidden={!open}>
        {value}
      </span>
    </button>
  );
}
