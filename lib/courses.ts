// Server-side course catalogue. Open data/courses.sqlite and query sections.

import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const SCHEMA_VERSION = "1";

export type Teacher = {
  id: string;
  name: string;
};

export type Meeting = {
  weekday: number;
  periods: string[];
};

export type Section = {
  id: number;
  schoolYear: number;
  semester: number;
  deptCode: string;
  dept: string;
  courseNo: string;
  code: string;
  title: string;
  titleZh: string;
  titleEn: string;
  elective: string;
  creditsTotal: number | null;
  credits: number | null;
  capacity: number | null;
  enrolled: number | null;
  openSeats: number | null;
  room: string;
  roomSeats: number | null;
  prerequisites: string;
  note: string;
  tags: string[];
  teachers: Teacher[];
  meetings: Meeting[];
};

export type CourseQuery = {
  year?: number;
  semester?: number;
  text?: string;
  dept?: string;
  teacher?: string;
  code?: string;
  weekday?: number;
  period?: string;
  tag?: string;
  elective?: string;
  openSeatsOnly?: boolean;
  limit?: number;
  offset?: number;
};

export type SearchResult = {
  total: number;
  sections: Section[];
};

export type SemesterSummary = {
  schoolYear: number;
  semester: number;
  label: string;
  sections: number;
};

export type DepartmentSummary = {
  dept: string;
  sections: number;
};

export type TagSummary = {
  tag: string;
  sections: number;
};

export type TeacherSummary = {
  id: string;
  name: string;
  sections: number;
};

type SqlValue = string | number | null;
type SqlParams = Record<string, SqlValue>;

export type CourseDb = {
  file: string;
  search(query?: CourseQuery): SearchResult;
  get(id: number): Section | null;
  semesters(): SemesterSummary[];
  departments(filter?: { year?: number; semester?: number }): DepartmentSummary[];
  tags(): TagSummary[];
  teachers(filter?: {
    year?: number;
    semester?: number;
    text?: string;
    limit?: number;
  }): TeacherSummary[];
  close(): void;
};

let singleton: CourseDb | undefined;

export function courses(): CourseDb {
  const file = defaultPath();
  if (!singleton || singleton.file !== file) {
    singleton?.close();
    singleton = openCourseDb(file);
  }
  return singleton;
}

export function openCourseDb(file = defaultPath()): CourseDb {
  if (!fs.existsSync(file)) {
    throw new Error(`Course database not found at ${file}.`);
  }
  const db = new DatabaseSync(file, { readOnly: true });
  const version = db.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get();
  if (!version || version.value !== SCHEMA_VERSION) {
    db.close();
    throw new Error(
      `Course database schema is ${String(version?.value)}, expected ${SCHEMA_VERSION}.`,
    );
  }

  const api: CourseDb = {
    file,
    search(query = {}) {
      const { where, params } = filters(query);
      const limit = clamp(query.limit, 40, 1, 200);
      const offset = Math.max(0, query.offset ?? 0);
      const total = number(
        db
          .prepare(`SELECT COUNT(*) AS n FROM sections s ${where}`)
          .get(params)?.n,
      );
      const ids = db
        .prepare(
          `SELECT s.id AS id FROM sections s ${where}
           ORDER BY s.school_year DESC, s.semester, s.dept, s.course_no
           LIMIT @limit OFFSET @offset`,
        )
        .all({ ...params, limit, offset })
        .map((row) => number(row.id));
      return { total, sections: hydrate(db, ids) };
    },
    get(id) {
      return hydrate(db, [id])[0] ?? null;
    },
    semesters() {
      return db
        .prepare(
          `SELECT school_year, semester, label, sections
           FROM semesters
           ORDER BY school_year DESC, semester`,
        )
        .all()
        .map((row) => ({
          schoolYear: number(row.school_year),
          semester: number(row.semester),
          label: text(row.label),
          sections: number(row.sections),
        }));
    },
    departments(filter = {}) {
      const where: string[] = [];
      const params: SqlParams = {};
      if (filter.year != null) {
        where.push("school_year = @year");
        params.year = filter.year;
      }
      if (filter.semester != null) {
        where.push("semester = @semester");
        params.semester = filter.semester;
      }
      const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
      return db
        .prepare(
          `SELECT dept, COUNT(*) AS sections
           FROM sections
           ${clause}
           GROUP BY dept
           ORDER BY sections DESC, dept`,
        )
        .all(params)
        .map((row) => ({
          dept: text(row.dept),
          sections: number(row.sections),
        }));
    },
    tags() {
      return db
        .prepare(
          `SELECT tag, COUNT(*) AS sections
           FROM section_tags
           GROUP BY tag
           ORDER BY sections DESC, tag`,
        )
        .all()
        .map((row) => ({
          tag: text(row.tag),
          sections: number(row.sections),
        }));
    },
    teachers(filter = {}) {
      const where: string[] = [];
      const params: SqlParams = {
        limit: clamp(filter.limit, 20, 1, 100),
      };
      if (filter.year != null) {
        where.push("s.school_year = @year");
        params.year = filter.year;
      }
      if (filter.semester != null) {
        where.push("s.semester = @semester");
        params.semester = filter.semester;
      }
      const teacher = filter.text?.trim();
      if (teacher) {
        where.push("(t.name LIKE @teacher_like ESCAPE '\\' OR t.id = @teacher)");
        params.teacher_like = likeContains(teacher);
        params.teacher = teacher;
      }
      const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
      return db
        .prepare(
          `SELECT t.id AS id, t.name AS name, COUNT(*) AS sections
           FROM teachers t
           JOIN section_teachers st ON st.teacher_id = t.id
           JOIN sections s ON s.id = st.section_id
           ${clause}
           GROUP BY t.id
           ORDER BY sections DESC, t.name
           LIMIT @limit`,
        )
        .all(params)
        .map((row) => ({
          id: text(row.id),
          name: text(row.name),
          sections: number(row.sections),
        }));
    },
    close() {
      db.close();
      if (singleton === api) singleton = undefined;
    },
  };
  return api;
}

