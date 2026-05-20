// src/renderer/pages/payments/transactions/components/FilterBar.tsx
import React from "react";
import type { TransactionFilters } from "../hooks/useTransactions";
import BorrowerSelect from "../../../../components/Selects/Borrower";
import DebtSelect from "../../../../components/Selects/Debt";

interface FilterBarProps {
  filters: TransactionFilters;
  onFilterChange: (key: keyof TransactionFilters, value: string | number) => void;
  onReset: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onReset }) => {
  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--border-color)",
    color: "var(--text-primary)",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 rounded-md border mb-4" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
      {/* Search text input */}
      <input
        type="text"
        placeholder="Search debtor/debt/reference"
        value={filters.search}
        onChange={(e) => onFilterChange("search", e.target.value)}
        className="px-3 py-2 border rounded"
        style={inputStyle}
      />

      {/* Date from */}
      <input
        type="date"
        placeholder="From date"
        value={filters.dateFrom}
        onChange={(e) => onFilterChange("dateFrom", e.target.value)}
        className="px-3 py-2 border rounded"
        style={inputStyle}
      />

      {/* Date to */}
      <input
        type="date"
        placeholder="To date"
        value={filters.dateTo}
        onChange={(e) => onFilterChange("dateTo", e.target.value)}
        className="px-3 py-2 border rounded"
        style={inputStyle}
      />

      {/* Borrower Select (searchable) */}
      <div>
        <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Debtor</label>
        <BorrowerSelect
          value={filters.debtorId === "" ? null : (filters.debtorId as number)}
          onChange={(id) => onFilterChange("debtorId", id === null ? "" : id)}
          placeholder="All Debtors"
          activeOnly={true}
        />
      </div>

      {/* Debt Select (searchable) */}
      <div>
        <label className="block text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Debt</label>
        <DebtSelect
          value={filters.debtId === "" ? null : (filters.debtId as number)}
          onChange={(id) => onFilterChange("debtId", id === null ? "" : id)}
          placeholder="All Debts"
          statusFilter="active"
        />
      </div>

      {/* Min amount */}
      <input
        type="number"
        placeholder="Min amount"
        value={filters.minAmount || ""}
        onChange={(e) => onFilterChange("minAmount", parseFloat(e.target.value) || 0)}
        className="px-3 py-2 border rounded"
        style={inputStyle}
      />

      {/* Max amount */}
      <input
        type="number"
        placeholder="Max amount"
        value={filters.maxAmount || ""}
        onChange={(e) => onFilterChange("maxAmount", parseFloat(e.target.value) || 0)}
        className="px-3 py-2 border rounded"
        style={inputStyle}
      />

      {/* Reset button */}
      <button onClick={onReset} className="px-3 py-2 rounded" style={{ backgroundColor: "var(--primary-color)", color: "white" }}>
        Reset Filters
      </button>
    </div>
  );
};

export default FilterBar;