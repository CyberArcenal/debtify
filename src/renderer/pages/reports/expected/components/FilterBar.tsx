// src/renderer/pages/reports/expected/components/FilterBar.tsx
import React, { useEffect, useState } from "react";
import groupsAPI from "../../../../api/core/group";
import type { DebtorGroup } from "../../../../api/core/group";

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
  const [groups, setGroups] = useState<DebtorGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      setLoadingGroups(true);
      try {
        const res = await groupsAPI.getAll();
        if (res.status) setGroups(res.data);
      } catch (err) {
        console.error("Failed to load groups:", err);
      } finally {
        setLoadingGroups(false);
      }
    };
    loadGroups();
  }, []);

  return (
    <div className="flex flex-wrap gap-3 items-end mb-4 p-3 bg-gray-50 rounded-md border">
      <div>
        <label className="block text-sm font-medium mb-1">From Date</label>
        <input type="date" value={fromDate} onChange={(e) => onFromDateChange(e.target.value)} className="px-3 py-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">To Date</label>
        <input type="date" value={toDate} onChange={(e) => onToDateChange(e.target.value)} className="px-3 py-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Group By</label>
        <select value={groupBy} onChange={(e) => onGroupByChange(e.target.value as any)} className="px-3 py-2 border rounded">
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Debtor Group</label>
        <select
          value={selectedGroupId}
          onChange={(e) => onGroupIdChange(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="px-3 py-2 border rounded"
          disabled={loadingGroups}
        >
          <option value="all">All Groups</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>
      <button onClick={onRefresh} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        {loading ? "Loading..." : "Refresh"}
      </button>
    </div>
  );
};

export default FilterBar;