// src/renderer/pages/reports/aging/components/AgingFilterBar.tsx
import React from "react";

interface AgingFilterBarProps {
  asOfDate: string;
  onAsOfDateChange: (date: string) => void;
  onRefresh: () => void;
}

const AgingFilterBar: React.FC<AgingFilterBarProps> = ({ asOfDate, onAsOfDateChange, onRefresh }) => {
  return (
    <div className="flex flex-wrap gap-3 items-end mb-4 p-3 bg-gray-50 rounded-md border">
      <div>
        <label className="block text-sm font-medium mb-1">As of Date</label>
        <input type="date" value={asOfDate} onChange={(e) => onAsOfDateChange(e.target.value)} className="px-3 py-2 border rounded" />
      </div>
      <button onClick={onRefresh} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Refresh</button>
    </div>
  );
};

export default AgingFilterBar;