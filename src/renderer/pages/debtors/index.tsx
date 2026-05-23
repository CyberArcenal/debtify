// src/renderer/pages/debtors/index.tsx
import React, { useState, useRef, useEffect } from "react";
import { Plus, Users, RefreshCw } from "lucide-react";
import Button from "../../components/UI/Button";
import { dialogs } from "../../utils/dialogs";
import { showSuccess, showError } from "../../utils/notification";

import useDebtors from "./hooks/useDebtors";
import FilterBar from "./components/FilterBar";
import DebtorTable from "./components/DebtorTable";
import DebtorFormDialog from "./components/DebtorFormDialog";
import DebtorViewDialog from "./components/DebtorViewDialog";
import borrowersAPI from "../../api/core/borrower";
import Pagination from "../../components/Shared/Pagination";

const DebtorDirectory: React.FC = () => {
  const {
    debtors,
    loading,
    error,
    pagination,
    filters,
    selectedDebtors,
    setSelectedDebtors,
    sortConfig,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    reload,
    handleFilterChange,
    resetFilters,
    toggleDebtorSelection,
    toggleSelectAll,
    handleSort,
  } = useDebtors();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingDebtor, setEditingDebtor] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingDebtor, setViewingDebtor] = useState<any>(null);

  // Ref para sa pagination container (para sa auto-scroll)
  const paginationRef = useRef<HTMLDivElement>(null);

  // Auto-scroll pababa sa pagination kapag nagbago ang currentPage AT tapos na ang loading
  useEffect(() => {
    if (!loading && paginationRef.current) {
      setTimeout(() => {
        paginationRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 200);
    }
  }, [currentPage, loading]);

  const openAddForm = () => {
    setFormMode("add");
    setEditingDebtor(null);
    setFormOpen(true);
  };

  const openEditForm = (debtor: any) => {
    setFormMode("edit");
    setEditingDebtor(debtor);
    setFormOpen(true);
  };

  const openView = (debtor: any) => {
    setViewingDebtor(debtor);
    setViewOpen(true);
  };

  const handleDelete = async (debtor: any) => {
    const confirmed = await dialogs.confirm({
      title: "Delete Debtor",
      message: `Are you sure you want to delete ${debtor.name}? This action can be reversed.`,
    });
    if (!confirmed) return;
    try {
      await borrowersAPI.delete(debtor.id);
      showSuccess("Debtor deleted successfully");
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleRestore = async (debtor: any) => {
    const confirmed = await dialogs.confirm({
      title: "Restore Debtor",
      message: `Restore ${debtor.name}?`,
    });
    if (!confirmed) return;
    try {
      await borrowersAPI.restore(debtor.id);
      showSuccess("Debtor restored");
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDebtors.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Bulk Delete",
      message: `Delete ${selectedDebtors.length} debtors?`,
    });
    if (!confirmed) return;
    try {
      await Promise.all(selectedDebtors.map((id) => borrowersAPI.delete(id)));
      showSuccess(`${selectedDebtors.length} debtors deleted`);
      setSelectedDebtors([]);
      reload();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const getDisplayRange = () => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, pagination.totalItems);
    return { start, end };
  };
  const { start, end } = getDisplayRange();

  return (
    <div
      className="rounded-md shadow-md border p-4"
      style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--sidebar-text)" }}>
            Debtor Directory
          </h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Manage all borrowers, their contact details, and outstanding debts
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={reload}
            disabled={loading}
            className="px-3 py-2 rounded-md flex items-center gap-1 transition-all"
            style={{ backgroundColor: "var(--card-secondary-bg)", color: "var(--sidebar-text)" }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Button onClick={openAddForm} variant="success" icon={Plus}>
            Add Debtor
          </Button>
        </div>
      </div>

      <FilterBar filters={filters} onFilterChange={handleFilterChange} onReset={resetFilters} />

      {selectedDebtors.length > 0 && (
        <div
          className="mb-4 p-3 rounded-md flex items-center justify-between"
          style={{ backgroundColor: "var(--accent-blue-light)", border: "1px solid var(--accent-blue)" }}
        >
          <span className="text-sm font-medium">{selectedDebtors.length} debtor(s) selected</span>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1 rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            Delete Selected
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          <label className="text-sm">Show:</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2 py-1 border rounded text-sm"
            style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--sidebar-text)" }}
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="text-sm text-[var(--text-secondary)]">entries</span>
        </div>
        <div className="text-sm text-[var(--text-secondary)]">
          {pagination.totalItems > 0 ? `Showing ${start} to ${end} of ${pagination.totalItems} entries` : "No entries"}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)]"></div>
        </div>
      )}
      {error && <div className="text-center py-4 text-red-500">Error: {error}</div>}

      {!loading && !error && (
        <>
          <DebtorTable
            debtors={debtors}
            selectedDebtors={selectedDebtors}
            onToggleSelect={toggleDebtorSelection}
            onToggleSelectAll={toggleSelectAll}
            onSort={handleSort}
            sortConfig={sortConfig}
            onView={openView}
            onEdit={openEditForm}
            onDelete={handleDelete}
            onRestore={handleRestore}
          />

          {debtors.length === 0 && (
            <div className="text-center py-12 border rounded-md" style={{ borderColor: "var(--border-color)" }}>
              <Users className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
              <p className="text-lg font-medium">No debtors found</p>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                {filters.search || filters.status !== "active" ? "Try adjusting your filters" : "Start by adding your first debtor"}
              </p>
              <div className="mt-4">
                <Button onClick={openAddForm} variant="primary">Add Debtor</Button>
              </div>
            </div>
          )}

          {debtors.length > 0 && pagination.totalPages > 1 && (
            <div ref={paginationRef} className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalItems={pagination.totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 25, 50, 100]}
                showPageSize={false}
              />
            </div>
          )}
        </>
      )}

      <DebtorFormDialog
        isOpen={formOpen}
        mode={formMode}
        debtorId={editingDebtor?.id || null}
        initialData={editingDebtor}
        onClose={() => setFormOpen(false)}
        onSuccess={reload}
      />
      <DebtorViewDialog
        debtor={viewingDebtor}
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        onEdit={() => {
          setViewOpen(false);
          openEditForm(viewingDebtor);
        }}
      />
    </div>
  );
};

export default DebtorDirectory;