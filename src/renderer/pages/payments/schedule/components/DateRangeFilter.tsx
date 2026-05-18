// src/renderer/pages/payments/schedule/components/DateRangeFilter.tsx
import React from "react";

interface DateRangeFilterProps {
  value: "30" | "60" | "90" | "all";
  onChange: (value: "30" | "60" | "90" | "all") => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange }) => {
  return (
    <div className="flex gap-2">
      {(["30", "60", "90", "all"] as const).map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1 rounded-md text-sm ${value === opt ? "bg-[var(--primary-color)] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          {opt === "all" ? "All" : `${opt} days`}
        </button>
      ))}
    </div>
  );
};

export default DateRangeFilter;