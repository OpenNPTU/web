"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NptuClient } from "@/lib/nptu/client";
import {
  createPendingLogin,
  dropPendingLogin,
  getPendingLogin,
  putStudentSession,
  takeStudentSession,
} from "@/lib/nptu/store";
import { GUEST_SESSION, SESSION_COOKIE } from "@/lib/session";

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
};

export async function loginAsGuest() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, GUEST_SESSION, COOKIE_BASE);
  redirect("/dashboard");
}

/** Opens an upstream session and returns the id the captcha route needs. */
export async function createLoginAttempt(): Promise<string> {
  const client = new NptuClient();
  await client.begin();
  return createPendingLogin(client);
}

async function openFreshAttempt(): Promise<string | null> {
  try {
    return await createLoginAttempt();
  } catch (cause) {
    console.error("nptu fresh login attempt failed", cause);
    return null;
  }
}

export type LoginState = {
  error: string | null;
  /** Fresh attempt for an immediate retry — the failed one is spent upstream. */
  nextAttemptId: string | null;
};

export async function loginStudent(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const account = String(formData.get("account") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const checkCode = String(formData.get("checkCode") ?? "").trim();
  const attemptId = String(formData.get("attemptId") ?? "");
  if (!account || !password || !checkCode) {
    return { error: "請填齊學號、密碼與驗證碼。", nextAttemptId: null };
  }

  const client = getPendingLogin(attemptId);
  if (!client) {
    return { error: "登入階段已過期，請重新整理頁面再試。", nextAttemptId: null };
  }

  let result;
  try {
    result = await client.submitLogin(account, password, checkCode);
  } catch (cause) {
    console.error("nptu login request failed", cause);
    return { error: "連不上校務系統，請稍後再試。", nextAttemptId: null };
  }
  if (!result.ok) {
    // The upstream session for this attempt is dirty now (captcha consumed,
    // possibly even authenticated) — submitLogin already logged it out
    // upstream. Drop the attempt and hand the form a fresh one, captcha and
    // all, so the user can retry immediately.
    dropPendingLogin(attemptId);
    return { error: result.error, nextAttemptId: await openFreshAttempt() };
  }

  // The upstream page doesn't carry the student id; the login account is it.
  const identity = await client.whoami();
  const id = randomUUID();
  putStudentSession(id, {
    studentId: account.toUpperCase(),
    name: identity.name ?? account,
    semester: identity.semester,
    warning: result.warning,
    createdAt: new Date().toISOString(),
    upstream: client.exportState(),
  });
  dropPendingLogin(attemptId);

  const jar = await cookies();
  jar.set(SESSION_COOKIE, id, COOKIE_BASE);
  redirect("/dashboard");
}

export async function logout() {
  const jar = await cookies();
  const value = jar.get(SESSION_COOKIE)?.value;

  if (value && value !== GUEST_SESSION) {
    const record = takeStudentSession(value);
    if (record) {
      try {
        const client = NptuClient.fromState(record.upstream);
        const closed = await client.logout();
        if (!closed) {
          console.error("nptu upstream logout could not be verified");
        }
      } catch (cause) {
        console.error("nptu upstream logout failed — account may be locked ~5min", cause);
      }
    }
  }

  jar.set(SESSION_COOKIE, "", { ...COOKIE_BASE, maxAge: 0 });
  redirect("/");
}
