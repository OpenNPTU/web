// Background sweep that properly logs out upstream sessions gone idle.
//
// The school locks an account for ~5 minutes when its session is not closed
// with the real logout postback. A student who closes the tab and walks away
// would otherwise hold an upstream session until the school's own timeout —
// and if this server restarted before the school's timeout, the account could
// linger even longer. The reaper closes those gaps: idle sessions get a real
// goodbye, and because session records are disk-backed, this also runs for
// sessions orphaned by a previous server crash.

import { NptuClient } from "./client";
import { listStudentSessions, takeStudentSession } from "./store";

const SWEEP_INTERVAL_MS = 10 * 60_000;
const MAX_IDLE_MS = 90 * 60_000;
const MAX_RECORD_AGE_MS = 7 * 24 * 60 * 60_000;

const globalScope = globalThis as typeof globalThis & {
  __nptuReaperStarted?: boolean;
};

export function startReaper(): void {
  if (globalScope.__nptuReaperStarted) return;
  globalScope.__nptuReaperStarted = true;

  setInterval(() => {
    sweep().catch((cause) => console.error("nptu reaper sweep failed", cause));
  }, SWEEP_INTERVAL_MS).unref();
}

export async function sweep(): Promise<void> {
  for (const { id, record } of listStudentSessions()) {
    const idleMs = Date.now() - new Date(record.lastActivity ?? record.createdAt).getTime();
    const ageMs = Date.now() - new Date(record.createdAt).getTime();
    if (idleMs < MAX_IDLE_MS && ageMs < MAX_RECORD_AGE_MS) continue;

    takeStudentSession(id);
    try {
      const closed = await NptuClient.fromState(record.upstream).logout();
      if (!closed) {
        console.error(`nptu reaper could not verify logout for ${record.studentId}`);
      }
    } catch (cause) {
      console.error(`nptu reaper logout failed for ${record.studentId}`, cause);
    }
  }
}
