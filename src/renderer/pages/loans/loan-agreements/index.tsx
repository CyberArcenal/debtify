import React, { useState } from "react";
import { FileText, RefreshCw, Filter, X, Plus } from "lucide-react";
import { useLoanAgreements } from "./hooks/useLoanAgreements";
import LoanAgreementsTable from "./components/LoanAgreementsTable";
import CreateAgreementModal from "./components/CreateAgreementModal";
import EditAgreementModal from "./components/EditAgreementModal";
import SignAgreementModal from "./components/SignAgreementModal";
import ViewAgreementModal from "./components/ViewAgreementModal";
import type { LoanAgreement } from "../../../api/core/loan_agreement";
import { dialogs } from "../../../utils/dialogs";
import loanAgreementsAPI from "../../../api/core/loan_agreement";
import Button from "../../../components/UI/Button";
import Pagination from "../../../components/Shared/Pagination";

const LoanAgreementsPage: React.FC = () => {
  const {
    agreements,
    loading,
    error,
    pagination,
    filters,
    currentPage,
    pageSize,
    sortConfig,
    setCurrentPage,
    setPageSize,
    handleFilterChange,
    resetFilters,
    handleSort,
    reload,
  } = useLoanAgreements();

  const [showFilters, setShowFilters] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<LoanAgreement | null>(null);
  const [signLoading, setSignLoading] = useState(false);

  const handleView = (agreement: LoanAgreement) => {
    setSelectedAgreement(agreement);
    setViewModalOpen(true);
  };

  const handleEdit = (agreement: LoanAgreement) => {
    if (agreement.status === "signed") {
      dialogs.error("Cannot edit a signed agreement");
      return;
    }
    setSelectedAgreement(agreement);
    setEditModalOpen(true);
  };

  const handleSign = (agreement: LoanAgreement) => {
    if (agreement.status === "signed") {
      dialogs.error("Agreement is already signed");
      return;
    }
    setSelectedAgreement(agreement);
    setSignModalOpen(true);
  };

  const handleSignConfirm = async () => {
    if (!selectedAgreement) return;
    setSignLoading(true);
    try {
      await loanAgreementsAPI.sign(selectedAgreement.id);
      dialogs.success("Agreement signed successfully");
      reload();
      setSignModalOpen(false);
      setSelectedAgreement(null);
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setSignLoading(false);
    }
  };

  const handleDelete = async (agreement: LoanAgreement) => {
    const confirmed = await dialogs.confirm({
      title: "Delete Agreement",
      message: agreement.status === "signed"
        ? "This agreement is signed. Are you sure you want to delete it? (This may affect legal records.)"
        : "Are you sure you want to delete this draft agreement?",
    });
    if (!confirmed) return;
    try {
      await loanAgreementsAPI.delete(agreement.id, "system", agreement.status === "signed");
      dialogs.success("Agreement deleted");
      reload();
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  const handleDownload = async (agreement: LoanAgreement) => {
    if (!agreement.filePath) {
      dialogs.error("No file attached to this agreement");
      return;
    }
    // For security, we need to fetch the file from backend. But in offline mode, filePath is local path.
    // For simplicity, we can open the file using electron shell or download it.
    // Here we'll just open the file (assuming it's accessible)
    try {
      
      window.backendAPI.openExternal(agreement.filePath);
    } catch (err) {
      dialogs.error("Could not open file");
    }
  };

  const getDisplayRange = () => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, pagination.totalItems);
    return { start, end };
  };
  const { start, end } = getDisplayRange();

  return (
    <div className="p-4" style={{ backgroundColor: "var(--background-color)" }}>
      <div
        className="rounded-md shadow-md border p-4"
        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-[var(--primary-color)]" />
            <h1 className="text-xl font-bold" style={{ color: "var(--sidebar-text)" }}>
              Loan Agreements
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 rounded-md flex items-center gap-1 border"
              style={{ borderColor: "var(--border-color)" }}
            >
              <Filter className="w-4 h-4" /> Filters {showFilters ? "↑" : "↓"}
            </button>
            <button
              onClick={reload}
              disabled={loading}
              className="px-3 py-2 rounded-md flex items-center gap-1 border"
              style={{ borderColor: "var(--border-color)" }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Agreement
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-4 p-3 rounded-md border" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input
                type="text"
                placeholder="Search by lender or terms"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="px-3 py-2 border rounded-md"
                style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)" }}
              />
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="px-3 py-2 border rounded-md"
                style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)" }}
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="signed">Signed</option>
              </select>
              <input
                type="text"
                placeholder="Lender name"
                value={filters.lenderName}
                onChange={(e) => handleFilterChange("lenderName", e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
              <input
                type="date"
                placeholder="From date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
              <input
                type="date"
                placeholder="To date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
            </div>
            <div className="mt-2 flex justify-end">
              <button onClick={resetFilters} className="text-sm text-[var(--primary-color)] flex items-center gap-1">
                <X className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-sm">Show:</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 border rounded text-sm"
              style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
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
            <LoanAgreementsTable
              agreements={agreements}
              onView={handleView}
              onEdit={handleEdit}
              onSign={handleSign}
              onDelete={handleDelete}
              onDownload={handleDownload}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
            {agreements.length === 0 && (
              <div className="text-center py-12 border rounded-md" style={{ borderColor: "var(--border-color)" }}>
                <FileText className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
                <p className="text-lg font-medium">No loan agreements found</p>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">Create a new agreement to get started.</p>
              </div>
            )}
            {agreements.length > 0 && pagination.totalPages > 1 && (
              <div className="mt-4">
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
      </div>

      <CreateAgreementModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} onSuccess={reload} />
      <EditAgreementModal isOpen={editModalOpen} agreement={selectedAgreement} onClose={() => { setEditModalOpen(false); setSelectedAgreement(null); }} onSuccess={reload} />
      <SignAgreementModal isOpen={signModalOpen} agreement={selectedAgreement} onClose={() => { setSignModalOpen(false); setSelectedAgreement(null); }} onConfirm={handleSignConfirm} isLoading={signLoading} />
      <ViewAgreementModal isOpen={viewModalOpen} agreement={selectedAgreement} onClose={() => { setViewModalOpen(false); setSelectedAgreement(null); }} onDownload={() => selectedAgreement && handleDownload(selectedAgreement)} />
    </div>
  );
};

export default LoanAgreementsPage;