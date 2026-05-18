// src/renderer/pages/payments/transactions/components/FilterBar.tsx
import React, { useEffect, useState } from "react";
import type { TransactionFilters } from "../hooks/useTransactions";
import borrowersAPI from "../../../../api/core/borrower";
import debtsAPI from "../../../../api/core/debt";
import type { Borrower } from "../../../../api/core/borrower";
import type { Debt } from "../../../../api/core/debt";

interface FilterBarProps {
  filters: TransactionFilters;
  onFilterChange: (key: keyof TransactionFilters, value: string | number) => void;
  onReset: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onReset }) => {
  const [debtors, setDebtors] = useState<Borrower[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [debtorsRes, debtsRes] = await Promise.all([
          borrowersAPI.getAll({ limit: 1000, includeDeleted: false }),
          debtsAPI.getAll({ limit: 1000, includeDeleted: false, status: "active" }),
        ]);
        if (debtorsRes.status) setDebtors(debtorsRes.data);
        if (debtsRes.status) setDebts(debtsRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 rounded-md border mb-4 bg-gray-50">
      <input type="text" placeholder="Search debtor/debt/reference" value={filters.search} onChange={(e) => onFilterChange("search", e.target.value)} className="px-3 py-2 border rounded" />
      <input type="date" placeholder="From date" value={filters.dateFrom} onChange={(e) => onFilterChange("dateFrom", e.target.value)} className="px-3 py-2 border rounded" />
      <input type="date" placeholder="To date" value={filters.dateTo} onChange={(e) => onFilterChange("dateTo", e.target.value)} className="px-3 py-2 border rounded" />
      <select value={filters.debtorId} onChange={(e) => onFilterChange("debtorId", e.target.value ? Number(e.target.value) : "")} className="px-3 py-2 border rounded">
        <option value="">All Debtors</option>
        {debtors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      <select value={filters.debtId} onChange={(e) => onFilterChange("debtId", e.target.value ? Number(e.target.value) : "")} className="px-3 py-2 border rounded">
        <option value="">All Debts</option>
        {debts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      <input type="number" placeholder="Min amount" value={filters.minAmount || ""} onChange={(e) => onFilterChange("minAmount", parseFloat(e.target.value) || 0)} className="px-3 py-2 border rounded" />
      <input type="number" placeholder="Max amount" value={filters.maxAmount || ""} onChange={(e) => onFilterChange("maxAmount", parseFloat(e.target.value) || 0)} className="px-3 py-2 border rounded" />
      <button onClick={onReset} className="px-3 py-2 bg-blue-600 text-white rounded">Reset Filters</button>
    </div>
  );
};

export default FilterBar;