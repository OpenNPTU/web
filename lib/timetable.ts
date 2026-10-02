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

export type UpcomingClass = {
  course: TimetableCourse;
  dayLabel: string;
  live: boolean;
};

/**
 * The class currently in session, or the next one to start. Times are
 * "HH:MM" strings compared as numbers; weekends fall out naturally (no
 * course ever matches weekday 0/6, so the earliest class of the week wins).
 */
export function nextClass(
  courses: TimetableCourse[],
  now: { weekday: number; time: string },
): UpcomingClass | null {
  if (courses.length === 0) return null;

  const live = courses.find((course) => isInProgress(course, now.time, now.weekday));
  if (live) return { course: live, dayLabel: "今天", live: true };

  const key = (weekday: number, time: string) =>
    weekday * 10000 + Number(time.replace(":", ""));
  const sorted = courses
    .slice()
    .sort((a, b) => key(a.weekday, a.start) - key(b.weekday, b.start));
  const upcoming =
    sorted.find((course) => key(course.weekday, course.start) > key(now.weekday, now.time)) ??
    sorted[0];
  if (!upcoming) return null;

  const nextWeekday = now.weekday >= 5 ? 1 : now.weekday + 1;
  const dayLabel =
    upcoming.weekday === now.weekday
      ? "今天"
      : upcoming.weekday === nextWeekday
        ? "明天"
        : (weekdays.find((day) => day.value === upcoming.weekday)?.label ??
          `週${upcoming.weekday}`);
  return { course: upcoming, dayLabel, live: false };
}
