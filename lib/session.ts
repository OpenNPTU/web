import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "session";
export const GUEST_SESSION = "guest";

export type Session = { kind: "guest" };

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  if (jar.get(SESSION_COOKIE)?.value === GUEST_SESSION) {
    return { kind: "guest" };
  }
  return null;
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/");
  return session;
}
