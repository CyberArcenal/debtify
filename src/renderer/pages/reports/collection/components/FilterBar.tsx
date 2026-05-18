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
  return (
    <div className="flex flex-wrap gap-3 items-end mb-6 p-3 bg-gray-50 rounded-md border">
      <div>
        <label className="block text-sm font-medium mb-1">From Date</label>
        <input type="date" value={fromDate} onChange={(e) => onFromDateChange(e.target.value)} className="px-3 py-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">To Date</label>
        <input type="date" value={toDate} onChange={(e) => onToDateChange(e.target.value)} className="px-3 py-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Expected Target (PHP)</label>
        <input type="number" step="1000" value={target} onChange={(e) => onTargetChange(parseFloat(e.target.value) || 0)} className="px-3 py-2 border rounded" />
      </div>
      <button onClick={onRefresh} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        {loading ? "Loading..." : "Refresh"}
      </button>
    </div>
  );
};

export default FilterBar;