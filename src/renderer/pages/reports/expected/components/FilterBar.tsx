// src/renderer/pages/reports/expected/components/FilterBar.tsx
import React from "react";
import GroupSelect from "../../../../components/Selects/Group";

interface FilterBarProps {
  fromDate: string;
  toDate: string;
  groupBy: "day" | "week" | "month";
  selectedGroupId: number | "all";
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onGroupByChange: (value: "day" | "week" | "month") => void;
  onGroupIdChange: (id: number | "all") => void;
  onRefresh: () => void;
  loading: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  fromDate,
  toDate,
  groupBy,
  selectedGroupId,
  onFromDateChange,
  onToDateChange,
  onGroupByChange,
  onGroupIdChange,
  onRefresh,
  loading,
}) => {
  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--border-color)",
    color: "var(--text-primary)",
  };

  const handleGroupChange = (groupId: number | null) => {
    onGroupIdChange(groupId === null ? "all" : groupId);
  };

  return (
    <div className="flex flex-wrap gap-3 items-end mb-4 p-3 rounded-md border" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>From Date</label>
        <input type="date" value={fromDate} onChange={(e) => onFromDateChange(e.target.value)} className="px-3 py-2 border rounded" style={inputStyle} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>To Date</label>
        <input type="date" value={toDate} onChange={(e) => onToDateChange(e.target.value)} className="px-3 py-2 border rounded" style={inputStyle} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Group By</label>
        <select value={groupBy} onChange={(e) => onGroupByChange(e.target.value as any)} className="px-3 py-2 border rounded" style={inputStyle}>
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Debtor Group</label>
        <GroupSelect
          value={selectedGroupId === "all" ? null : selectedGroupId}
          onChange={handleGroupChange}
          placeholder="All Groups"
        />
      </div>
      <button onClick={onRefresh} disabled={loading} className="px-4 py-2 rounded" style={{ backgroundColor: "var(--primary-color)", color: "white" }}>
        {loading ? "Loading..." : "Refresh"}
      </button>
    </div>
  );
};

export default FilterBar;