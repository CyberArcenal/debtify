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

  if (error) return <div className="p-4 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <div className="rounded-md shadow-md border p-4 bg-white">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2"><Calendar className="w-6 h-6 text-[var(--primary-color)]" /><h1 className="text-xl font-bold">Expected Payments</h1></div>
          {expectedData && <ExportButton report={expectedData} />}
        </div>

        <FilterBar
          fromDate={fromDate} toDate={toDate} groupBy={groupBy} selectedGroupId={selectedGroupId}
          onFromDateChange={setFromDate} onToDateChange={setToDate} onGroupByChange={setGroupBy} onGroupIdChange={setSelectedGroupId}
          onRefresh={refresh} loading={loading}
        />

        {loading && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)]"></div></div>}

        {!loading && !expectedData && <div className="text-center py-12 border rounded-md bg-gray-50"><Calendar className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-gray-500">No expected payments in the selected period.</p></div>}

        {expectedData && (
          <>
            <div className="mb-6"><ExpectedChart report={expectedData} /></div>
            <ExpectedTable report={expectedData} onRowClick={(details, period) => handleRowClick(details, period)} />
          </>
        )}
      </div>

      <DetailsModal isOpen={modalOpen} title={modalTitle} details={modalDetails} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default ExpectedPaymentsPage;