import type { Metadata } from "next";
import Link from "next/link";
import { dateLabel, greetingForHour, guestUser, taipeiClock } from "@/lib/guest";
import { isStudent, requireSession } from "@/lib/session";
import { PageHeader } from "./page-header";

export const metadata: Metadata = {
  title: "總覽",
};

export default async function DashboardPage() {
  const session = await requireSession();
  const now = taipeiClock();
  const who = isStudent(session)
    ? { name: session.name, meta: [session.studentId, session.semester].filter(Boolean).join(" · ") }
    : { name: guestUser.name, meta: `${guestUser.department} · ${guestUser.className}` };
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

  return (
    <>
      <PageHeader eyebrow={dateLabel()} title={`${greetingForHour(now.hour)}，${who.name}`}>
        <p className="dash-meta">{who.meta}</p>
        {isStudent(session) && session.warning ? (
          <p className="dash-warning" role="status">
            {session.warning}
          </p>
        ) : null}
      </PageHeader>

      {isStudent(session) ? (
        <div className="dash-grid">
          {courses}
          <section className="dash-panel" aria-labelledby="student-heading">
            <h2 id="student-heading">學生功能</h2>
            <p className="dash-lead">課表、成績與出缺勤僅限學生使用。</p>
            <ul className="dash-gate-list">
              <li>
                <Link href="/dashboard/schedule">課表查詢</Link>
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
