"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { taipeiClock } from "@/lib/guest";
import {
  coursePeriod,
  gridRowFor,
  isInProgress,
  periodSlots,
  weekdays,
  type TimetableCourse,
} from "@/lib/timetable";
import { PageHeader } from "../page-header";

type Tip = { course: TimetableCourse; anchor: DOMRect };

export function ScheduleView({ courses }: { courses: TimetableCourse[] }) {
  const now = taipeiClock();
  const today = now.weekday;
  const credits = courses.reduce((sum, course) => sum + course.credits, 0);

  return (
    <>
      <PageHeader eyebrow="本學期" title="我的課表">
        <p className="dash-meta">
          {courses.length} 堂 · {credits} 學分
        </p>
      </PageHeader>

      <div className="tt-board">
        <TimetableGrid courses={courses} today={today} now={now.time} />
      </div>
    </>
  );
}

function TimetableGrid({
  courses,
  today,
  now,
}: {
  courses: TimetableCourse[];
  today: number;
  now: string;
}) {
  const [tip, setTip] = useState<Tip | null>(null);
  const [pos, setPos] = useState<{ forId: string; x: number; y: number } | null>(
    null,
  );
  const [touch] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: none)").matches,
  );

  // The tooltip is position:fixed (the scrollable board would clip anything
  // absolutely positioned inside it). The anchor rect is captured when the
  // tip opens; the exact clamped spot is measured in the ref callback the
  // first render commit, before paint.
  const measureTip = (el: HTMLDivElement | null) => {
    if (!el || !tip) return;
    const gap = 10;
    const margin = 8;
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    const centerX = tip.anchor.left + tip.anchor.width / 2;
    const x = Math.min(
      Math.max(margin, centerX - width / 2),
      window.innerWidth - width - margin,
    );
    const below = tip.anchor.top - height - gap < margin;
    const y = below ? tip.anchor.bottom + gap : tip.anchor.top - height - gap;
    // The ref callback re-runs on every render (fresh function identity);
    // bail out on identical values or this becomes an update loop.
    setPos((prev) =>
      prev?.forId === tip.course.id && prev.x === x && prev.y === y
        ? prev
        : { forId: tip.course.id, x, y },
    );
  };

  useEffect(() => {
    if (!tip) return;
    const dismiss = () => setTip(null);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTip(null);
    };
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("keydown", onKey);
    };
  }, [tip]);

  const show = (course: TimetableCourse) => (event: React.SyntheticEvent<HTMLElement>) => {
    const anchor = event.currentTarget.getBoundingClientRect();
    setTip({ course, anchor });
  };
  const toggle = (course: TimetableCourse) => (event: React.SyntheticEvent<HTMLElement>) => {
    const anchor = event.currentTarget.getBoundingClientRect();
    setTip((current) =>
      current?.course.id === course.id ? null : { course, anchor },
    );
  };

  return (
    <>
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

        {courses.map((course) => {
          const { period, span } = coursePeriod(course);
          const live = isInProgress(course, now, today);
          const dayLabel = weekdays.find((day) => day.value === course.weekday)?.label ?? "";
          return (
            <button
              key={course.id}
              type="button"
              className="tt-block"
              aria-label={`${course.name}，${dayLabel}${course.periods}節，${course.room}，${course.teacher}`}
              // Touch and pointer devices get different event models: taps
              // synthesize mouseenter, so binding both would let the click
              // toggle immediately undo what the synthetic enter just opened
              // (the "need two taps" bug).
              onMouseEnter={touch ? undefined : show(course)}
              onMouseLeave={touch ? undefined : () => setTip(null)}
              onFocus={touch ? undefined : show(course)}
              onBlur={touch ? undefined : () => setTip(null)}
              onClick={touch ? toggle(course) : undefined}
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

      {/* Portal to <body>: .tt-board's backdrop-filter makes it the
          containing block for position:fixed descendants, which would
          silently offset the tooltip by the board's own viewport offset. */}
      {tip
        ? createPortal(
            <div
              key={tip.course.id}
              ref={measureTip}
              className={
                pos?.forId === tip.course.id ? "tt-tip" : "tt-tip is-hidden"
              }
              style={
                pos?.forId === tip.course.id
                  ? { left: pos.x, top: pos.y }
                  : undefined
              }
              role="tooltip"
            >
          <p className={tip.course.type === "必修" ? "tt-kind is-req" : "tt-kind"}>
            {tip.course.type} · {tip.course.credits} 學分
          </p>
          <h3 className="tt-tip-name">{tip.course.name}</h3>
          <dl className="tt-tip-facts">
            <div>
              <dt>時間</dt>
              <dd>
                {weekdays.find((day) => day.value === tip.course.weekday)?.label} {tip.course.periods} 節
              </dd>
            </div>
            <div>
              <dt>時段</dt>
              <dd>
                {tip.course.start} – {tip.course.end}
              </dd>
            </div>
            <div>
              <dt>教室</dt>
              <dd>{tip.course.room}</dd>
            </div>
            <div>
              <dt>教師</dt>
              <dd>{tip.course.teacher}</dd>
            </div>
          </dl>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
