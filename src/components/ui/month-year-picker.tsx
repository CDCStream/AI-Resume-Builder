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
  { short: "Sept", num: "09" },
  { short: "Oct", num: "10" },
  { short: "Nov", num: "11" },
  { short: "Dec", num: "12" },
];

export function MonthYearPicker({
  value,
  onChange,
  placeholder = "MM / YYYY",
  disabled = false,
}: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [year, setYear] = useState(() => {
    if (value && value !== "Present") {
      const parts = value.split("-");
      return parseInt(parts[0]) || new Date().getFullYear();
    }
    return new Date().getFullYear();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse the current value
  const parseValue = () => {
    if (!value || value === "Present") return { month: "", year: "" };
    const parts = value.split("-");
    return { year: parts[0] || "", month: parts[1] || "" };
  };

  const { month: selectedMonth, year: selectedYear } = parseValue();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMonthSelect = (monthNum: string) => {
    onChange(`${year}-${monthNum}`);
    setIsOpen(false);
  };

  const handlePrevYear = () => setYear((y) => y - 1);
  const handleNextYear = () => setYear((y) => y + 1);

  const displayValue = value === "Present"
    ? "Present"
    : value
      ? `${months.find(m => m.num === selectedMonth)?.short || ""} ${selectedYear}`
      : "";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
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

      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          {/* Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevYear}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-semibold text-gray-900">{year}</span>
            <button
              type="button"
              onClick={handleNextYear}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-4 gap-2">
            {months.map((month) => {
              const isSelected = selectedMonth === month.num && selectedYear === year.toString();
              return (
                <button
                  key={month.num}
                  type="button"
                  onClick={() => handleMonthSelect(month.num)}
                  className={`py-2 px-1 text-sm rounded-md transition-colors
                    ${isSelected
                      ? "bg-blue-500 text-white font-medium"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    }
                  `}
                >
                  {month.short}
                </button>
              );
            })}
          </div>
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

