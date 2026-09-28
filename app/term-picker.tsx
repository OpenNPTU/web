"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  TERM_SEASONS,
  formatTermLong,
  formatTermShort,
  parseTermValue,
  serializeTerm,
  type Term,
  type TermSeason,
} from "@/lib/terms";

type TermPickerProps = {
  value: string;
  terms: Term[];
};

export function TermPicker({ value, terms }: TermPickerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const applied = parseTermValue(value) ?? terms[0] ?? { year: 115, semester: 1 };
  const [open, setOpen] = useState(false);
  const [draftYear, setDraftYear] = useState(applied.year);
  const [draftSemester, setDraftSemester] = useState<TermSeason | null>(asSeason(applied.semester));

  const years = useMemo(() => uniqueYears(terms), [terms]);
  const available = useMemo(() => {
    const keys = new Set(terms.map((term) => serializeTerm(term.year, term.semester)));
    return keys;
  }, [terms]);

  useEffect(() => {
    if (!open) {
      setDraftYear(applied.year);
      setDraftSemester(asSeason(applied.semester));
    }
  }, [open, applied.year, applied.semester]);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) {
      setDraftYear(applied.year);
      setDraftSemester(asSeason(applied.semester));
      node.showModal();
      node.querySelector<HTMLElement>("#term-dialog-title")?.focus();
    } else if (!open && node.open) {
      node.close();
    }
  }, [open, applied.year, applied.semester]);

  function hasTerm(year: number, semester: TermSeason) {
    return available.has(serializeTerm(year, semester));
  }

  function pickYear(year: number) {
    setDraftYear(year);
    if (draftSemester && !hasTerm(year, draftSemester)) setDraftSemester(null);
  }

  function pickSeason(semester: TermSeason) {
    if (!hasTerm(draftYear, semester)) return;
    if (draftYear === applied.year && semester === applied.semester) {
      setOpen(false);
      return;
    }
    if (hidden.current) hidden.current.value = serializeTerm(draftYear, semester);
    const form = hidden.current?.form;
    const dept = form?.elements.namedItem("dept");
    if (dept instanceof HTMLSelectElement) dept.value = "";
    setOpen(false);
    form?.requestSubmit();
  }

  const lead =
    draftSemester && hasTerm(draftYear, draftSemester)
      ? formatTermLong(draftYear, draftSemester)
      : `${draftYear}學年度`;

  return (
    <div className="field">
      <span className="field-label">學期</span>
      <button
        type="button"
        className="slot-trigger is-on"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={formatTermLong(applied.year, applied.semester)}
        onClick={() => setOpen(true)}
      >
        {formatTermShort(applied.year, applied.semester)}
      </button>
      <input ref={hidden} type="hidden" name="term" defaultValue={value} />
      <dialog
        ref={dialog}
        className="term-dialog"
        aria-labelledby="term-dialog-title"
        onClose={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <div className="term-dialog-head">
          <h2 id="term-dialog-title" tabIndex={-1}>
            選擇學期
          </h2>
          <p className="term-dialog-lead">{lead}</p>
        </div>
        <div className="term-years" role="radiogroup" aria-label="學年度">
          {years.map((year) => {
            const on = year === draftYear;
            return (
              <button
                key={year}
                type="button"
                role="radio"
                className={on ? "term-year is-on" : "term-year"}
                aria-checked={on}
                onClick={() => pickYear(year)}
              >
                {year}
              </button>
            );
          })}
        </div>
        <div className="term-seasons" role="radiogroup" aria-label="學期">
          {TERM_SEASONS.map((season) => {
            const ready = hasTerm(draftYear, season.value);
            const on = ready && draftSemester === season.value;
            return (
              <button
                key={season.value}
                type="button"
                role="radio"
                className={on ? "term-season is-on" : "term-season"}
                aria-checked={on}
                aria-label={season.long}
                disabled={!ready}
                onClick={() => pickSeason(season.value)}
              >
                {season.label}
              </button>
            );
          })}
        </div>
      </dialog>
    </div>
  );
}

function uniqueYears(terms: Term[]): number[] {
  return [...new Set(terms.map((term) => term.year))].sort((a, b) => b - a);
}

function asSeason(value: number): TermSeason | null {
  return value === 1 || value === 2 || value === 3 ? value : null;
}
