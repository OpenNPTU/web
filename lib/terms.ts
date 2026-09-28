export type TermSeason = 1 | 2 | 3;

export type Term = {
  year: number;
  semester: number;
};

export const TERM_SEASONS: Array<{ value: TermSeason; label: string; long: string }> = [
  { value: 3, label: "暑", long: "暑期" },
  { value: 1, label: "上", long: "上學期" },
  { value: 2, label: "下", long: "下學期" },
];

export function parseTermValue(value: string): Term | null {
  const match = /^(\d+)-([123])$/u.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), semester: Number(match[2]) as TermSeason };
}

export function serializeTerm(year: number, semester: number): string {
  return `${year}-${semester}`;
}

export function seasonLabel(semester: number): string {
  return TERM_SEASONS.find((season) => season.value === semester)?.label ?? String(semester);
}

export function formatTermShort(year: number, semester: number): string {
  return `${year} ${seasonLabel(semester)}`;
}

export function formatTermLong(year: number, semester: number): string {
  const long = TERM_SEASONS.find((season) => season.value === semester)?.long ?? `第${semester}學期`;
  return `${year}學年度${long}`;
}
