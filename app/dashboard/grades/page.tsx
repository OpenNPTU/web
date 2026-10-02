import type { Metadata } from "next";
import { UpstreamSessionExpired, withStudentData } from "@/lib/nptu/data";
import {
  GRADES_EVENT_TARGET,
  gradesSemesterFields,
  parseGrades,
} from "@/lib/nptu/grades";
import { isStudent, requireSession } from "@/lib/session";
import { ExpiredPanel } from "../expired";
import { PageHeader } from "../page-header";
import { RestrictedPage } from "../restricted";
import { SemesterPicker } from "../semester-picker";

export const metadata: Metadata = {
  title: "成績查詢",
};

export default async function GradesPage({
  searchParams,
}: PageProps<"/dashboard/grades">) {
  const session = await requireSession();
  if (!isStudent(session)) {
    return <RestrictedPage title="成績查詢" />;
  }
  const { sem } = await searchParams;
  const semValue = typeof sem === "string" ? sem : undefined;

  let report;
  try {
    report = await withStudentData(async (upstream) => {
      const url = await upstream.menuUrl("A0809Q");
      let page = await upstream.get(url, "https://webap2.nptu.edu.tw/Web1/Message/Main.aspx");
      if (semValue && semValue !== page.html.match(/<option[^>]*selected[^>]*value="([^"]*)"/)?.[1]) {
        page = await upstream.postback(page, GRADES_EVENT_TARGET, gradesSemesterFields(semValue));
      }
      return parseGrades(page.html);
    });
  } catch (error) {
    if (error instanceof UpstreamSessionExpired) return <ExpiredPanel title="成績查詢" />;
    throw error;
  }

  const { summary, rows } = report;

  return (
    <>
      <PageHeader
        eyebrow="歷年成績"
        title="成績查詢"
      >
        <p className="dash-meta">
          {report.selectedSemester?.label ?? "—"}
        </p>
      </PageHeader>

      <div className="dash-stack">
        <section className="dash-panel">
          <div className="dash-panel-head">
            <h2>學期摘要</h2>
            <SemesterPicker
              options={report.semesterOptions}
              selected={report.selectedSemester?.value}
            />
          </div>
          <dl className="dash-stats">
            <div>
              <dt>學業平均</dt>
              <dd>{summary.average ?? "—"}</dd>
            </div>
            <div>
              <dt>班級名次</dt>
              <dd>{summary.classRank ?? "—"}</dd>
            </div>
            <div>
              <dt>已取得學分</dt>
              <dd>{summary.creditsEarned ?? "—"}</dd>
            </div>
            <div>
              <dt>操行成績</dt>
              <dd>{summary.conduct ?? "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="dash-panel">
          <div className="dash-panel-head">
            <h2>課程成績</h2>
            <span className="dash-more">{rows.length} 門</span>
          </div>
          {rows.length === 0 ? (
            <p className="dash-empty">這個學期沒有成績資料。</p>
          ) : (
            <table className="dash-table">
              <thead>
                <tr>
                  <th>課程</th>
                  <th>類別</th>
                  <th>必選</th>
                  <th className="num">學分</th>
                  <th className="num">成績</th>
                  <th>及格</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.year}-${row.semester}-${row.code}`}>
                    <td>
                      <span className="dash-course-code">{row.code}</span>
                      {row.title}
                    </td>
                    <td>{row.category}</td>
                    <td>{row.elective}</td>
                    <td className="num">{row.credits ?? "—"}</td>
                    <td className={row.passed === "否" ? "is-fail num" : "num"}>
                      {row.score}
                    </td>
                    <td>{row.passed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="dash-note">各項成績以成績單正本為準。</p>
        </section>
      </div>
    </>
  );
}
