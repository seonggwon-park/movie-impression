"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./button";
import { cn } from "./class-names";

type WatchedDatePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
};

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];
const monthFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
});
const selectedDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getRelativeDateValue(dayOffset: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);

  return formatDateValue(date);
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getCalendarDays(month: Date) {
  const firstDay = getMonthStart(month);
  const firstCalendarDay = new Date(firstDay);
  firstCalendarDay.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstCalendarDay);
    date.setDate(firstCalendarDay.getDate() + index);
    return date;
  });
}

function formatSelectedDate(value: string) {
  const date = parseDateValue(value);
  return date ? selectedDateFormatter.format(date) : "날짜를 고르지 않았어요";
}

export function WatchedDatePicker({
  id = "watched-date",
  value,
  onChange,
}: WatchedDatePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const calendarId = `${id}-calendar`;
  const todayValue = getRelativeDateValue(0);
  const yesterdayValue = getRelativeDateValue(-1);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    getMonthStart(parseDateValue(value) ?? new Date()),
  );
  const calendarDays = useMemo(
    () => getCalendarDays(visibleMonth),
    [visibleMonth],
  );

  useEffect(() => {
    if (!isCalendarOpen) {
      return;
    }

    function handleDocumentMouseDown(event: MouseEvent) {
      if (
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        setIsCalendarOpen(false);
      }
    }

    function handleDocumentKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCalendarOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentMouseDown);
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [isCalendarOpen]);

  function handleQuickSelect(nextValue: string) {
    const nextDate = parseDateValue(nextValue);
    onChange(nextValue);
    if (nextDate) {
      setVisibleMonth(getMonthStart(nextDate));
    }
    setIsCalendarOpen(false);
  }

  function handleDirectSelectClick() {
    if (!isCalendarOpen) {
      setVisibleMonth(getMonthStart(parseDateValue(value) ?? new Date()));
    }

    setIsCalendarOpen((current) => !current);
  }

  function moveVisibleMonth(monthOffset: number) {
    setVisibleMonth(
      (currentMonth) =>
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, 1),
    );
  }

  function handleDateSelect(date: Date) {
    onChange(formatDateValue(date));
    setVisibleMonth(getMonthStart(date));
    setIsCalendarOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <p id={`${id}-label`} className="text-sm font-medium text-[#c9ad96]">
        언제 보셨나요?
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant={value === todayValue ? "primary" : "secondary"}
          onClick={() => handleQuickSelect(todayValue)}
          className="min-h-10 px-4 py-2 text-sm"
        >
          오늘
        </Button>
        <Button
          type="button"
          variant={value === yesterdayValue ? "primary" : "secondary"}
          onClick={() => handleQuickSelect(yesterdayValue)}
          className="min-h-10 px-4 py-2 text-sm"
        >
          어제
        </Button>
        <Button
          type="button"
          variant={isCalendarOpen ? "primary" : "secondary"}
          aria-controls={calendarId}
          aria-expanded={isCalendarOpen}
          aria-describedby={`${id}-label`}
          onClick={handleDirectSelectClick}
          className="min-h-10 px-4 py-2 text-sm"
        >
          직접 선택
        </Button>
      </div>

      <div className="mt-3 rounded-lg border border-[#fff7ea]/10 bg-[#12100f]/56 px-4 py-3">
        <p className="text-xs font-medium text-[#f2b482]">선택한 날짜</p>
        <p className="mt-1 text-sm text-[#e7d4c0]">
          {formatSelectedDate(value)}
        </p>
      </div>

      {isCalendarOpen ? (
        <div
          id={calendarId}
          role="dialog"
          aria-labelledby={`${id}-calendar-title`}
          className="absolute left-0 z-30 mt-3 w-full max-w-sm rounded-lg border border-[#fff7ea]/14 bg-[#171312] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.46)]"
        >
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              aria-label="이전 달 보기"
              onClick={() => moveVisibleMonth(-1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#fff7ea]/12 bg-[#fff7ea]/7 text-[#e7d4c0] transition hover:border-[#f0a15f]/40 hover:text-[#ffd3a3] focus:outline-none focus:ring-2 focus:ring-[#ffd3a3]"
            >
              ‹
            </button>
            <p
              id={`${id}-calendar-title`}
              className="text-sm font-semibold text-[#fff7ea]"
            >
              {monthFormatter.format(visibleMonth)}
            </p>
            <button
              type="button"
              aria-label="다음 달 보기"
              onClick={() => moveVisibleMonth(1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#fff7ea]/12 bg-[#fff7ea]/7 text-[#e7d4c0] transition hover:border-[#f0a15f]/40 hover:text-[#ffd3a3] focus:outline-none focus:ring-2 focus:ring-[#ffd3a3]"
            >
              ›
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#c9ad96]">
            {weekdayLabels.map((weekday) => (
              <span key={weekday} className="py-1">
                {weekday}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarDays.map((date) => {
              const dateValue = formatDateValue(date);
              const isSelected = value === dateValue;
              const isToday = todayValue === dateValue;
              const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();

              return (
                <button
                  type="button"
                  key={dateValue}
                  aria-pressed={isSelected}
                  onClick={() => handleDateSelect(date)}
                  className={cn(
                    "flex min-h-10 items-center justify-center rounded-md border text-sm transition focus:outline-none focus:ring-2 focus:ring-[#ffd3a3]",
                    isSelected
                      ? "border-[#f0a15f] bg-[#ffd3a3] font-semibold text-[#1f1208]"
                      : "border-transparent bg-transparent text-[#e7d4c0] hover:border-[#f0a15f]/35 hover:bg-[#fff7ea]/8",
                    !isCurrentMonth && !isSelected && "text-[#c9ad96]/40",
                    isToday &&
                      !isSelected &&
                      "border-[#f0a15f]/45 text-[#ffd3a3]",
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#fff7ea]/10 pt-3">
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-full px-3 py-2 text-xs font-medium text-[#c9ad96] transition hover:bg-[#fff7ea]/8 hover:text-[#fff7ea] focus:outline-none focus:ring-2 focus:ring-[#ffd3a3]"
            >
              날짜 비우기
            </button>
            <button
              type="button"
              onClick={() => setIsCalendarOpen(false)}
              className="rounded-full px-3 py-2 text-xs font-medium text-[#e7d4c0] transition hover:bg-[#fff7ea]/8 hover:text-[#ffd3a3] focus:outline-none focus:ring-2 focus:ring-[#ffd3a3]"
            >
              닫기
            </button>
          </div>
        </div>
      ) : null}

      <input type="hidden" id={id} name="watchedDate" value={value} />
    </div>
  );
}
