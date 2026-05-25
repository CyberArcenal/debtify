// src/components/Shared/DateDisplay.tsx
import React from "react";
import { Calendar } from "lucide-react";

const DateDisplay: React.FC = () => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--card-secondary-bg)] border border-[var(--border-color)]">
      <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
      <div className="flex flex-col">
        <div className="text-sm font-medium text-[var(--sidebar-text)]">
          {today.toLocaleDateString("en-US", { weekday: "long" })}
        </div>
        <div className="text-xs text-[var(--text-tertiary)]">{formattedDate}</div>
      </div>
    </div>
  );
};

export default DateDisplay;