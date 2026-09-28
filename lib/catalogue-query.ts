import { parseSlotsParam, serializeSlots, slotsFromLegacy, type TimeSlot } from "@/lib/slots";

export type CatalogueQuery = {
  q: string;
  year: number;
  semester: number;
  dept: string;
  slots: TimeSlot[];
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
    slots: parseSlots(params),
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
  const slots = serializeSlots(next.slots);
  if (slots) params.set("slots", slots);
  if (next.tag) params.set("tag", next.tag);
  if (next.elective) params.set("elective", next.elective);
  if (next.page > 1) params.set("page", String(next.page));
  return `/dashboard/courses?${params.toString()}`;
}

function parseSlots(params: Record<string, string | string[] | undefined>): TimeSlot[] {
  const slots = parseSlotsParam(one(params.slots));
  if (slots.length) return slots;
  return slotsFromLegacy(one(params.weekday), one(params.period));
}

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
