import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStudentSession } from "./nptu/store";

export const SESSION_COOKIE = "session";
export const GUEST_SESSION = "guest";

export type StudentSession = {
  kind: "student";
  name: string;
  studentId: string;
  semester: string | null;
  warning: string | null;
};

export type Session = { kind: "guest" } | StudentSession;

export function isStudent(session: Session): session is StudentSession {
  return session.kind === "student";
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const value = jar.get(SESSION_COOKIE)?.value;
  if (!value) return null;
  if (value === GUEST_SESSION) return { kind: "guest" };

  // A cookie without a backing record means the session store was wiped
  // (or the server restarted without its data file) — force a fresh login.
  const record = getStudentSession(value);
  if (!record) return null;
  return {
    kind: "student",
    name: record.name,
    studentId: record.studentId,
    semester: record.semester,
    warning: record.warning,
  };
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/");
  return session;
}
