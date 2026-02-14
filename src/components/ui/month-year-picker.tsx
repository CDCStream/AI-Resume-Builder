"use client";

import { useState, useRef, useEffect } from "react";

interface MonthYearPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const months = [
  { short: "Jan", num: "01" },
  { short: "Feb", num: "02" },
  { short: "Mar", num: "03" },
  { short: "Apr", num: "04" },
  { short: "May", num: "05" },
  { short: "Jun", num: "06" },
  { short: "Jul", num: "07" },
  { short: "Aug", num: "08" },
  { short: "Sep", num: "09" },
  { short: "Oct", num: "10" },
  { short: "Nov", num: "11" },
  { short: "Dec", num: "12" },
];

type PickerView = "months" | "years" | "decades";

export function MonthYearPicker({
  value,
  onChange,
  placeholder = "MM / YYYY",
  disabled = false,
}: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<PickerView>("months");
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const [year, setYear] = useState(() => {
    if (value && value !== "Present") {
      const parts = value.split("-");
      return parseInt(parts[0]) || currentYear;
    }
    return currentYear;
  });

  // For decade view: which decade range to show
  const [decadeStart, setDecadeStart] = useState(() => Math.floor(year / 10) * 10);
  // For year view: which range to show (groups of 12)
  const [yearRangeStart, setYearRangeStart] = useState(() => Math.floor(year / 12) * 12);

  const containerRef = useRef<HTMLDivElement>(null);
  const yearGridRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null);

  const parseValue = () => {
    if (!value || value === "Present") return { month: "", year: "" };
    const parts = value.split("-");
    return { year: parts[0] || "", month: parts[1] || "" };
  };

  const { month: selectedMonth, year: selectedYear } = parseValue();

  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedInContainer = containerRef.current && containerRef.current.contains(target);
      const clickedInPopup = popupRef.current && popupRef.current.contains(target);
      if (!clickedInContainer && !clickedInPopup) {
        setIsOpen(false);
        setView("months");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset view when opening
  useEffect(() => {
    if (isOpen) {
      setView("months");
      setYearRangeStart(Math.floor(year / 12) * 12);
      setDecadeStart(Math.floor(year / 20) * 20);
    }
  }, [isOpen, year]);

  const handleMonthSelect = (monthNum: string) => {
    onChange(`${year}-${monthNum}`);
    setIsOpen(false);
    setView("months");
  };

  const handleYearSelect = (selectedYr: number) => {
    setYear(selectedYr);
    setView("months");
  };

  const handlePrevYear = () => setYear((y) => y - 1);
  const handleNextYear = () => {
    if (year < currentYear) setYear((y) => y + 1);
  };

  const isMonthDisabled = (monthNum: string) => {
    if (year > currentYear) return true;
    if (year === currentYear && parseInt(monthNum) > currentMonth) return true;
    return false;
  };

  const displayValue = value === "Present"
    ? "Present"
    : value
      ? `${months.find(m => m.num === selectedMonth)?.short || ""} ${selectedYear}`
      : "";

  // Generate year grid (24 years at a time)
  const yearGridStart = yearRangeStart;
  const yearGridEnd = yearRangeStart + 23;
  const yearGrid = Array.from({ length: 24 }, (_, i) => yearGridStart + i).filter(y => y <= currentYear);

  const handleOpen = () => {
    if (disabled) return;
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popupWidth = 288; // w-72 = 18rem = 288px
      const popupHeight = 280;
      let top = rect.bottom + 4;
      let left = rect.left;

      // If popup would overflow right edge
      if (left + popupWidth > window.innerWidth - 8) {
        left = window.innerWidth - popupWidth - 8;
      }
      // If popup would overflow left edge
      if (left < 8) left = 8;

      // If popup would overflow bottom, show above
      if (top + popupHeight > window.innerHeight - 8) {
        top = rect.top - popupHeight - 4;
      }
      // If still off-screen top, clamp
      if (top < 8) top = 8;

      setPopupPos({ top, left });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`w-full h-10 px-3 text-left rounded-md border bg-background text-sm transition-colors
          ${disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "border-input hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          }
          ${isOpen ? "border-blue-500 ring-1 ring-blue-500" : ""}
        `}
      >
        {displayValue || <span className="text-gray-400">{placeholder}</span>}
      </button>

      {isOpen && popupPos && (
        <div
          ref={popupRef}
          className="fixed z-[9999] w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-4 animate-in fade-in zoom-in-95 duration-150"
          style={{ top: popupPos.top, left: popupPos.left }}
        >

          {/* === MONTHS VIEW === */}
          {view === "months" && (
            <>
              {/* Year Navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={handlePrevYear}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Clickable Year - opens year selector */}
                <button
                  type="button"
                  onClick={() => {
                    setYearRangeStart(Math.floor(year / 24) * 24);
                    setView("years");
                  }}
                  className="px-3 py-1 text-base font-semibold text-gray-900 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                >
                  {year}
                  <svg className="w-3 h-3 inline-block ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleNextYear}
                  disabled={year >= currentYear}
                  className={`p-1.5 rounded-lg transition-colors ${
                    year >= currentYear ? "text-gray-200 cursor-not-allowed" : "hover:bg-gray-100 text-gray-500"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-4 gap-1.5">
                {months.map((month) => {
                  const isSelected = selectedMonth === month.num && selectedYear === year.toString();
                  const isDisabled = isMonthDisabled(month.num);
                  const isCurrent = year === currentYear && parseInt(month.num) === currentMonth;
                  return (
                    <button
                      key={month.num}
                      type="button"
                      onClick={() => !isDisabled && handleMonthSelect(month.num)}
                      disabled={isDisabled}
                      className={`py-2.5 px-1 text-sm rounded-lg transition-all duration-150
                        ${isDisabled
                          ? "text-gray-200 cursor-not-allowed"
                          : isSelected
                            ? "bg-blue-500 text-white font-semibold shadow-sm"
                            : isCurrent
                              ? "bg-blue-50 text-blue-600 font-medium ring-1 ring-blue-200"
                              : "text-gray-700 hover:bg-gray-100"
                        }
                      `}
                    >
                      {month.short}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* === YEARS VIEW === */}
          {view === "years" && (
            <>
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setYearRangeStart(y => y - 24)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <span className="px-3 py-1 text-base font-semibold text-gray-900">
                  {yearGridStart} — {Math.min(yearGridEnd, currentYear)}
                </span>

                <button
                  type="button"
                  onClick={() => setYearRangeStart(y => y + 24)}
                  disabled={yearRangeStart + 24 > currentYear}
                  className={`p-1.5 rounded-lg transition-colors ${
                    yearRangeStart + 24 > currentYear ? "text-gray-200 cursor-not-allowed" : "hover:bg-gray-100 text-gray-500"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div ref={yearGridRef} className="grid grid-cols-4 gap-1.5 max-h-56 overflow-y-auto">
                {yearGrid.map((yr) => {
                  const isSelected = yr === year;
                  const isCurYear = yr === currentYear;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => handleYearSelect(yr)}
                      className={`py-2.5 px-1 text-sm rounded-lg transition-all duration-150
                        ${isSelected
                          ? "bg-blue-500 text-white font-semibold shadow-sm"
                          : isCurYear
                            ? "bg-blue-50 text-blue-600 font-medium ring-1 ring-blue-200"
                            : "text-gray-700 hover:bg-gray-100"
                        }
                      `}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setView("months")}
                className="w-full mt-3 py-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
              >
                ← Back to months
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface DateRangeWithCurrentProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  currentLabel?: string;
}

// Simple date range without "currently" toggle - for Education
interface DateRangeProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  label?: string;
}

export function DateRange({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = "Start & End Date",
}: DateRangeProps) {
  return (
    <div className="space-y-2">
      <span className="text-xs text-gray-600">{label}</span>
      <div className="grid grid-cols-2 gap-3">
        <MonthYearPicker
          value={startDate}
          onChange={onStartDateChange}
          placeholder="MM / YYYY"
        />
        <MonthYearPicker
          value={endDate}
          onChange={onEndDateChange}
          placeholder="MM / YYYY"
        />
      </div>
    </div>
  );
}

export function DateRangeWithCurrent({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  currentLabel = "Currently work here",
}: DateRangeWithCurrentProps) {
  const isCurrent = endDate === "Present";

  const handleCurrentToggle = () => {
    if (isCurrent) {
      onEndDateChange("");
    } else {
      onEndDateChange("Present");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">Start & End Date</span>
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600"
          title="Select your employment dates"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MonthYearPicker
          value={startDate}
          onChange={onStartDateChange}
          placeholder="MM / YYYY"
        />
        <MonthYearPicker
          value={endDate}
          onChange={onEndDateChange}
          placeholder="MM / YYYY"
          disabled={isCurrent}
        />
      </div>

      {/* Currently work here toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <button
          type="button"
          onClick={handleCurrentToggle}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            isCurrent ? "bg-blue-500" : "bg-gray-200"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              isCurrent ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-sm text-gray-600">{currentLabel}</span>
      </label>
    </div>
  );
}

