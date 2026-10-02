// Parser for A0809Q 歷年成績查詢 (../A08/A0809QPage.aspx).
//
// Upstream quirk kept faithfully: the grid's 課程名稱 column actually holds the
// course category (專業課程 / 通識課程 / ...), while 科目 holds "CODE 名稱".
// The original UI mislabels both; we expose them under honest names.

import { findTableByHeader, selectOptions, selectSelected } from "./html";

export type GradeSemesterOption = { value: string; label: string };

export type GradeRow = {
  year: string;
  semester: string;
  code: string;
  title: string;
  category: string;
  elective: string;
  credits: number | null;
  score: string;
  passed: string;
};

export type GradeSummary = {
  average: string | null;
  classRank: string | null;
  creditsEarned: string | null;
  conduct: string | null;
};

export type GradeReport = {
  semesterOptions: GradeSemesterOption[];
  selectedSemester: GradeSemesterOption | null;
  summary: GradeSummary;
  rows: GradeRow[];
};

export function parseGrades(html: string): GradeReport {
  const semesterOptions = selectOptions(html, "ddlSYSE")
    .filter((option) => option.value)
    .map(({ value, label }) => ({ value, label }));

  const selected = selectSelected(html, "ddlSYSE");

  return {
    semesterOptions,
    selectedSemester: selected ? { value: selected.value, label: selected.label } : null,
    summary: parseSummary(html),
    rows: parseRows(html),
  };
}

/** Switches the report to another semester via the ddlSYSE postback. */
export function gradesSemesterFields(value: string): Record<string, string> {
  return { "A0809Q:ddlSYSE": value };
}

export const GRADES_EVENT_TARGET = "A0809Q$ddlSYSE";

function parseSummary(html: string): GradeSummary {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
  const pick = (pattern: RegExp) => pattern.exec(text)?.[1]?.trim() ?? null;
  return {
    average: pick(/學業平均[：:]\s*([\d.]+)/),
    classRank: pick(/班級名次[：:]\s*([\d/]+)/),
    creditsEarned: pick(/已取得累計學分[：:]\s*([\d.]+)/),
    conduct: pick(/操行成績[：:]\s*([\d.]+)/),
  };
}

function parseRows(html: string): GradeRow[] {
  const table = findTableByHeader(html, ["學年", "學期", "科目", "必選修", "學分", "成績", "及格否"]);
  if (!table) return [];

  const rows: GradeRow[] = [];
  for (const cells of table.rows) {
    const [year, semester, subject, category, elective, credits, score, passed] = cells;
    if (!year || !semester || !subject) continue;
    const space = subject.indexOf(" ");
    rows.push({
      year,
      semester,
      code: space > 0 ? subject.slice(0, space) : subject,
      title: space > 0 ? subject.slice(space + 1) : "",
      category: category ?? "",
      elective: elective ?? "",
      credits: Number(credits) || null,
      score: score ?? "",
      passed: passed ?? "",
    });
  }
  return rows;
}
