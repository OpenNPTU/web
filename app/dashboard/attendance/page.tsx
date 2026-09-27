import type { Metadata } from "next";
import { attendanceKinds, attendanceRecords, semesterLabel } from "@/lib/guest";
import { PageHeader } from "../page-header";

export const metadata: Metadata = {
  title: "出缺勤",
};

export default function AttendancePage() {
  return (
    <>
      <PageHeader eyebrow={semesterLabel} title="出缺勤紀錄" />

      <dl className="dash-stats dash-stats-wide">
        {attendanceKinds.map((kind) => (
          <div key={kind}>
            <dt>{kind}</dt>
            <dd className={kind === "曠課" ? "is-fail" : undefined}>
              {attendanceRecords.filter((record) => record.kind === kind).length}
              <span>次</span>
            </dd>
          </div>
        ))}
      </dl>

      <section className="dash-panel" aria-labelledby="records-heading">
        <h2 id="records-heading">明細</h2>
        <ul className="dash-records">
          {attendanceRecords.map((record) => (
            <li key={`${record.date}-${record.course}-${record.kind}`}>
              <time>{record.date}</time>
              <div>
                <p className="dash-meeting-name">{record.course}</p>
                <p className="dash-meeting-meta">{record.periods}</p>
              </div>
              <span className={record.kind === "曠課" ? "dash-kind is-fail" : "dash-kind"}>{record.kind}</span>
              <span className={record.status === "審核中" ? "dash-status is-pending" : "dash-status"}>
                {record.status}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
