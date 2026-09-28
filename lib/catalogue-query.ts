export type CatalogueQuery = {
  q: string;
  year: number;
  semester: number;
  dept: string;
  weekday: string;
  period: string;
  tag: string;
  elective: string;
  page: number;
};

export function parseCatalogueQuery(
  params: Record<string, string | string[] | undefined>,
  fallback: { year: number; semester: number },
): CatalogueQuery {
  const term = one(params.term);
  const match = /^(\d+)-([123])$/u.exec(term);
  const page = Number(one(params.page));
  return {
    q: one(params.q).trim(),
    year: match ? Number(match[1]) : fallback.year,
    semester: match ? Number(match[2]) : fallback.semester,
    dept: one(params.dept).trim(),
    weekday: /^[1-7]$/u.test(one(params.weekday)) ? one(params.weekday) : "",
    period: one(params.period).trim(),
    tag: one(params.tag).trim(),
    elective: one(params.elective).trim(),
    page: Number.isFinite(page) && page > 1 ? Math.floor(page) : 1,
  };
}

export function catalogueHref(
  query: CatalogueQuery,
  patch: Partial<CatalogueQuery> = {},
): string {
  const next = { ...query, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  params.set("term", `${next.year}-${next.semester}`);
  if (next.dept) params.set("dept", next.dept);
  if (next.weekday) params.set("weekday", next.weekday);
  if (next.period) params.set("period", next.period);
  if (next.tag) params.set("tag", next.tag);
  if (next.elective) params.set("elective", next.elective);
  if (next.page > 1) params.set("page", String(next.page));
  return `/dashboard/courses?${params.toString()}`;
}

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
