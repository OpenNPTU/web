"use client";

import { loginAsGuest } from "./login/actions";

function LoginFields({ ghost = false }: { ghost?: boolean }) {
  return (
    <fieldset className="login-fields" disabled>
      <label className="login-field">
        <span className="field-label">學號</span>
        <input
          type="text"
          name={ghost ? undefined : "sid"}
          placeholder="學號"
          autoComplete={ghost ? "off" : "username"}
          tabIndex={ghost ? -1 : undefined}
          disabled
        />
      </label>
      <label className="login-field">
        <span className="field-label">密碼</span>
        <input
          type="password"
          name={ghost ? undefined : "password"}
          placeholder="密碼"
          autoComplete={ghost ? "off" : "current-password"}
          tabIndex={ghost ? -1 : undefined}
          disabled
        />
      </label>
    </fieldset>
  );
}

export function LoginPanel() {
  return (
    <div className="login-panel">
      <div className="login-soon">
        <LoginFields />
        <div className="login-frost" aria-hidden="true">
          <LoginFields ghost />
        </div>
        <p className="login-veil">In Coming</p>
      </div>
      <form action={loginAsGuest}>
        <button className="enter" type="submit">
          以訪客登入
        </button>
      </form>
    </div>
  );
}
