"use client";

import type { FormEvent, ReactNode } from "react";
import { useFormStatus } from "react-dom";

type Choice = { value: string; label: string };

type QueryFormProps = {
  q: string;
  term: string;
  dept: string;
  weekday: string;
  period: string;
  elective: string;
  tag: string;
  semesters: Choice[];
  departments: Choice[];
  weekdays: Choice[];
  periods: Choice[];
  electives: Choice[];
};

export function QueryForm(props: QueryFormProps) {
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const turnedOff: Array<HTMLInputElement | HTMLSelectElement> = [];
    for (const element of Array.from(form.elements)) {
      if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement)) {
        continue;
      }
      if (element.name !== "term" && element.value === "") {
        element.disabled = true;
        turnedOff.push(element);
      }
    }
    requestAnimationFrame(() => {
      for (const element of turnedOff) element.disabled = false;
    });
  }

  function submit(form: HTMLFormElement | null) {
    form?.requestSubmit();
  }

  return (
    <form action="/dashboard/courses" method="get" onSubmit={onSubmit}>
      <label className="search">
        <span className="field-label">關鍵字</span>
        <span className="search-row">
          <input
            name="q"
            defaultValue={props.q}
            placeholder="課名、教師或代碼"
            autoComplete="off"
            enterKeyHint="search"
          />
          <SubmitButton />
        </span>
      </label>

      <div className="filters">
        <Field label="學期">
          <select
            name="term"
            defaultValue={props.term}
            onChange={(event) => {
              const form = event.currentTarget.form;
              const dept = form?.elements.namedItem("dept");
              if (dept instanceof HTMLSelectElement) dept.value = "";
              submit(form);
            }}
          >
            {props.semesters.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="系所">
          <select
            name="dept"
            defaultValue={props.dept}
            onChange={(event) => submit(event.currentTarget.form)}
          >
            <option value="">全部系所</option>
            {props.departments.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="星期">
          <select
            name="weekday"
            defaultValue={props.weekday}
            onChange={(event) => submit(event.currentTarget.form)}
          >
            <option value="">不拘</option>
            {props.weekdays.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="節次">
          <select
            name="period"
            defaultValue={props.period}
            onChange={(event) => submit(event.currentTarget.form)}
          >
            <option value="">不拘</option>
            {props.periods.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="必選">
          <select
            name="elective"
            defaultValue={props.elective}
            onChange={(event) => submit(event.currentTarget.form)}
          >
            <option value="">不拘</option>
            {props.electives.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {props.tag ? <input type="hidden" name="tag" value={props.tag} /> : null}
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" aria-busy={pending}>
      {pending ? "查詢中" : "查詢"}
    </button>
  );
}
