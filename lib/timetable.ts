export type TimetableCourse = {
  id: string;
  code: string;
  name: string;
  teacher: string;
  room: string;
  weekday: number;
  start: string;
  end: string;
  periods: string;
  type: "必修" | "選修" | "通識";
  credits: number;
};

export const weekdays = [
  { value: 1, label: "週一" },
  { value: 2, label: "週二" },
  { value: 3, label: "週三" },
  { value: 4, label: "週四" },
  { value: 5, label: "週五" },
];

export const periodSlots = ["1", "2", "3", "4", "N", "5", "6", "7", "8"] as const;

export function coursePeriod(course: TimetableCourse) {
  const match = course.periods.match(/(\d+)(?:\s*[–−-]\s*(\d+))?/);
  const period = Number(match?.[1] ?? 1);
  const last = Number(match?.[2] ?? period);
  return { period, span: last - period + 1 };
}

export function gridRowFor(period: number | string) {
  if (period === "N") return 6;
  const n = Number(period);
  return n <= 4 ? n + 1 : n + 2;
}

export function isInProgress(course: TimetableCourse, time: string, weekday: number) {
  if (course.weekday !== weekday) return false;
  return time >= course.start && time <= course.end;
}
