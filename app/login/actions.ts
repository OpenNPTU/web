"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAsGuest() {
  const jar = await cookies();
  jar.set("session", "guest", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  redirect("/");
}
