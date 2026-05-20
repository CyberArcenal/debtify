// src/renderer/pages/payments/schedule/components/DateRangeFilter.tsx
import React from "react";

interface DateRangeFilterProps {
  value: "30" | "60" | "90" | "all";
  onChange: (value: "30" | "60" | "90" | "all") => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange }) => {
  const getButtonStyle = (opt: string) => {
    if (value === opt) {
      return { backgroundColor: "var(--primary-color)", color: "white" };
    }
    return { backgroundColor: "var(--card-secondary-bg)", color: "var(--text-primary)" };
  };

  return (
    <div className="flex gap-2">
      {(["30", "60", "90", "all"] as const).map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className="px-3 py-1 rounded-md text-sm"
          style={getButtonStyle(opt)}
        >
          {opt === "all" ? "All" : `${opt} days`}
        </button>
      ))}
    </div>
  );
};

export default DateRangeFilter;