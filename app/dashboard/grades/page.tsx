import type { Metadata } from "next";
import Link from "next/link";
import { gradeSemesters, gradesBySemester } from "@/lib/guest";
import { PageHeader } from "../page-header";

export const metadata: Metadata = {
  title: "成績查詢",
};

const PASS = 60;

export default async function GradesPage({ searchParams }: PageProps<"/dashboard/grades">) {
  const params = await searchParams;
  const requested = typeof params.term === "string" ? params.term : gradeSemesters[0].value;
  const term = gradesBySemester[requested] ? requested : gradeSemesters[0].value;
  const records = gradesBySemester[term];
  const termLabel = gradeSemesters.find((option) => option.value === term)?.label ?? term;
  const attempted = records.reduce((sum, record) => sum + record.credits, 0);
  const earned = records
    .filter((record) => record.score >= PASS)
    .reduce((sum, record) => sum + record.credits, 0);
  const average = attempted === 0 ? 0 : records.reduce((sum, record) => sum + record.score * record.credits, 0) / attempted;

  return (
    <>
      <PageHeader eyebrow="歷年成績" title="成績查詢">
        <nav className="dash-terms" aria-label="學期">
          {gradeSemesters.map((option) => (
            <Link
              key={option.value}
              href={`/dashboard/grades?term=${option.value}`}
              aria-current={option.value === term ? "page" : undefined}
            >
              {option.label}
            </Link>
          ))}
        </nav>
      </PageHeader>

      <dl className="dash-stats dash-stats-wide">
        <div>
          <dt>學期加權平均</dt>
          <dd>{average.toFixed(2)}</dd>
        </div>
        <div>
          <dt>修習學分</dt>
          <dd>{attempted}</dd>
        </div>
        <div>
          <dt>實得學分</dt>
          <dd>{earned}</dd>
        </div>
      </dl>

      <section className="dash-panel" aria-labelledby="grades-heading">
        <h2 id="grades-heading" className="visually-hidden">
          {termLabel} 成績
        </h2>
        <table className="dash-table">
          <thead>
            <tr>
              <th scope="col">課號</th>
              <th scope="col">課程名稱</th>
              <th scope="col">類別</th>
              <th scope="col">學分</th>
              <th scope="col">成績</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const failed = record.score < PASS;
              return (
                <tr key={record.code}>
                  <td>{record.code}</td>
                  <td>{record.name}</td>
                  <td>{record.type}</td>
                  <td>{record.credits}</td>
                  <td className={failed ? "is-fail" : undefined}>
                    {record.score}
                    {failed ? <span> 未通過</span> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
