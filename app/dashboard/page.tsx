import type { Metadata } from "next";
import Link from "next/link";
import { dateLabel, greetingForHour, guestUser, taipeiClock } from "@/lib/guest";
import { withStudentData } from "@/lib/nptu/data";
import { parseSchedule, toTimetableCourses } from "@/lib/nptu/schedule";
import { isStudent, requireSession } from "@/lib/session";
import { nextClass, type UpcomingClass } from "@/lib/timetable";
import { PageHeader } from "./page-header";

export const metadata: Metadata = {
  title: "總覽",
};

export default async function DashboardPage() {
  const session = await requireSession();
  const now = taipeiClock();

  // Next upcoming class for students. The dashboard stays useful when the
  // upstream session is gone — the card just doesn't render.
  let upcoming: UpcomingClass | null = null;
  if (isStudent(session)) {
    try {
      const timetable = await withStudentData(async (upstream) => {
        const url = await upstream.menuUrl("A0515S");
        const page = await upstream.get(
          url,
          "https://webap2.nptu.edu.tw/Web1/Message/Main.aspx",
        );
        return toTimetableCourses(parseSchedule(page.html));
      });
      upcoming = nextClass(timetable, now);
    } catch {
      upcoming = null;
    }
  }

  const courses = (
    <section className="dash-panel" aria-labelledby="courses-heading">
      <div className="dash-panel-head">
        <h2 id="courses-heading">課程查詢</h2>
        <Link href="/dashboard/courses" className="dash-more">
          前往查詢
        </Link>
      </div>
      <p className="dash-lead">查詢各學期開課、授課教師與上課時間。</p>
    </section>
  );

  const nextClassPanel = upcoming ? (
    <section className="dash-panel dash-next" aria-labelledby="next-heading">
      <div className="dash-panel-head">
        <h2 id="next-heading">{upcoming.live ? "進行中" : "下一堂課"}</h2>
        <Link href="/dashboard/schedule" className="dash-more">
          我的課表
        </Link>
      </div>
      <p className="dash-next-name">{upcoming.course.name}</p>
      <p className="dash-next-meta">
        {upcoming.dayLabel} {upcoming.course.start} – {upcoming.course.end}
        {" · "}
        {upcoming.course.room}
        {" · "}
        {upcoming.course.teacher}
      </p>
    </section>
  ) : null;

  return (
    <>
      <PageHeader eyebrow={dateLabel()} title={`${greetingForHour(now.hour)}，${isStudent(session) ? session.name : guestUser.name}`}>
        {isStudent(session) && session.warning ? (
          <p className="dash-warning" role="status">
            {session.warning}
          </p>
        ) : null}
      </PageHeader>

      {isStudent(session) ? (
        <div className="dash-grid">
          {nextClassPanel}
          {courses}
          <section className="dash-panel" aria-labelledby="student-heading">
            <h2 id="student-heading">學生功能</h2>
            <p className="dash-lead">課表、成績與出缺勤僅限學生使用。</p>
            <ul className="dash-gate-list">
              <li>
                <Link href="/dashboard/schedule">我的課表</Link>
              </li>
              <li>
                <Link href="/dashboard/grades">成績查詢</Link>
              </li>
              <li>
                <Link href="/dashboard/attendance">出缺勤</Link>
              </li>
            </ul>
          </section>
        </div>
      ) : (
        courses
      )}
    </>
  );
}
