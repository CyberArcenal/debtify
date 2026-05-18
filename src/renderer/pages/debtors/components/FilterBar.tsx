// src/renderer/pages/debtors/components/FilterBar.tsx
import React from "react";
import type { DebtorFilters } from "../hooks/useDebtors";

interface FilterBarProps {
  filters: DebtorFilters;
  onFilterChange: (key: keyof DebtorFilters, value: string) => void;
  onReset: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onReset }) => {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-md border mb-4"
      style={{
        backgroundColor: "var(--card-secondary-bg)",
        borderColor: "var(--border-color)",
      }}
    >
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--sidebar-text)" }}>
          Search
        </label>
        <input
          type="text"
          placeholder="Search by name, email, or contact..."
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--border-color)",
            color: "var(--sidebar-text)",
          }}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--sidebar-text)" }}>
          Status
        </label>
        <select
          value={filters.status}
          onChange={(e) => onFilterChange("status", e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--border-color)",
            color: "var(--sidebar-text)",
          }}
        >
          <option value="active">Active</option>
          <option value="deleted">Deleted</option>
          <option value="all">All</option>
        </select>
      </div>
      <div className="flex items-end">
        <button
          onClick={onReset}
          className="w-full py-2 px-4 rounded-md transition-colors"
          style={{ backgroundColor: "var(--primary-color)", color: "white" }}
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default FilterBar;