"use client";

import { useRef, useState, type MouseEvent } from "react";
import { LoginPanel } from "./login-panel";
import { ThemeSwitch } from "./theme-switch";

export function SiteNav() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  function openLogin() {
    dialog.current?.showModal();
    setOpen(true);
  }

  function onDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) event.currentTarget.close();
  }

  return (
    <>
      <nav className="site-nav" aria-label="主要">
        <button
          type="button"
          className="nav-login"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="login-dialog"
          onClick={openLogin}
        >
          登入
        </button>
        <ThemeSwitch />
      </nav>
      <dialog
        ref={dialog}
        id="login-dialog"
        className="login-dialog"
        aria-labelledby="login-dialog-title"
        onClick={onDialogClick}
        onClose={() => setOpen(false)}
      >
        <h2 id="login-dialog-title" className="login-dialog-title">
          登入
        </h2>
        <LoginPanel />
      </dialog>
    </>
  );
}
