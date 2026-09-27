"use client";

export function ThemeSwitch() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* Storage can be unavailable in private browsing. */
    }
  }

  return (
    <button type="button" className="theme-switch" aria-label="切換深淺色" onClick={toggle}>
      <svg className="icon-moon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M20 14.6A7.8 7.8 0 1 1 9.4 4a6.4 6.4 0 0 0 10.6 10.6z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      <svg className="icon-sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 3.2v2.1M12 18.7v2.1M3.2 12h2.1M18.7 12h2.1M5.9 5.9l1.5 1.5M16.6 16.6l1.5 1.5M18.1 5.9l-1.5 1.5M7.4 16.6l-1.5 1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
