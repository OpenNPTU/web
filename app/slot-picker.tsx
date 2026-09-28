"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { gridRowFor } from "@/lib/timetable";
import {
  SLOT_DAYS,
  SLOT_PERIODS,
  formatSlotsLabel,
  parseSlotsParam,
  serializeSlots,
  slotKey,
  type TimeSlot,
} from "@/lib/slots";

type SlotPickerProps = {
  value: TimeSlot[];
};

export function SlotPicker({ value }: SlotPickerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const paint = useRef<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(() => keysFromSlots(value));

  useEffect(() => {
    if (!open) setSelected(keysFromSlots(value));
  }, [open, value]);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) {
      setSelected(keysFromSlots(value));
      node.showModal();
      node.querySelector<HTMLElement>("#slot-dialog-title")?.focus();
    } else if (!open && node.open) {
      node.close();
    }
  }, [open, value]);

  const slots = slotsFromKeys(selected);
  const label = formatSlotsLabel(slots);
  const encoded = serializeSlots(slots);

  function applyKey(weekday: number, period: string, on: boolean) {
    const key = slotKey(weekday, period);
    setSelected((current) => {
      const has = current.includes(key);
      if (on === has) return current;
      return on ? [...current, key] : current.filter((item) => item !== key);
    });
  }

  function onGridPointerDown(event: PointerEvent<HTMLDivElement>) {
    const cell = cellFromPoint(event.clientX, event.clientY);
    if (!cell) return;
    event.preventDefault();
    const on = !selected.includes(slotKey(cell.weekday, cell.period));
    paint.current = on;
    applyKey(cell.weekday, cell.period, on);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onGridPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (paint.current == null) return;
    const cell = cellFromPoint(event.clientX, event.clientY);
    if (cell) applyKey(cell.weekday, cell.period, paint.current);
  }

  function endPaint() {
    paint.current = null;
  }

  function toggleDay(weekday: number) {
    const on = !SLOT_PERIODS.every((period) => selected.includes(slotKey(weekday, period)));
    setSelected((current) => {
      const next = new Set(current);
      for (const period of SLOT_PERIODS) {
        const key = slotKey(weekday, period);
        if (on) next.add(key);
        else next.delete(key);
      }
      return [...next];
    });
  }

  function togglePeriod(period: string) {
    const on = !SLOT_DAYS.every((day) => selected.includes(slotKey(day.value, period)));
    setSelected((current) => {
      const next = new Set(current);
      for (const day of SLOT_DAYS) {
        const key = slotKey(day.value, period);
        if (on) next.add(key);
        else next.delete(key);
      }
      return [...next];
    });
  }

  function apply() {
    if (hidden.current) hidden.current.value = encoded;
    setOpen(false);
    hidden.current?.form?.requestSubmit();
  }

  return (
    <div className="field">
      <span className="field-label">上課時間</span>
      <button
        type="button"
        className={value.length ? "slot-trigger is-on" : "slot-trigger"}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={value.length ? formatSlotsLabel(value) : "不拘"}
        onClick={() => setOpen(true)}
      >
        {value.length ? "已選課程時段" : "不拘"}
      </button>
      <input ref={hidden} type="hidden" name="slots" defaultValue={serializeSlots(value)} />
      <dialog
        ref={dialog}
        className="slot-dialog"
        aria-labelledby="slot-dialog-title"
        onClose={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <div className="slot-dialog-head">
          <h2 id="slot-dialog-title" tabIndex={-1}>
            選擇上課時間
          </h2>
          <p className="slot-dialog-lead">{slots.length ? label : "點選或拖曳時段"}</p>
        </div>
        <div className="slot-board">
          <div
            className="slot-grid"
            role="grid"
            aria-label="上課時間"
            onPointerDown={onGridPointerDown}
            onPointerMove={onGridPointerMove}
            onPointerUp={endPaint}
            onPointerCancel={endPaint}
          >
            {SLOT_DAYS.map((day) => {
              const full = SLOT_PERIODS.every((period) =>
                selected.includes(slotKey(day.value, period)),
              );
              return (
                <button
                  key={day.value}
                  type="button"
                  className={full ? "slot-day is-on" : "slot-day"}
                  style={{ gridColumn: day.value + 1, gridRow: 1 }}
                  aria-pressed={full}
                  onClick={() => toggleDay(day.value)}
                >
                  {day.label}
                </button>
              );
            })}
            {SLOT_PERIODS.map((period) => {
              const full = SLOT_DAYS.every((day) => selected.includes(slotKey(day.value, period)));
              return (
                <button
                  key={period}
                  type="button"
                  className={full ? "slot-period is-on" : "slot-period"}
                  style={{ gridColumn: 1, gridRow: gridRowFor(period) }}
                  aria-pressed={full}
                  aria-label={period === "N" ? "全選午休" : `全選第${period}節`}
                  onClick={() => togglePeriod(period)}
                >
                  {period}
                </button>
              );
            })}
            {SLOT_PERIODS.flatMap((period) =>
              SLOT_DAYS.map((day) => {
                const on = selected.includes(slotKey(day.value, period));
                return (
                  <button
                    key={slotKey(day.value, period)}
                    type="button"
                    className={on ? "slot-cell is-on" : "slot-cell"}
                    data-slot=""
                    data-day={day.value}
                    data-period={period}
                    style={{ gridColumn: day.value + 1, gridRow: gridRowFor(period) }}
                    aria-pressed={on}
                    aria-label={`${day.label} ${period === "N" ? "午休" : `第${period}節`}`}
                    onClick={(event) => {
                      if (event.detail !== 0) return;
                      applyKey(day.value, period, !on);
                    }}
                  >
                    {on ? period : ""}
                  </button>
                );
              }),
            )}
          </div>
        </div>
        <div className="slot-dialog-actions">
          <button type="button" className="enter" onClick={() => setSelected([])}>
            清除
          </button>
          <button type="button" className="slot-apply" onClick={apply}>
            套用
          </button>
        </div>
      </dialog>
    </div>
  );
}

function keysFromSlots(slots: TimeSlot[]): string[] {
  return slots.map((slot) => slotKey(slot.weekday, slot.period));
}

function slotsFromKeys(keys: string[]): TimeSlot[] {
  return parseSlotsParam(keys.join(","));
}

function cellFromPoint(x: number, y: number) {
  const node = document.elementFromPoint(x, y);
  const cell = node instanceof Element ? node.closest("[data-slot]") : null;
  if (!(cell instanceof HTMLElement)) return null;
  const weekday = Number(cell.dataset.day);
  const period = cell.dataset.period;
  if (!weekday || !period) return null;
  return { weekday, period };
}
