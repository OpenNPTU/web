import type { Meeting } from "@/lib/courses";
import { formatMeetings } from "@/lib/schedule";
import { periodSlots, weekdays } from "@/lib/timetable";

export type TimeSlot = {
  weekday: number;
  period: string;
};

export const SLOT_DAYS = weekdays;
export const SLOT_PERIODS = periodSlots;

const PERIOD_RANK: Record<string, number> = Object.fromEntries(
  periodSlots.map((period, index) => [period, index]),
);

export function parseSlotsParam(raw: string): TimeSlot[] {
  if (!raw.trim()) return [];
  const seen = new Set<string>();
  const slots: TimeSlot[] = [];
  for (const part of raw.split(",")) {
    const match = /^([1-7])-([MNABCD]|[1-9]|0[1-9])$/iu.exec(part.trim());
    if (!match) continue;
    const weekday = Number(match[1]);
    const period = toDisplayPeriod(match[2]);
    if (!period) continue;
    const key = `${weekday}-${period}`;
    if (seen.has(key)) continue;
    seen.add(key);
    slots.push({ weekday, period });
  }
  return sortSlots(slots);
}

export function serializeSlots(slots: TimeSlot[]): string {
  return sortSlots(slots)
    .map((slot) => `${slot.weekday}-${slot.period}`)
    .join(",");
}

export function slotsFromLegacy(weekday: string, period: string): TimeSlot[] {
  const day = /^[1-7]$/u.test(weekday) ? Number(weekday) : 0;
  const display = toDisplayPeriod(period);
  if (day && display) return [{ weekday: day, period: display }];
  if (day) return periodSlots.map((slot) => ({ weekday: day, period: slot }));
  if (display) {
    return [1, 2, 3, 4, 5].map((value) => ({ weekday: value, period: display }));
  }
  return [];
}

export function toDisplayPeriod(code: string): string | null {
  const raw = code.trim().toUpperCase();
  if (raw === "M" || raw === "N" || /^[A-D]$/u.test(raw)) return raw;
  if (/^\d{1,2}$/u.test(raw)) {
    const n = Number(raw);
    if (n >= 1 && n <= 9) return String(n);
  }
  return null;
}

export function toDbPeriod(period: string): string {
  if (period === "M" || period === "N" || /^[A-D]$/u.test(period)) return period;
  const n = Number(period);
  if (n >= 1 && n <= 9) return String(n).padStart(2, "0");
  return period;
}

export function formatSlotsLabel(slots: TimeSlot[]): string {
  if (slots.length === 0) return "不拘";
  const byDay = new Map<number, string[]>();
  for (const slot of sortSlots(slots)) {
    const periods = byDay.get(slot.weekday) ?? [];
    periods.push(toDbPeriod(slot.period));
    byDay.set(slot.weekday, periods);
  }
  const meetings: Meeting[] = [...byDay.entries()].map(([weekday, periods]) => ({
    weekday,
    periods,
  }));
  return formatMeetings(meetings);
}

export function sortSlots(slots: TimeSlot[]): TimeSlot[] {
  return [...slots].sort((a, b) => {
    if (a.weekday !== b.weekday) return a.weekday - b.weekday;
    return (PERIOD_RANK[a.period] ?? 99) - (PERIOD_RANK[b.period] ?? 99);
  });
}

export function slotKey(weekday: number, period: string): string {
  return `${weekday}-${period}`;
}
