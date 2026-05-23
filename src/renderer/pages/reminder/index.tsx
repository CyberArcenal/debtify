import React, { useState } from "react";
import { Filter, RefreshCw, Mail } from "lucide-react";
import { dialogs } from "../../utils/dialogs";
import reminderLogAPI from "../../api/core/reminder_log";
import { showSuccess, showError } from "../../utils/notification";
import type { NotificationLogEntry } from "../../api/core/reminder_log";
import Pagination from "../../components/Shared/Pagination";
import { useNotificationLogs } from "./hooks/useNotificationLogs";
import { NotificationStats } from "./components/reminderStats";
import { NotificationSearch } from "./components/reminderSearch";
import { NotificationFilterPanel } from "./components/reminderFilterPannel";
import { NotificationTable } from "./components/reminderTable";
import { NotificationViewDialog } from "./components/reminderViewDialogs";

const NotificationLogPage: React.FC = () => {
  const {
    logs,
    pagination,
    stats,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    setPage,
    setPageSize,
    refetch,
  } = useNotificationLogs();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<NotificationLogEntry | null>(null);
  const [sendingRows, setSendingRows] = useState<Set<number>>(new Set());
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    updateFilters({ keyword: query });
  };

  const handleFilterChange = (newFilters: any) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    clearFilters();
  };

  const handleView = (log: NotificationLogEntry) => {
    setSelectedLog(log);
    setIsViewDialogOpen(true);
  };

  const handleRetry = async (id: number) => {
    showSuccess("The email reminder has been queued for retry.");
    setSendingRows((prev) => new Set(prev).add(id));
    try {
      const response = await reminderLogAPI.retryFailed(id);
      if (response.status) {
        refetch();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError("Retry failed", err.message || "Unable to retry email");
    } finally {
      setSendingRows((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const confirmRetry = (id: number) => {
    dialogs
      .confirm({
        title: "Retry Email Reminder",
        message: "Are you sure you want to retry sending this email?",
        confirmText: "Retry",
        cancelText: "Cancel",
        icon: "warning",
      })
      .then((confirmed) => {
        if (confirmed) handleRetry(id);
      });
  };

  const handleResend = async (id: number) => {
    showSuccess("The email reminder has been resent.");
    setSendingRows((prev) => new Set(prev).add(id));
    try {
      const response = await reminderLogAPI.resend(id);
      if (response.status) {
        refetch();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError("Resend failed", err.message || "Unable to resend email");
    } finally {
      setSendingRows((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const confirmResend = (id: number) => {
    dialogs
      .confirm({
        title: "Resend Email Reminder",
        message: "Are you sure you want to resend this email?",
        confirmText: "Resend",
        cancelText: "Cancel",
        icon: "info",
      })
      .then((confirmed) => {
        if (confirmed) handleResend(id);
      });
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await reminderLogAPI.delete(id);
      if (response.status) {
        dialogs.success("Deleted", `Email log #${id} has been deleted.`);
        refetch();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.error("Delete failed", err.message);
    }
  };

  const confirmDelete = (id: number) => {
    dialogs
      .delete()
      .then((confirmed) => {
        if (confirmed) handleDelete(id);
      });
  };

  return (
    <div className="min-h-screen bg-[var(--background-color)]">
      <main className="mx-auto px-2 py-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Mail className="w-6 h-6 text-[var(--primary-color)]" />
              Email Reminder Logs
            </h2>
            <p className="text-[var(--text-secondary)] mt-1">
              {pagination.total} total email records
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                         bg-[var(--card-secondary-bg)] hover:bg-[var(--card-hover-bg)]
                         text-[var(--text-primary)] border border-[var(--border-color)]/20
                         hover:border-[var(--border-color)]/40 transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                         bg-[var(--card-secondary-bg)] hover:bg-[var(--card-hover-bg)]
                         text-[var(--text-primary)] border border-[var(--border-color)]/20
                         hover:border-[var(--border-color)]/40 transition-all duration-200"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        <NotificationStats stats={stats} loading={loading} />

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <NotificationSearch
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by recipient email, subject, or content..."
          />
          {searchQuery && (
            <span className="text-sm text-[var(--text-secondary)]">
              Searching: “{searchQuery}”
            </span>
          )}
        </div>

        <NotificationFilterPanel
          filters={{
            status: filters.status,
            startDate: filters.startDate,
            endDate: filters.endDate,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
          }}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
          isOpen={isFilterOpen}
          onToggle={() => setIsFilterOpen(!isFilterOpen)}
        />

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4 text-red-400">
            {error}
            <button onClick={refetch} className="ml-3 underline">
              Retry
            </button>
          </div>
        )}

        <div className="mt-6">
          <NotificationTable
            logs={logs}
            onView={handleView}
            onRetry={confirmRetry}
            onResend={confirmResend}
            onDelete={confirmDelete}
            isLoading={loading}
            sendingIds={sendingRows}
          />
        </div>

        {!loading && pagination.total > 0 && (
          <Pagination
            currentPage={pagination.page}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 25, 50, 100]}
            showPageSize={true}
          />
        )}
      </main>

      {selectedLog && (
        <NotificationViewDialog
          log={selectedLog}
          isOpen={isViewDialogOpen}
          onClose={() => {
            setIsViewDialogOpen(false);
            setSelectedLog(null);
          }}
        />
      )}
    </div>
  );
};

export default NotificationLogPage;