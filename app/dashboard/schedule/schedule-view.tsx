"use client";

import { useState } from "react";
import {
  coursePeriod,
  gridRowFor,
  guestCourses,
  isInProgress,
  periodSlots,
  semesterLabel,
  taipeiClock,
  weekdays,
  type GuestCourse,
} from "@/lib/guest";
import { PageHeader } from "../page-header";

export function ScheduleView() {
  const now = taipeiClock();
  const today = now.weekday;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = guestCourses.find((course) => course.id === selectedId) ?? null;
  const credits = guestCourses.reduce((sum, course) => sum + course.credits, 0);

  return (
    <>
      <PageHeader eyebrow={semesterLabel} title="課表查詢">
        <p className="dash-meta">
          {guestCourses.length} 堂 · {credits} 學分
        </p>
      </PageHeader>

      <div className="tt-shell">
        <div className="tt-board">
          <TimetableGrid
            today={today}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId((current) => (current === id ? null : id))}
          />
        </div>
        <CourseDetail course={selected} onClose={() => setSelectedId(null)} />
      </div>
    </>
  );
}

function TimetableGrid({
  today,
  selectedId,
  onSelect,
}: {
  today: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="tt-grid" role="grid" aria-label="週課表">
      {weekdays.map((day) => (
        <div
          key={day.value}
          className={day.value === today ? "tt-dayhead is-today" : "tt-dayhead"}
          style={{ gridColumn: day.value + 1, gridRow: 1 }}
        >
          {day.label}
          {day.value === today ? <span className="visually-hidden">（今天）</span> : null}
        </div>
      ))}

      {periodSlots.map((slot) => (
        <div key={slot} className="tt-period" style={{ gridColumn: 1, gridRow: gridRowFor(slot) }}>
          {slot}
        </div>
      ))}

      {periodSlots.flatMap((slot) =>
        weekdays.map((day) => (
          <div
            key={`${slot}-${day.value}`}
            className={day.value === today ? "tt-slot is-today" : "tt-slot"}
            aria-hidden="true"
            style={{ gridColumn: day.value + 1, gridRow: gridRowFor(slot) }}
          />
        )),
      )}

      {guestCourses.map((course) => {
        const { period, span } = coursePeriod(course);
        const live = isInProgress(course);
        const selected = selectedId === course.id;
        return (
          <button
            key={course.id}
            type="button"
            className={["tt-block", live ? "is-live" : "", selected ? "is-selected" : ""].filter(Boolean).join(" ")}
            aria-pressed={selected}
            onClick={() => onSelect(course.id)}
            style={{
              gridColumn: course.weekday + 1,
              gridRow: `${gridRowFor(period)} / span ${span}`,
            }}
          >
            <span className={course.type === "必修" ? "tt-kind is-req" : "tt-kind"}>{course.type}</span>
            <span className="tt-block-name">{course.name}</span>
            <span className="tt-block-meta">
              {course.teacher}
              {" · "}
              {course.room}
            </span>
            {live ? <span className="dash-live">進行中</span> : null}
          </button>
        );
      })}
    </div>
  );
}

function CourseDetail({ course, onClose }: { course: GuestCourse | null; onClose: () => void }) {
  if (!course) {
    return (
      <aside className="tt-detail is-empty">
        <h2>課程資訊</h2>
        <p>點選課表中的課程，即可查看授課教師、教室與學分資訊。</p>
      </aside>
    );
  }

  const dayLabel = weekdays.find((day) => day.value === course.weekday)?.label ?? "";
  const rows = [
    { label: "課號", value: course.code },
    { label: "授課教師", value: course.teacher },
    { label: "上課時間", value: `${dayLabel} ${course.periods}` },
    { label: "時段", value: `${course.start} – ${course.end}` },
    { label: "教室", value: course.room },
    { label: "學分", value: `${course.credits} 學分` },
  ];

  return (
    <aside className="tt-detail" aria-labelledby="course-detail-heading">
      <div className="tt-detail-head">
        <div>
          <p className={course.type === "必修" ? "tt-kind is-req" : "tt-kind"}>{course.type}</p>
          <h2 id="course-detail-heading">{course.name}</h2>
        </div>
        <button type="button" className="tt-close" onClick={onClose}>
          關閉
        </button>
      </div>
      <dl className="tt-facts">
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
