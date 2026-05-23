// src/renderer/pages/reports/aging/components/BucketDrillDownModal.tsx
import React, { useState, useEffect, useCallback } from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import Pagination from "../../../../components/Shared/Pagination";
import debtsAPI from "../../../../api/core/debt";
import type { Debt } from "../../../../api/core/debt";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface BucketDrillDownModalProps {
  isOpen: boolean;
  bucketRange: string;   // e.g., "0-30 days", "31-60 days", etc.
  asOfDate: string;      // YYYY-MM-DD
  onClose: () => void;
}

const BucketDrillDownModal: React.FC<BucketDrillDownModalProps> = ({
  isOpen,
  bucketRange,
  asOfDate,
  onClose,
}) => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0, pageSize: 10 });

  const fetchDebts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Call backend endpoint to get debts in the given bucket
      const response = await debtsAPI.getDebtsInBucket(bucketRange, asOfDate, page, pageSize);
      if (!response.status) throw new Error(response.message);
      setDebts(response.data.data);
      setPagination({
        page: response.data.pagination.page,
        totalPages: response.data.pagination.pages,
        totalItems: response.data.pagination.total,
        pageSize: response.data.pagination.limit,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [bucketRange, asOfDate, page, pageSize]);

  useEffect(() => {
    if (isOpen) {
      fetchDebts();
    }
  }, [isOpen, fetchDebts]);

  const handlePageChange = (newPage: number) => setPage(newPage);
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Debts in ${bucketRange}`} size="xl">
      <div className="max-h-96 overflow-y-auto">
        {loading && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)]"></div></div>}
        {error && <div className="text-center py-4 text-red-500">Error: {error}</div>}
        {!loading && !error && debts.length === 0 && (
          <div className="text-center py-8 text-[var(--text-tertiary)]">No debts in this bucket.</div>
        )}
        {!loading && !error && debts.length > 0 && (
          <>
            <table className="min-w-full">
              <thead className="sticky top-0" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
                <tr>
                  <th className="px-3 py-2 text-left text-xs" style={{ color: "var(--text-secondary)" }}>Debt Name</th>
                  <th className="px-3 py-2 text-left text-xs" style={{ color: "var(--text-secondary)" }}>Borrower</th>
                  <th className="px-3 py-2 text-right text-xs" style={{ color: "var(--text-secondary)" }}>Amount</th>
                  <th className="px-3 py-2 text-left text-xs" style={{ color: "var(--text-secondary)" }}>Due Date</th>
                  <th className="px-3 py-2 text-right text-xs" style={{ color: "var(--text-secondary)" }}>Days Past Due</th>
                </tr>
              </thead>
              <tbody>
                {debts.map(debt => {
                  const daysPastDue = Math.max(0, Math.floor((new Date(asOfDate).getTime() - new Date(debt.dueDate).getTime()) / (1000*3600*24)));
                  return (
                    <tr key={debt.id} className="border-t" style={{ borderColor: "var(--border-color)" }}>
                      <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>{debt.name}</td>
                      <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>{debt.borrower?.name || "—"}</td>
                      <td className="px-3 py-2 text-right" style={{ color: "var(--debt-high)" }}>{formatCurrency(debt.remainingAmount)}</td>
                      <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>{formatDate(debt.dueDate)}</td>
                      <td className="px-3 py-2 text-right" style={{ color: "var(--text-primary)" }}>{daysPastDue}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {pagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={page}
                  totalItems={pagination.totalItems}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  pageSizeOptions={[10, 25, 50, 100]}
                  showPageSize={true}
                />
              </div>
            )}
          </>
        )}
      </div>
      <div className="mt-4 flex justify-end"><Button variant="secondary" onClick={onClose}>Close</Button></div>
    </Modal>
  );
};

export default BucketDrillDownModal;