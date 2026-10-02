import type { Metadata } from "next";
import {
  ATTENDANCE_EVENT_TARGET,
  attendanceSemesterFields,
  parseAttendance,
} from "@/lib/nptu/attendance";
import { UpstreamSessionExpired, withStudentData } from "@/lib/nptu/data";
import { isStudent, requireSession } from "@/lib/session";
import { ExpiredPanel } from "../expired";
import { PageHeader } from "../page-header";
import { RestrictedPage } from "../restricted";
import { SemesterPicker } from "../semester-picker";

export const metadata: Metadata = {
  title: "出缺勤",
};

export default async function AttendancePage({
  searchParams,
}: PageProps<"/dashboard/attendance">) {
  const session = await requireSession();
  if (!isStudent(session)) {
    return <RestrictedPage title="出缺勤" />;
  }
  const { sem } = await searchParams;
  const semValue = typeof sem === "string" ? sem : undefined;

  let report;
  try {
    report = await withStudentData(async (upstream) => {
      const url = await upstream.menuUrl("B0105S");
      let page = await upstream.get(url, "https://webap2.nptu.edu.tw/Web1/Message/Main.aspx");
      if (semValue && semValue !== page.html.match(/<option[^>]*selected[^>]*value="([^"]*)"/)?.[1]) {
        page = await upstream.postback(page, ATTENDANCE_EVENT_TARGET, attendanceSemesterFields(semValue));
      }
      return parseAttendance(page.html);
    });
  } catch (error) {
    if (error instanceof UpstreamSessionExpired) return <ExpiredPanel title="出缺勤" />;
    throw error;
  }

  return (
    <>
      <PageHeader eyebrow="曠課請假" title="出缺勤">
        <p className="dash-meta">{report.selectedSemester?.label ?? "—"}</p>
      </PageHeader>

      <section className="dash-panel">
        <div className="dash-panel-head">
          <h2>缺曠紀錄</h2>
          <SemesterPicker
            options={report.semesterOptions}
            selected={report.selectedSemester?.value}
          />
        </div>
        {report.rows.length === 0 ? (
          <p className="dash-empty">這個學期沒有缺曠紀錄。</p>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                {report.header.map((name, i) => (
                  <th key={`${name}-${i}`}>{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row, i) => (
                <tr key={i}>
                  {report.header.map((name, j) => (
                    <td key={`${name}-${j}`}>{row[name]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
