import type { Meeting } from "@/lib/courses";

const WEEK = ["", "一", "二", "三", "四", "五", "六", "日"];

const PERIOD_ORDER = [
  "M",
  "01",
  "02",
  "03",
  "04",
  "N",
  "05",
  "06",
  "07",
  "08",
  "09",
  "A",
  "B",
  "C",
  "D",
];

const PERIOD_LABEL: Record<string, string> = {
  M: "晨",
  N: "午",
  A: "夜A",
  B: "夜B",
  C: "夜C",
  D: "夜D",
};

export const PERIOD_OPTIONS = PERIOD_ORDER.map((value) => ({
  value,
  label: PERIOD_LABEL[value] ?? `第${Number(value)}節`,
}));

export const WEEKDAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7].map((day) => ({
  value: String(day),
  label: `週${WEEK[day]}`,
}));

export const TAG_LABEL: Record<string, string> = {
  AI: "AI",
  EMI: "全英",
  遠: "遠距",
  程: "程式",
  屏: "屏東學",
};

export const ELECTIVE_OPTIONS = [
  { value: "必", label: "必修" },
  { value: "選", label: "選修" },
  { value: "重", label: "重修" },
];

export function electiveLabel(value: string): string {
  return ELECTIVE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function formatMeetings(meetings: Meeting[]): string {
  if (meetings.length === 0) return "時間未定";
  return meetings
    .map((meeting) => {
      const day = WEEK[meeting.weekday] ?? String(meeting.weekday);
      const periods = formatPeriods(meeting.periods);
      return periods ? `週${day} ${periods}` : `週${day}`;
    })
    .join("、");
}

export function formatRoom(room: string): string {
  return room.replace(/\s*\(\d+人\)\s*$/u, "").trim();
}

export function formatCredits(credits: number | null): string {
  if (credits == null) return "";
  const text = Number.isInteger(credits) ? String(credits) : String(credits);
  return `${text} 學分`;
}

function formatPeriods(periods: string[]): string {
  if (periods.length === 0) return "";
  const runs: string[][] = [];
  periods.forEach((period, index) => {
    const previous = index === 0 ? null : periods[index - 1];
    const continues = previous != null && sameRun(previous, period);
    const current = runs[runs.length - 1];
    if (continues && current) current.push(period);
    else runs.push([period]);
  });
  return runs
    .map((run) => {
      const first = run[0];
      const last = run[run.length - 1];
      if (!first || !last) return "";
      if (run.length < 2) return periodLabel(first);
      return `${periodLabel(first)}–${periodLabel(last, true)}`;
    })
    .filter(Boolean)
    .join("、");
}

function sameRun(previous: string, current: string): boolean {
  if (/^\d{2}$/u.test(previous) && /^\d{2}$/u.test(current)) {
    return Number(current) === Number(previous) + 1;
  }
  const letters = "ABCD";
  const from = letters.indexOf(previous);
  return from >= 0 && letters.indexOf(current) === from + 1;
}

function periodLabel(code: string, compact = false): string {
  if (code === "M") return "晨";
  if (code === "N") return "午";
  if ("ABCD".includes(code)) return compact ? code : `夜${code}`;
  return String(Number(code));
}
