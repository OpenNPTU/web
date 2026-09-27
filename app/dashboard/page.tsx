import type { Metadata } from "next";
import Link from "next/link";
import {
  announcements,
  attendanceRecords,
  dateLabel,
  greetingForHour,
  guestCourses,
  guestUser,
  isInProgress,
  isPast,
  semesterLabel,
  taipeiClock,
} from "@/lib/guest";
import { PageHeader } from "./page-header";

export const metadata: Metadata = {
  title: "總覽",
};

export default function DashboardPage() {
  const now = taipeiClock();
  const today = guestCourses
    .filter((course) => course.weekday === now.weekday)
    .sort((a, b) => a.start.localeCompare(b.start));
  const credits = guestCourses.reduce((sum, course) => sum + course.credits, 0);
  const absences = attendanceRecords.filter((record) => record.kind === "曠課").length;
  const courseCount = guestCourses.filter((course) => course.credits > 0).length;

  return (
    <>
      <PageHeader eyebrow={dateLabel()} title={`${greetingForHour(now.hour)}，${guestUser.name}`}>
        <p className="dash-meta">
          {guestUser.department}
          {" · "}
          {guestUser.className}
        </p>
      </PageHeader>

      <div className="dash-grid">
        <section className="dash-panel" aria-labelledby="today-heading">
          <div className="dash-panel-head">
            <h2 id="today-heading">今日課程</h2>
            <Link href="/dashboard/schedule" className="dash-more">
              完整課表
            </Link>
          </div>
          {today.length === 0 ? (
            <p className="dash-empty">今天沒有排定課程</p>
          ) : (
            <ol className="dash-meetings">
              {today.map((course) => {
                const live = isInProgress(course);
                const past = isPast(course);
                return (
                  <li key={course.id} className={past && !live ? "is-past" : undefined}>
                    <time dateTime={`${course.start}/${course.end}`}>
                      <span>{course.start}</span>
                      <span>{course.end}</span>
                    </time>
                    <div>
                      <p className="dash-meeting-name">
                        {course.name}
                        {live ? <span className="dash-live">進行中</span> : null}
                      </p>
                      <p className="dash-meeting-meta">
                        {course.teacher}
                        {" · "}
                        {course.room}
                      </p>
                    </div>
                    <span className="dash-meeting-period">{course.periods}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <div className="dash-stack">
          <section className="dash-panel" aria-labelledby="summary-heading">
            <div className="dash-panel-head">
              <h2 id="summary-heading">本學期</h2>
              <span className="dash-note">{semesterLabel}</span>
            </div>
            <dl className="dash-stats">
              <div>
                <dt>修課學分</dt>
                <dd>
                  {credits}
                  <span>學分</span>
                </dd>
              </div>
              <div>
                <dt>修課數</dt>
                <dd>
                  {courseCount}
                  <span>門</span>
                </dd>
              </div>
              <div>
                <dt>曠課</dt>
                <dd>
                  {absences}
                  <span>次</span>
                </dd>
              </div>
            </dl>
          </section>

          <section className="dash-panel" aria-labelledby="news-heading">
            <h2 id="news-heading">最新公告</h2>
            <ul className="dash-news">
              {announcements.map((item) => (
                <li key={item.id}>
                  <p className="dash-news-meta">
                    {item.pinned ? <span className="dash-pin">置頂</span> : null}
                    <span>{item.unit}</span>
                    <span aria-hidden="true">·</span>
                    <time>{item.date}</time>
                  </p>
                  <p>{item.title}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
