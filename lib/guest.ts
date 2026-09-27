export const guestUser = {
  name: "訪客",
  studentId: "guest",
  department: "國立屏東大學",
  className: "訪客",
};

export const semesterLabel = "115 學年度 第 1 學期";

export type GuestCourse = {
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

export const guestCourses: GuestCourse[] = [
  {
    id: "c1",
    code: "CS2101",
    name: "資料結構",
    teacher: "王建民",
    room: "E301",
    weekday: 1,
    start: "08:10",
    end: "10:00",
    periods: "第 1–2 節",
    type: "必修",
    credits: 3,
  },
  {
    id: "c2",
    code: "MA2003",
    name: "線性代數",
    teacher: "陳怡君",
    room: "S204",
    weekday: 1,
    start: "10:10",
    end: "12:00",
    periods: "第 3–4 節",
    type: "必修",
    credits: 3,
  },
  {
    id: "c3",
    code: "CS2203",
    name: "計算機組織",
    teacher: "林志明",
    room: "E302",
    weekday: 2,
    start: "08:10",
    end: "10:00",
    periods: "第 1–2 節",
    type: "必修",
    credits: 3,
  },
  {
    id: "c4",
    code: "EN1102",
    name: "英文（二）",
    teacher: "Sarah Chen",
    room: "L105",
    weekday: 2,
    start: "10:10",
    end: "12:00",
    periods: "第 3–4 節",
    type: "必修",
    credits: 2,
  },
  {
    id: "c5",
    code: "MA2105",
    name: "離散數學",
    teacher: "陳怡君",
    room: "S204",
    weekday: 3,
    start: "08:10",
    end: "10:00",
    periods: "第 1–2 節",
    type: "必修",
    credits: 3,
  },
  {
    id: "c6",
    code: "CS2305",
    name: "物件導向程式設計",
    teacher: "黃柏翰",
    room: "E-Lab1",
    weekday: 3,
    start: "13:10",
    end: "16:00",
    periods: "第 5–7 節",
    type: "選修",
    credits: 3,
  },
  {
    id: "c7",
    code: "PE2001",
    name: "體育",
    teacher: "張家豪",
    room: "體育館",
    weekday: 4,
    start: "10:10",
    end: "12:00",
    periods: "第 3–4 節",
    type: "必修",
    credits: 0,
  },
  {
    id: "c8",
    code: "CS2102",
    name: "資料結構實習",
    teacher: "王建民",
    room: "E-Lab2",
    weekday: 4,
    start: "13:10",
    end: "15:00",
    periods: "第 5–6 節",
    type: "必修",
    credits: 1,
  },
  {
    id: "c9",
    code: "MA2210",
    name: "機率與統計",
    teacher: "李美玲",
    room: "S201",
    weekday: 5,
    start: "08:10",
    end: "10:00",
    periods: "第 1–2 節",
    type: "必修",
    credits: 3,
  },
  {
    id: "c10",
    code: "GE3012",
    name: "科技與社會",
    teacher: "劉思妤",
    room: "H102",
    weekday: 5,
    start: "13:10",
    end: "15:00",
    periods: "第 5–6 節",
    type: "通識",
    credits: 2,
  },
];

export type GradeRecord = {
  code: string;
  name: string;
  type: "必修" | "選修" | "通識";
  credits: number;
  score: number;
};

export const gradesBySemester: Record<string, GradeRecord[]> = {
  "114-2": [
    { code: "CS1202", name: "程式設計（二）", type: "必修", credits: 3, score: 91 },
    { code: "MA1102", name: "微積分（二）", type: "必修", credits: 3, score: 84 },
    { code: "PH1102", name: "普通物理（二）", type: "必修", credits: 3, score: 78 },
    { code: "EN1101", name: "英文（一）", type: "必修", credits: 2, score: 88 },
    { code: "CS1210", name: "數位邏輯", type: "必修", credits: 3, score: 86 },
    { code: "GE2008", name: "藝術與生活", type: "通識", credits: 2, score: 93 },
  ],
  "114-1": [
    { code: "CS1201", name: "程式設計（一）", type: "必修", credits: 3, score: 89 },
    { code: "MA1101", name: "微積分（一）", type: "必修", credits: 3, score: 76 },
    { code: "PH1101", name: "普通物理（一）", type: "必修", credits: 3, score: 72 },
    { code: "CS1001", name: "計算機概論", type: "必修", credits: 3, score: 94 },
    { code: "CH1001", name: "大學國文", type: "必修", credits: 2, score: 85 },
    { code: "GE1103", name: "哲學思辨", type: "通識", credits: 2, score: 58 },
  ],
};

export const gradeSemesters = [
  { value: "114-2", label: "114 學年度 第 2 學期" },
  { value: "114-1", label: "114 學年度 第 1 學期" },
];

export type AttendanceKind = "遲到" | "病假" | "事假" | "曠課";

export type AttendanceRecord = {
  date: string;
  course: string;
  periods: string;
  kind: AttendanceKind;
  status: "已核准" | "審核中" | "—";
};

export const attendanceRecords: AttendanceRecord[] = [
  { date: "09/29", course: "線性代數", periods: "第 3 節", kind: "遲到", status: "—" },
  { date: "09/24", course: "物件導向程式設計", periods: "第 5–7 節", kind: "病假", status: "已核准" },
  { date: "09/22", course: "資料結構", periods: "第 1–2 節", kind: "事假", status: "審核中" },
  { date: "09/18", course: "體育", periods: "第 3–4 節", kind: "曠課", status: "—" },
  { date: "09/15", course: "英文（二）", periods: "第 3 節", kind: "遲到", status: "—" },
];

export const attendanceKinds: AttendanceKind[] = ["遲到", "病假", "事假", "曠課"];

export type Announcement = {
  id: string;
  unit: string;
  title: string;
  date: string;
  pinned?: boolean;
};

export const announcements: Announcement[] = [
  {
    id: "n1",
    unit: "教務處",
    title: "115-1 加退選第二階段將於 10/3 17:00 截止",
    date: "09/28",
    pinned: true,
  },
  { id: "n2", unit: "學務處", title: "期中考週請假規定與補考申請流程說明", date: "09/26" },
  { id: "n3", unit: "資訊工程學系", title: "大學部專題說明會：10/7（二）第 8 節 E301", date: "09/25" },
  { id: "n4", unit: "圖書館", title: "總圖二樓自習區 10 月起延長開放至 23:00", date: "09/23" },
];

const WEEKDAY_SHORT = ["日", "一", "二", "三", "四", "五", "六"];

export const weekdays = [
  { value: 1, label: "週一" },
  { value: 2, label: "週二" },
  { value: 3, label: "週三" },
  { value: 4, label: "週四" },
  { value: 5, label: "週五" },
];

export const periodSlots = ["1", "2", "3", "4", "N", "5", "6", "7", "8"] as const;

export function coursePeriod(course: GuestCourse) {
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

function taipeiParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei",
    weekday: "short",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    weekday: weekdayMap[pick("weekday")] ?? 0,
    year: Number(pick("year")),
    month: Number(pick("month")),
    day: Number(pick("day")),
    hour: Number(pick("hour")),
    minute: Number(pick("minute")),
  };
}

export function taipeiClock(date = new Date()) {
  const now = taipeiParts(date);
  return {
    ...now,
    time: `${String(now.hour).padStart(2, "0")}:${String(now.minute).padStart(2, "0")}`,
  };
}

export function greetingForHour(hour: number) {
  if (hour < 11) return "早安";
  if (hour < 18) return "午安";
  return "晚安";
}

export function dateLabel(date = new Date()) {
  const now = taipeiParts(date);
  return `${now.year} 年 ${now.month} 月 ${now.day} 日 週${WEEKDAY_SHORT[now.weekday]}`;
}

export function isInProgress(course: GuestCourse, date = new Date()) {
  const now = taipeiClock(date);
  if (course.weekday !== now.weekday) return false;
  return now.time >= course.start && now.time <= course.end;
}

export function isPast(course: GuestCourse, date = new Date()) {
  const now = taipeiClock(date);
  if (course.weekday !== now.weekday) return false;
  return now.time > course.end;
}
