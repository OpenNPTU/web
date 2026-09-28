import type { Metadata } from "next";
import Link from "next/link";
import { QueryForm } from "@/app/query-form";
import { catalogueHref, parseCatalogueQuery } from "@/lib/catalogue-query";
import { courses, type Section } from "@/lib/courses";
import {
  ELECTIVE_OPTIONS,
  TAG_LABEL,
  electiveLabel,
  formatCredits,
  formatMeetings,
  formatRoom,
} from "@/lib/schedule";
import { toDbPeriod } from "@/lib/slots";
import { PageHeader } from "../page-header";

const PAGE_SIZE = 20;

export const metadata: Metadata = {
  title: "課程查詢",
};

export default async function CoursesPage({ searchParams }: PageProps<"/dashboard/courses">) {
  const params = await searchParams;
  const db = courses();
  const semesters = db.semesters();
  const latest = semesters[0] ?? { schoolYear: 115, semester: 1, label: "115學年度第1學期" };
  const query = parseCatalogueQuery(params, {
    year: latest.schoolYear,
    semester: latest.semester,
  });
  const termLabel =
    semesters.find(
      (semester) => semester.schoolYear === query.year && semester.semester === query.semester,
    )?.label ?? `${query.year}學年度第${query.semester}學期`;

  const departments = db.departments({ year: query.year, semester: query.semester });
  if (query.dept && !departments.some((department) => department.dept === query.dept)) {
    departments.unshift({ dept: query.dept, sections: 0 });
  }
  const tags = db.tags();
  let page = query.page;
  const search = {
    year: query.year,
    semester: query.semester,
    text: query.q || undefined,
    dept: query.dept || undefined,
    slots: query.slots.map((slot) => ({
      weekday: slot.weekday,
      period: toDbPeriod(slot.period),
    })),
    tag: query.tag || undefined,
    elective: query.elective || undefined,
    limit: PAGE_SIZE,
  };
  let result = db.search({ ...search, offset: (page - 1) * PAGE_SIZE });
  const pageCount = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  if (page > pageCount) {
    page = pageCount;
    result = db.search({ ...search, offset: (page - 1) * PAGE_SIZE });
  }

  const active = { ...query, page };
  const filtered =
    query.q || query.dept || query.slots.length || query.tag || query.elective;
  const from = result.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, result.total);

  return (
    <>
      <PageHeader eyebrow={termLabel} title="課程查詢">
        <p className="dash-meta">{result.total.toLocaleString("zh-Hant")} 門符合</p>
      </PageHeader>

      <section className="dash-panel">
        <QueryForm
          key={catalogueHref(active, { page: 1 })}
          q={query.q}
          term={`${query.year}-${query.semester}`}
          dept={query.dept}
          slots={query.slots}
          elective={query.elective}
          tag={query.tag}
          terms={semesters.map((semester) => ({
            year: semester.schoolYear,
            semester: semester.semester,
          }))}
          departments={departments.map((department) => ({
            value: department.dept,
            label: department.dept,
          }))}
          electives={ELECTIVE_OPTIONS}
        />
        <div className="chips" aria-label="課程標記">
          {tags.map((tag) => {
            const on = query.tag === tag.tag;
            return (
              <Link
                key={tag.tag}
                className="chip"
                aria-current={on}
                href={catalogueHref(active, { tag: on ? "" : tag.tag, page: 1 })}
              >
                {TAG_LABEL[tag.tag] ?? tag.tag}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="dash-panel" aria-label="查詢結果">
        <p className="summary">
          <span>
            {result.total === 0
              ? "沒有符合的課"
              : `第 ${from.toLocaleString("zh-Hant")}–${to.toLocaleString("zh-Hant")} 筆`}
          </span>
          {filtered ? (
            <Link href={catalogueHref(active, { q: "", dept: "", slots: [], tag: "", elective: "", page: 1 })}>
              清除條件
            </Link>
          ) : (
            <span />
          )}
        </p>
        {result.sections.length === 0 ? (
          <p className="dash-empty">放寬時間、系所，或換一個詞再查。</p>
        ) : (
          <div className="dash-courses">
            {result.sections.map((section) => (
              <CourseRow key={section.id} section={section} />
            ))}
          </div>
        )}
        {pageCount > 1 ? (
          <nav className="pager" aria-label="分頁">
            {page > 1 ? (
              <Link href={catalogueHref(active, { page: page - 1 })}>上一頁</Link>
            ) : (
              <span>上一頁</span>
            )}
            <span>
              {page} / {pageCount}
            </span>
            {page < pageCount ? (
              <Link href={catalogueHref(active, { page: page + 1 })}>下一頁</Link>
            ) : (
              <span>下一頁</span>
            )}
          </nav>
        ) : null}
      </section>
    </>
  );
}

function CourseRow({ section }: { section: Section }) {
  const room = formatRoom(section.room);
  const teachers = section.teachers.map((teacher) => teacher.name).join("、");
  const meta = [section.dept, teachers, formatMeetings(section.meetings), room, section.code]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="dash-course">
      <div className="title-line">
        <h2>{section.titleZh || section.title}</h2>
        {section.elective ? (
          <span className={`mark ${electiveClass(section.elective)}`}>
            {electiveLabel(section.elective)}
          </span>
        ) : null}
        {formatCredits(section.credits) ? (
          <span className="mark mark-plain">{formatCredits(section.credits)}</span>
        ) : null}
      </div>
      {section.titleEn ? <p className="en">{section.titleEn}</p> : null}
      <p className="meta">{meta}</p>
      {section.note ? <p className="note">{section.note}</p> : null}
      {section.tags.length > 0 ? (
        <div className="marks">
          {section.tags.map((tag) => (
            <span key={tag} className="mark mark-tag">
              {TAG_LABEL[tag] ?? tag}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function electiveClass(value: string): string {
  if (value === "必") return "mark-req";
  if (value === "選") return "mark-opt";
  if (value === "重") return "mark-ret";
  return "mark-plain";
}
