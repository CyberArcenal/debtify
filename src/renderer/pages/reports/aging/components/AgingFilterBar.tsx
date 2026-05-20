// src/renderer/pages/reports/aging/components/AgingFilterBar.tsx
import React from "react";

interface AgingFilterBarProps {
  asOfDate: string;
  onAsOfDateChange: (date: string) => void;
  onRefresh: () => void;
}

const AgingFilterBar: React.FC<AgingFilterBarProps> = ({ asOfDate, onAsOfDateChange, onRefresh }) => {
  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--border-color)",
    color: "var(--text-primary)",
  };

  return (
    <div className="flex flex-wrap gap-3 items-end mb-4 p-3 rounded-md border" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>As of Date</label>
        <input type="date" value={asOfDate} onChange={(e) => onAsOfDateChange(e.target.value)} className="px-3 py-2 border rounded" style={inputStyle} />
      </div>
      <button onClick={onRefresh} className="px-4 py-2 rounded" style={{ backgroundColor: "var(--primary-color)", color: "white" }}>Refresh</button>
    </div>
  );
};

export default AgingFilterBar;