function defaultPath() {
  return process.env.COURSES_DB ?? path.join(process.cwd(), "data", "courses.sqlite");
}

function filters(query: CourseQuery): { where: string; params: SqlParams } {
  const where: string[] = [];
  const params: SqlParams = {};

  if (query.year != null) {
    where.push("s.school_year = @year");
    params.year = query.year;
  }
  if (query.semester != null) {
    where.push("s.semester = @semester");
    params.semester = query.semester;
  }
  if (query.dept) {
    where.push("s.dept = @dept");
    params.dept = query.dept;
  }
  if (query.code) {
    where.push("s.code = @code");
    params.code = query.code;
  }
  if (query.elective) {
    where.push("s.elective = @elective");
    params.elective = query.elective;
  }
  if (query.openSeatsOnly) {
    where.push("s.open_seats > 0");
  }
  if (query.tag) {
    where.push(
      "s.id IN (SELECT section_id FROM section_tags WHERE tag = @tag)",
    );
    params.tag = query.tag;
  }

  const teacher = query.teacher?.trim();
  if (teacher) {
    where.push(
      `s.id IN (
        SELECT st.section_id
        FROM section_teachers st
        JOIN teachers t ON t.id = st.teacher_id
        WHERE t.name LIKE @teacher_like ESCAPE '\\' OR t.id = @teacher
      )`,
    );
    params.teacher_like = likeContains(teacher);
    params.teacher = teacher;
  }

  if (query.weekday != null || query.period) {
    const parts = ["1 = 1"];
    if (query.weekday != null) {
      parts.push("m.weekday = @weekday");
      params.weekday = query.weekday;
    }
    if (query.period) {
      parts.push(
        `EXISTS (
          SELECT 1 FROM meeting_periods p
          WHERE p.section_id = m.section_id AND p.ord = m.ord AND p.period = @period
        )`,
      );
      params.period = query.period;
    }
    where.push(
      `s.id IN (SELECT m.section_id FROM meetings m WHERE ${parts.join(" AND ")})`,
    );
  }

  const text = query.text?.trim();
  if (text) {
    const fts = ftsQuery(text);
    if (fts) {
      where.push(
        "s.id IN (SELECT rowid FROM section_fts WHERE section_fts MATCH @fts)",
      );
      params.fts = fts;
    } else {
      where.push(
        `(
          s.title LIKE @text_like ESCAPE '\\'
          OR s.code LIKE @text_like ESCAPE '\\'
          OR s.course_no LIKE @text_like ESCAPE '\\'
          OR s.dept LIKE @text_like ESCAPE '\\'
          OR s.id IN (
            SELECT st.section_id
            FROM section_teachers st
            JOIN teachers t ON t.id = st.teacher_id
            WHERE t.name LIKE @text_like ESCAPE '\\' OR t.id = @text_exact
          )
          OR s.id IN (SELECT section_id FROM section_tags WHERE tag = @text_exact)
        )`,
      );
      params.text_like = likeContains(text);
      params.text_exact = text;
    }
  }

  return {
    where: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
  };
}

