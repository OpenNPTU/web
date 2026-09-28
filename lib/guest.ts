export const guestUser = {
  name: "訪客",
  studentId: "guest",
  department: "國立屏東大學",
  className: "訪客",
};

const WEEKDAY_SHORT = ["日", "一", "二", "三", "四", "五", "六"];

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
