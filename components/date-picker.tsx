"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

/** Monday = 0 … Sunday = 6 */
function startDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay(); // 0=Sun
  return day === 0 ? 6 : day - 1;
}

function formatMonth(year: number, month: number) {
  return new Date(year, month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
}

function formatDisplay(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("default", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function toDateString(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

type Props = {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
};

export function DatePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const selectedDate = useMemo(() => {
    const [y, m, d] = value.split("-").map(Number);
    return { year: y, month: m - 1, day: d };
  }, [value]);

  const [viewYear, setViewYear] = useState(selectedDate.year);
  const [viewMonth, setViewMonth] = useState(selectedDate.month);

  function handleOpen() {
    setViewYear(selectedDate.year);
    setViewMonth(selectedDate.month);
    setOpen(true);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const startDay = startDayOfMonth(viewYear, viewMonth);

  const today = useMemo(() => {
    const t = new Date();
    return toDateString(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  function prev() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function next() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const selectDay = useCallback(
    (day: number) => {
      onChange(toDateString(viewYear, viewMonth, day));
      setOpen(false);
    },
    [viewYear, viewMonth, onChange],
  );

  // Build grid cells: leading blanks + day numbers
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <>
      {/* Clickable input */}
      <button
        type="button"
        onClick={handleOpen}
        className="flex h-12 w-full items-center gap-3 rounded-md border bg-background px-3 text-base text-foreground"
      >
        <CalendarDays className="h-5 w-5 text-muted-foreground" />
        <span>{formatDisplay(value)}</span>
      </button>

      {/* Centered overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-background p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Month navigation */}
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={prev}
                className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground active:bg-accent"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-foreground">
                {formatMonth(viewYear, viewMonth)}
              </span>
              <button
                type="button"
                onClick={next}
                className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground active:bg-accent"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((wd) => (
                <div
                  key={wd}
                  className="flex h-10 items-center justify-center text-xs font-medium text-muted-foreground"
                >
                  {wd}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                if (day === null) {
                  return <div key={`blank-${i}`} />;
                }

                const dateStr = toDateString(viewYear, viewMonth, day);
                const isSelected = dateStr === value;
                const isToday = dateStr === today;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => selectDay(day)}
                    className={`flex h-11 w-full items-center justify-center rounded-full text-sm transition-colors
                      ${isSelected ? "bg-primary text-primary-foreground font-semibold" : ""}
                      ${!isSelected && isToday ? "border border-primary text-primary font-semibold" : ""}
                      ${!isSelected && !isToday ? "text-foreground active:bg-accent" : ""}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
