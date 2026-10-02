// Parser for B0105S 曠課及請假資料查詢 (../B01/B0105SPage.aspx).
//
// No populated absence grid was ever observed for a real session (the pages
// render an empty body when a student has no records), so the data table is
// parsed defensively: whatever grid shows up with the expected header keywords
// is mapped column-by-column, and anything else yields an empty report.

import { findTableByHeader, selectOptions, selectSelected, tableBlocks, tableRows } from "./html";

export type AttendanceRow = Record<string, string>;

export type AttendanceReport = {
  semesterOptions: Array<{ value: string; label: string }>;
  selectedSemester: { value: string; label: string } | null;
  header: string[];
  rows: AttendanceRow[];
};

const GRID_HINTS = ["日期", "節次", "曠課", "請假", "課程"];

export const ATTENDANCE_EVENT_TARGET = "B0105S$ddlSYSE";

export function attendanceSemesterFields(value: string): Record<string, string> {
  return { "B0105S:ddlSYSE": value };
}

export function parseAttendance(html: string): AttendanceReport {
  const selected = selectSelected(html, "ddlSYSE");
  const table =
    findTableByHeader(html, ["日期", "節次"]) ??
    findTableByHeader(html, ["日期", "星期"]) ??
    findGridByHint(html);

  return {
    semesterOptions: selectOptions(html, "ddlSYSE")
      .filter((option) => option.value)
      .map(({ value, label }) => ({ value, label })),
    selectedSemester: selected ? { value: selected.value, label: selected.label } : null,
    header: table?.header ?? [],
    rows: (table?.rows ?? [])
      .filter((cells) => cells.filter(Boolean).length > 1)
      .map((cells) => {
        const row: AttendanceRow = {};
        table!.header.forEach((name, i) => {
          if (name) row[name] = cells[i] ?? "";
        });
        return row;
      }),
  };
}

function findGridByHint(html: string): { header: string[]; rows: string[][] } | null {
  for (const block of tableBlocks(html)) {
    const rows = tableRows(block);
    if (rows.length < 2) continue;
    const header = rows[0];
    const hits = header.filter((cell) => GRID_HINTS.some((hint) => cell.includes(hint))).length;
    if (hits >= 2) {
      return { header, rows: rows.slice(1) };
    }
  }
  return null;
}
