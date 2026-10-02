"use client";

import { useEffect, useRef, useState } from "react";
import { logout } from "./login/actions";
import { LoginPanel } from "./login-panel";

export type NavUser = { name: string; studentId: string };

export function AccountMenu({ user }: { user: NavUser | null }) {
  const signedIn = user != null;
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [signedIn]);

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
    <div ref={root} className={open ? "nav-menu is-open" : "nav-menu"}>
      <button
        type="button"
        className="nav-login"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => setOpen((value) => !value)}
      >
        {user ? user.name : "登入"}
      </button>
      <div
        id="account-menu"
        className={signedIn ? "nav-menu-panel nav-account" : "nav-menu-panel"}
        role="dialog"
        aria-label={signedIn ? "帳戶" : "登入"}
        aria-hidden={!open}
        inert={!open}
      >
        {signedIn ? (
          <div className="nav-account-body">
            <p className="nav-account-who">
              <span className="nav-account-name">{user.name}</span>
              <span className="nav-account-id">{user.studentId}</span>
            </p>
            <form action={logout}>
              <button className="enter is-danger" type="submit">
                登出
              </button>
            </form>
          </div>
        ) : (
          <LoginPanel />
        )}
      </div>
    </div>
  );
}
