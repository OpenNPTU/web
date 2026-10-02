// Parser for A0515S 查詢選課結果及選課清單 (../A05/A0515SPage.aspx).
//
// The 個人課表 menu page (A0551R) is only a PDF report generator, so the
// weekly timetable is rebuilt from the course-selection result list instead.
// Weekday/period cells arrive as bracket groups: 星期 [4], 節次 [050607];
// multi-day courses repeat the groups ([1][3] / [0203][0506]).

import type { TimetableCourse } from "@/lib/timetable";
import { bracketGroups, findTableByHeader, selectOptions, selectSelected, tableRows } from "./html";

export type ScheduleCourse = {
  className: string;
  courseNo: string;
  code: string;
  title: string;
  elective: string;
  credits: number | null;
  teacher: string;
  room: string;
  meetings: Array<{ weekday: number; periods: string[] }>;
  note: string;
};

export type ScheduleReport = {
  semesterOptions: Array<{ value: string; label: string }>;
  selectedSemester: { value: string; label: string } | null;
  studentId: string;
  name: string;
  className: string;
  creditsTotal: string;
  courses: ScheduleCourse[];
};

export const SCHEDULE_EVENT_TARGET = "A0515SMenu$ddlSYSE";

export function scheduleSemesterFields(value: string): Record<string, string> {
  return { "A0515SMenu:ddlSYSE": value };
}

export function parseSchedule(html: string): ScheduleReport {
  const header = parseHeader(html);
  return {
    semesterOptions: selectOptions(html, "ddlSYSE")
      .filter((option) => option.value)
      .map(({ value, label }) => ({ value, label })),
    selectedSemester: (() => {
      const selected = selectSelected(html, "ddlSYSE");
      return selected ? { value: selected.value, label: selected.label } : null;
    })(),
    ...header,
    courses: parseCourses(html),
  };
}

function parseHeader(html: string): Pick<ScheduleReport, "studentId" | "name" | "className" | "creditsTotal"> {
  const row = tableRows(html)
    .map((cells) => cells.join(" "))
    .find((text) => /學號[：:]/.test(text) && /姓名[：:]/.test(text));
  const text = row ?? "";
  const pick = (pattern: RegExp) => pattern.exec(text)?.[1]?.trim() ?? "";
  return {
    studentId: pick(/學號[：:]\s*([A-Za-z0-9]+)/),
    name: pick(/姓名[：:]\s*([^\s]+)/),
    className: pick(/班級[：:]\s*(.+?)(?:\s+學分合計|$)/),
    creditsTotal: pick(/學分合計[：:]\s*([\d.]+)/),
  };
}

function parseCourses(html: string): ScheduleCourse[] {
  const table = findTableByHeader(html, [
    "開課號",
    "科目代碼",
    "科目名稱",
    "選修別",
    "學分",
    "授課教師",
    "上課地點",
    "星期",
    "節次",
  ]);
  if (!table) return [];

  const index = (name: string) => table.header.indexOf(name);
  const col = {
    className: index("班級"),
    courseNo: index("開課號"),
    code: index("科目代碼"),
    title: index("科目名稱"),
    elective: index("選修別"),
    credits: index("學分"),
    teacher: index("授課教師"),
    room: index("上課地點"),
    weekday: index("星期"),
    periods: index("節次"),
    note: index("備註"),
  };

  const courses: ScheduleCourse[] = [];
  for (const cells of table.rows) {
    const code = cells[col.code] ?? "";
    const title = cells[col.title] ?? "";
    if (!code && !title) continue;
    const at = (i: number) => (i >= 0 ? cells[i] ?? "" : "");
    courses.push({
      className: at(col.className),
      courseNo: at(col.courseNo),
      code,
      title,
      elective: at(col.elective),
      credits: Number(at(col.credits)) || null,
      teacher: at(col.teacher),
      room: at(col.room),
      meetings: parseMeetings(at(col.weekday), at(col.periods)),
      note: at(col.note),
    });
  }
  return courses;
}

function parseMeetings(weekdayCell: string, periodCell: string): ScheduleCourse["meetings"] {
  const weekdays = bracketGroups(weekdayCell);
  const periodRuns = bracketGroups(periodCell);
  if (weekdays.length === 0) return [];
  return weekdays.map((weekday, i) => ({
    weekday: Number(weekday) || 0,
    periods: (periodRuns[i] ?? periodRuns[0] ?? "")
      .match(/\d{2}|[A-D]/g) ?? [],
  }));
}

/** Maps selection-result rows onto the timetable grid's course shape. */
export function toTimetableCourses(report: ScheduleReport): TimetableCourse[] {
  const courses: TimetableCourse[] = [];
  for (const course of report.courses) {
    course.meetings.forEach((meeting, meetingIndex) => {
      if (meeting.weekday < 1 || meeting.periods.length === 0) return;
      const first = meeting.periods[0];
      const last = meeting.periods[meeting.periods.length - 1];
      courses.push({
        id: `${course.code}-${course.courseNo}-${meetingIndex}`,
        code: course.code,
        name: course.title,
        teacher: course.teacher.replace(/\(\d+\)$/, ""),
        room: course.room.replace(/\s*\(\d+人\)\s*$/u, "").trim(),
        weekday: meeting.weekday,
        start: PERIOD_TIMES[first]?.start ?? "00:00",
        end: PERIOD_TIMES[last]?.end ?? "00:00",
        periods: formatPeriodRun(meeting.periods),
        type: course.elective === "必" ? "必修" : "選修",
        credits: meetingIndex === 0 ? course.credits ?? 0 : 0,
      });
    });
  }
  return courses;
}

/**
 * Approximate bell times for the 「進行中」 badge and the detail panel — the
 * upstream never exposes period clock times in HTML. Adjust if the school
 * publishes different hours.
 */
export const PERIOD_TIMES: Record<string, { start: string; end: string }> = {
  M: { start: "07:10", end: "08:00" },
  "01": { start: "08:10", end: "09:00" },
  "02": { start: "09:10", end: "10:00" },
  "03": { start: "10:10", end: "11:00" },
  "04": { start: "11:10", end: "12:00" },
  N: { start: "12:10", end: "13:00" },
  "05": { start: "13:10", end: "14:00" },
  "06": { start: "14:10", end: "15:00" },
  "07": { start: "15:10", end: "16:00" },
  "08": { start: "16:10", end: "17:00" },
  "09": { start: "17:10", end: "18:00" },
  A: { start: "18:10", end: "19:00" },
  B: { start: "19:05", end: "19:55" },
  C: { start: "20:00", end: "20:50" },
  D: { start: "20:55", end: "21:45" },
};

function formatPeriodRun(periods: string[]): string {
  const first = periods[0];
  const last = periods[periods.length - 1];
  if (!first) return "";
  const label = (code: string) => (/[A-D]/.test(code) ? `夜${code}` : String(Number(code)));
  return first === last ? label(first) : `${label(first)}–${label(last)}`;
}
