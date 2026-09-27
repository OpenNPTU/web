"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GUEST_SESSION, SESSION_COOKIE } from "@/lib/session";

export async function loginAsGuest() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, GUEST_SESSION, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  redirect("/dashboard");
}

export async function logout() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  redirect("/");
}
