"use client";

import { useActionState, useEffect, useState } from "react";
import { createLoginAttempt, loginAsGuest, loginStudent } from "./login/actions";

export function LoginPanel() {
  const [state, formAction, pending] = useActionState(loginStudent, {
    error: null,
    nextAttemptId: null,
  });
  const [mountAttempt, setMountAttempt] = useState<string | null>(null);
  const [attemptFailed, setAttemptFailed] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    createLoginAttempt()
      .then((id) => {
        if (alive) setMountAttempt(id);
      })
      .catch(() => {
        if (alive) setAttemptFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // A failed login comes back with a fresh attempt id (its captcha is spent
  // upstream); the mount attempt only matters until the first submit.
  const attemptId = state.nextAttemptId ?? mountAttempt;
  const captchaSrc = attemptId ? `/login/captcha?t=${attemptId}&r=${nonce}` : null;

  return (
    <div className="login-panel">
      <form action={formAction}>
        <input type="hidden" name="attemptId" value={attemptId ?? ""} />
        <fieldset className="login-fields">
          <label className="login-field">
            <span className="field-label">學號</span>
            <input
              type="text"
              name="account"
              placeholder="學號"
              autoComplete="username"
              required
            />
          </label>
          <label className="login-field">
            <span className="field-label">密碼</span>
            <input
              type="password"
              name="password"
              placeholder="密碼"
              autoComplete="current-password"
              required
            />
          </label>
          <label className="login-field">
            <span className="field-label">驗證碼</span>
            <span className="login-captcha">
              <input
                type="text"
                name="checkCode"
                placeholder="圖形驗證碼"
                autoComplete="off"
                maxLength={6}
                required
              />
              {captchaSrc ? (
                // biome-ignore lint/a11y/useKeyWithClickEvents: 點擊換圖僅為輔助
                <img
                  src={captchaSrc}
                  alt="圖形驗證碼，點擊可換一張"
                  title="點擊換一張"
                  className="login-captcha-img"
                  onClick={() => setNonce((value) => value + 1)}
                />
              ) : (
                <span className="login-captcha-wait" aria-hidden="true">
                  {attemptFailed ? "離線" : "…"}
                </span>
              )}
            </span>
          </label>
        </fieldset>
        {state.error ? (
          <p className="login-error" role="alert">
            {state.error}
          </p>
        ) : null}
        <button
          className="enter"
          type="submit"
          disabled={pending || !attemptId}
        >
          {pending ? "登入中…" : "以學生身分登入"}
        </button>
      </form>
      <form action={loginAsGuest}>
        <button className="enter" type="submit">
          以訪客登入
        </button>
      </form>
    </div>
  );
}
