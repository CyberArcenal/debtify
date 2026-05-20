// src/renderer/pages/reports/expected/index.tsx
import React, { useState } from "react";
import { Calendar } from "lucide-react";
import useExpectedPayments from "./hooks/useExpectedPayments";
import FilterBar from "./components/FilterBar";
import ExpectedChart from "./components/ExpectedChart";
import ExpectedTable from "./components/ExpectedTable";
import ExportButton from "./components/ExportButton";
import DetailsModal from "./components/DetailsModal";
import type { ExpectedPayment } from "./types";

const ExpectedPaymentsPage: React.FC = () => {
  const {
    loading,
    error,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    groupBy,
    setGroupBy,
    selectedGroupId,
    setSelectedGroupId,
    expectedData,
    refresh,
  } = useExpectedPayments();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDetails, setModalDetails] = useState<ExpectedPayment["details"]>([]);

  const handleRowClick = (details: ExpectedPayment["details"], period: string) => {
    setModalTitle(period);
    setModalDetails(details);
    setModalOpen(true);
  };

  if (error) return <div className="p-4 text-center" style={{ color: "var(--danger-color)" }}>Error: {error}</div>;

  return (
    <div className="p-4" style={{ backgroundColor: "var(--background-color)" }}>
      <div className="rounded-md shadow-md border p-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6" style={{ color: "var(--primary-color)" }} />
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Expected Payments</h1>
          </div>
          {expectedData && <ExportButton report={expectedData} />}
        </div>

        <FilterBar
          fromDate={fromDate}
          toDate={toDate}
          groupBy={groupBy}
          selectedGroupId={selectedGroupId}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          onGroupByChange={setGroupBy}
          onGroupIdChange={setSelectedGroupId}
          onRefresh={refresh}
          loading={loading}
        />

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--primary-color)" }}></div>
          </div>
        )}

        {!loading && !expectedData && (
          <div className="text-center py-12 border rounded-md" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
            <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
            <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>No expected payments in the selected period.</p>
          </div>
        )}

        {expectedData && (
          <>
            <div className="mb-6">
              <ExpectedChart report={expectedData} />
            </div>
            <ExpectedTable report={expectedData} onRowClick={handleRowClick} />
          </>
        )}
      </div>

      <DetailsModal isOpen={modalOpen} title={modalTitle} details={modalDetails} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default ExpectedPaymentsPage;