// src/renderer/pages/reports/collection/components/FilterBar.tsx
import React from "react";

interface FilterBarProps {
  fromDate: string;
  toDate: string;
  target: number;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onTargetChange: (target: number) => void;
  onRefresh: () => void;
  loading: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  fromDate,
  toDate,
  target,
  onFromDateChange,
  onToDateChange,
  onTargetChange,
  onRefresh,
  loading,
}) => {
  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--border-color)",
    color: "var(--text-primary)",
  };

  return (
    <div className="flex flex-wrap gap-3 items-end mb-6 p-3 rounded-md border" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>From Date</label>
        <input type="date" value={fromDate} onChange={(e) => onFromDateChange(e.target.value)} className="px-3 py-2 border rounded" style={inputStyle} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>To Date</label>
        <input type="date" value={toDate} onChange={(e) => onToDateChange(e.target.value)} className="px-3 py-2 border rounded" style={inputStyle} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Expected Target (PHP)</label>
        <input type="number" step="1000" value={target} onChange={(e) => onTargetChange(parseFloat(e.target.value) || 0)} className="px-3 py-2 border rounded" style={inputStyle} />
      </div>
      <button onClick={onRefresh} disabled={loading} className="px-4 py-2 rounded" style={{ backgroundColor: "var(--primary-color)", color: "white" }}>
        {loading ? "Loading..." : "Refresh"}
      </button>
    </div>
  );
};

export default FilterBar;