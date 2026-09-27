import type { Metadata } from "next";
import { guestCourses, semesterLabel, weekdays } from "@/lib/guest";
import { PageHeader } from "../page-header";

export const metadata: Metadata = {
  title: "課表查詢",
};

export default function SchedulePage() {
  const credits = guestCourses.reduce((sum, course) => sum + course.credits, 0);

  return (
    <>
      <PageHeader eyebrow={semesterLabel} title="課表查詢">
        <p className="dash-meta">
          {guestCourses.length} 堂 · {credits} 學分
        </p>
      </PageHeader>

      <div className="dash-week">
        {weekdays.map((day) => {
          const list = guestCourses
            .filter((course) => course.weekday === day.value)
            .sort((a, b) => a.start.localeCompare(b.start));
          return (
            <section key={day.value} className="dash-day" aria-labelledby={`day-${day.value}`}>
              <h2 id={`day-${day.value}`}>{day.label}</h2>
              {list.length === 0 ? (
                <p className="dash-empty">當日無課程</p>
              ) : (
                <ol className="dash-meetings">
                  {list.map((course) => (
                    <li key={course.id}>
                      <time dateTime={`${course.start}/${course.end}`}>
                        <span>{course.start}</span>
                        <span>{course.end}</span>
                      </time>
                      <div>
                        <p className="dash-meeting-name">{course.name}</p>
                        <p className="dash-meeting-meta">
                          {course.teacher}
                          {" · "}
                          {course.room}
                        </p>
                      </div>
                      <span className="dash-meeting-period">{course.periods}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
