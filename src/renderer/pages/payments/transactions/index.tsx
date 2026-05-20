// src/renderer/pages/payments/transactions/index.tsx
import React, { useState } from "react";
import { Receipt, RefreshCw, Filter, Download } from "lucide-react";
import Pagination from "../../../components/Shared/Pagination";
import useTransactions from "./hooks/useTransactions";
import FilterBar from "./components/FilterBar";
import TransactionsTable from "./components/TransactionsTable";
import EditTransactionModal from "./components/EditTransactionModal";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import { formatCurrency } from "../../../utils/formatters";
import { dialogs } from "../../../utils/dialogs";
import paymentsAPI from "../../../api/core/payment_transaction";

const IS_ADMIN = true; // or get from settings / user context

const TransactionsPage: React.FC = () => {
  const {
    paginatedTransactions,
    filters,
    loading,
    error,
    pagination,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload,
    handleFilterChange,
    resetFilters,
    handleSort,
    sortConfig,
    totalAmount,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();

  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [deletingTx, setDeletingTx] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await paymentsAPI.export("csv", filters);
      if (response.status) {
        const blob = new Blob([response.data.data], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = response.data.filename || `transactions_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        dialogs.success("Export completed");
      }
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTx) return;
    setDeleteLoading(true);
    try {
      await deleteTransaction(deletingTx.id);
      dialogs.success("Transaction deleted");
      setDeletingTx(null);
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getDisplayRange = () => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, pagination.count);
    return { start, end };
  };
  const { start, end } = getDisplayRange();

  return (
    <div className="p-4" style={{ backgroundColor: "var(--background-color)" }}>
      <div className="rounded-md shadow-md border p-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6" style={{ color: "var(--primary-color)" }} />
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Transaction Log</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-2 rounded-md flex items-center gap-1 border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--card-secondary-bg)", color: "var(--text-primary)" }}>
              <Filter className="w-4 h-4" /> Filters
            </button>
            <button onClick={reload} disabled={loading} className="px-3 py-2 rounded-md flex items-center gap-1 border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--card-secondary-bg)", color: "var(--text-primary)" }}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button onClick={handleExport} disabled={exporting || pagination.count === 0} className="px-3 py-2 rounded-md flex items-center gap-1" style={{ backgroundColor: "var(--success-color)", color: "white" }}>
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {showFilters && <FilterBar filters={filters} onFilterChange={handleFilterChange} onReset={resetFilters} />}

        <div className="mb-3 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm" style={{ color: "var(--text-secondary)" }}>Show:</label>
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="px-2 py-1 border rounded text-sm" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
              {[10,25,50,100].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="text-sm" style={{ color: "var(--text-primary)" }}>Total Amount: <span className="font-bold" style={{ color: "var(--success-color)" }}>{formatCurrency(totalAmount)}</span></div>
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{pagination.count > 0 ? `Showing ${start} to ${end} of ${pagination.count} entries` : "No entries"}</div>
        </div>

        {loading && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--primary-color)" }}></div></div>}
        {error && <div className="text-center py-4" style={{ color: "var(--danger-color)" }}>Error: {error}</div>}

        {!loading && !error && (
          <>
            <TransactionsTable
              transactions={paginatedTransactions}
              onSort={handleSort}
              sortConfig={sortConfig}
              isAdmin={IS_ADMIN}
              onEdit={(tx) => setEditingTx(tx)}
              onDelete={(tx) => setDeletingTx(tx)}
            />
            {pagination.count === 0 && (
              <div className="text-center py-8" style={{ color: "var(--text-secondary)" }}>No transactions found.</div>
            )}
            {pagination.total_pages > 1 && (
              <div className="mt-4">
                <Pagination currentPage={currentPage} totalItems={pagination.count} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} pageSizeOptions={[10,25,50,100]} showPageSize={false} />
              </div>
            )}
          </>
        )}
      </div>

      <EditTransactionModal isOpen={!!editingTx} transaction={editingTx} onClose={() => setEditingTx(null)} onSave={updateTransaction} />
      <DeleteConfirmationModal isOpen={!!deletingTx} transaction={deletingTx} onClose={() => setDeletingTx(null)} onConfirm={handleDeleteConfirm} loading={deleteLoading} />
    </div>
  );
};

export default TransactionsPage;