function hydrate(db: DatabaseSync, ids: number[]): Section[] {
  if (ids.length === 0) return [];
  const { clause, params } = namedIds(ids);
  const sections = new Map<number, Section>();
  for (const row of db
    .prepare(`SELECT * FROM sections WHERE id IN (${clause})`)
    .all(params)) {
    const id = number(row.id);
    sections.set(id, {
      id,
      schoolYear: number(row.school_year),
      semester: number(row.semester),
      deptCode: text(row.dept_code),
      dept: text(row.dept),
      courseNo: text(row.course_no),
      code: text(row.code),
      title: text(row.title),
      titleZh: text(row.title_zh),
      titleEn: text(row.title_en),
      elective: text(row.elective),
      creditsTotal: nullableNumber(row.credits_total),
      credits: nullableNumber(row.credits),
      capacity: nullableNumber(row.capacity),
      enrolled: nullableNumber(row.enrolled),
      openSeats: nullableNumber(row.open_seats),
      room: text(row.room),
      roomSeats: nullableNumber(row.room_seats),
      prerequisites: text(row.prerequisites),
      note: text(row.note),
      tags: [],
      teachers: [],
      meetings: [],
    });
  }

  for (const row of db
    .prepare(
      `SELECT st.section_id, st.ord, t.id AS teacher_id, t.name
       FROM section_teachers st
       JOIN teachers t ON t.id = st.teacher_id
       WHERE st.section_id IN (${clause})
       ORDER BY st.section_id, st.ord`,
    )
    .all(params)) {
    sections.get(number(row.section_id))?.teachers.push({
      id: text(row.teacher_id),
      name: text(row.name),
    });
  }

  const meetings = new Map<string, Meeting>();
  for (const row of db
    .prepare(
      `SELECT section_id, ord, weekday
       FROM meetings
       WHERE section_id IN (${clause})
       ORDER BY section_id, ord`,
    )
    .all(params)) {
    const meeting: Meeting = { weekday: number(row.weekday), periods: [] };
    meetings.set(`${number(row.section_id)}:${number(row.ord)}`, meeting);
    sections.get(number(row.section_id))?.meetings.push(meeting);
  }
  for (const row of db
    .prepare(
      `SELECT p.section_id, p.ord, p.period
       FROM meeting_periods p
       JOIN period_codes c ON c.code = p.period
       WHERE p.section_id IN (${clause})
       ORDER BY p.section_id, p.ord, c.sort_order`,
    )
    .all(params)) {
    meetings
      .get(`${number(row.section_id)}:${number(row.ord)}`)
      ?.periods.push(text(row.period));
  }

  for (const row of db
    .prepare(
      `SELECT section_id, tag
       FROM section_tags
       WHERE section_id IN (${clause})
       ORDER BY tag`,
    )
    .all(params)) {
    sections.get(number(row.section_id))?.tags.push(text(row.tag));
  }

  return ids.flatMap((id) => {
    const section = sections.get(id);
    return section ? [section] : [];
  });
}

function namedIds(ids: number[]): { clause: string; params: SqlParams } {
  const params: SqlParams = {};
  const clause = ids
    .map((id, index) => {
      params[`id${index}`] = id;
      return `@id${index}`;
    })
    .join(", ");
  return { clause, params };
}

function ftsQuery(text: string): string | null {
  const tokens = text
    .split(/\s+/)
    .map((token) => token.replaceAll('"', ""))
    .filter((token) => token.length >= 3);
  if (tokens.length === 0) return null;
  return tokens.map((token) => `"${token}"`).join(" ");
}

function likeContains(text: string): string {
  const escaped = text.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
  return `%${escaped}%`;
}

function clamp(value: number | undefined, fallback: number, min: number, max: number) {
  const picked = value ?? fallback;
  return Math.min(max, Math.max(min, picked));
}

function number(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  return 0;
}

function nullableNumber(value: unknown): number | null {
  if (value == null) return null;
  return number(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}
