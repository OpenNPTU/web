import type { Metadata } from "next";
import { UpstreamSessionExpired, withStudentData } from "@/lib/nptu/data";
import { parseSchedule, toTimetableCourses } from "@/lib/nptu/schedule";
import { isStudent, requireSession } from "@/lib/session";
import { ExpiredPanel } from "../expired";
import { PageHeader } from "../page-header";
import { RestrictedPage } from "../restricted";
import { ScheduleView } from "./schedule-view";

export const metadata: Metadata = {
  title: "課表查詢",
};

export default async function SchedulePage() {
  const session = await requireSession();
  if (!isStudent(session)) {
    return <RestrictedPage title="課表查詢" />;
  }

  let courses;
  try {
    // The upstream 個人課表 page is only a PDF generator, so the weekly grid
    // is rebuilt from the course-selection result (A0515S) instead.
    courses = await withStudentData(async (upstream) => {
      const url = await upstream.menuUrl("A0515S");
      const page = await upstream.get(url, "https://webap2.nptu.edu.tw/Web1/Message/Main.aspx");
      return toTimetableCourses(parseSchedule(page.html));
    });
  } catch (error) {
    if (error instanceof UpstreamSessionExpired) return <ExpiredPanel title="課表查詢" />;
    throw error;
  }

  if (courses.length === 0) {
    return (
      <>
        <PageHeader eyebrow="個人課表" title="課表查詢" />
        <section className="dash-panel">
          <p className="dash-empty">目前查不到本學期的選課結果，加退選結束後學校公布資料才會出現在這裡。</p>
        </section>
      </>
    );
  }

  return <ScheduleView courses={courses} />;
}
