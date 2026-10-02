// Server-side storage for NPTU upstream sessions.
//
// Next.js compiles server actions and route handlers into separate bundles,
// each with its own copy of this module — plain module-level state is NOT
// shared between them. Pending logins therefore live on `globalThis` (shared
// across bundles in one server process), and student sessions are read from
// and written to the JSON file on every access.
//
// Student sessions are disk-backed on purpose: they hold the upstream cookies
// that let a restarted server still say goodbye upstream — the school locks an
// account for ~5 minutes when a session is not properly logged out.

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { ClientState, NptuClient } from "./client";

const PENDING_TTL_MS = 10 * 60_000;

export type StoredStudent = {
  studentId: string;
  name: string;
  semester: string | null;
  warning: string | null;
  createdAt: string;
  lastActivity?: string;
  upstream: ClientState;
};

type PendingEntry = { client: NptuClient; createdAt: number };

const globalScope = globalThis as typeof globalThis & {
  __nptuPendingLogins?: Map<string, PendingEntry>;
};

function pendings(): Map<string, PendingEntry> {
  globalScope.__nptuPendingLogins ??= new Map<string, PendingEntry>();
  return globalScope.__nptuPendingLogins;
}

export function createPendingLogin(client: NptuClient): string {
  sweepPendings();
  const id = randomUUID();
  pendings().set(id, { client, createdAt: Date.now() });
  return id;
}

export function getPendingLogin(id: string): NptuClient | null {
  const entry = pendings().get(id);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > PENDING_TTL_MS) {
    pendings().delete(id);
    return null;
  }
  return entry.client;
}

export function dropPendingLogin(id: string): void {
  pendings().delete(id);
}

function sweepPendings(): void {
  const now = Date.now();
  for (const [id, entry] of pendings()) {
    if (now - entry.createdAt > PENDING_TTL_MS) pendings().delete(id);
  }
}

function storeFile(): string {
  return (
    process.env.NPTU_SESSIONS_FILE ??
    path.join(process.cwd(), "data", "nptu-sessions.json")
  );
}

function load(): Record<string, StoredStudent> {
  try {
    return JSON.parse(fs.readFileSync(storeFile(), "utf8")) as Record<
      string,
      StoredStudent
    >;
  } catch {
    return {};
  }
}

function save(records: Record<string, StoredStudent>): void {
  fs.mkdirSync(path.dirname(storeFile()), { recursive: true });
  fs.writeFileSync(storeFile(), JSON.stringify(records, null, 2));
}

export function putStudentSession(id: string, record: StoredStudent): void {
  const records = load();
  records[id] = record;
  save(records);
}

export function getStudentSession(id: string): StoredStudent | null {
  return load()[id] ?? null;
}

/** Refreshes the activity marker and rotated upstream cookies, if any. */
export function touchStudentSession(
  id: string,
  upstream?: StoredStudent["upstream"],
): void {
  const records = load();
  const record = records[id];
  if (!record) return;
  record.lastActivity = new Date().toISOString();
  if (upstream) record.upstream = upstream;
  save(records);
}

export function listStudentSessions(): Array<{ id: string; record: StoredStudent }> {
  return Object.entries(load()).map(([id, record]) => ({ id, record }));
}

/** Removes and returns the record — the caller owes the upstream a logout. */
export function takeStudentSession(id: string): StoredStudent | null {
  const records = load();
  const record = records[id] ?? null;
  if (record) {
    delete records[id];
    save(records);
  }
  return record;
}
