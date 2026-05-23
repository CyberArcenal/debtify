// src/renderer/pages/debtors/credit-check/index.tsx
import React from "react";
import { CreditCard } from "lucide-react";
import useCreditCheck from "./hooks/useCreditCheck";
import CreditScoreDisplay from "./components/CreditScoreDisplay";
import CreditReportPreview from "./components/CreditReportPreview";
import PreviousChecksLog from "./components/PreviousChecksLog";
import BorrowerSelect from "../../../components/Selects/Borrower";

const CreditCheckPage: React.FC = () => {
  const {
    selectedDebtor,
    setSelectedDebtor,
    creditScore,
    checkingCredit,
    performCheck,
    report,
    downloadReport,
    previousChecks,
    loadingLogs,
    hasMoreLogs,
    loadMoreLogs,
  } = useCreditCheck();

  return (
    <div className="p-4" style={{ backgroundColor: "var(--background-color)" }}>
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-6 h-6" style={{ color: "var(--primary-color)" }} />
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Credit Check</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column: Selector and History */}
        <div className="space-y-4">
          <div className="rounded-md border p-4" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
            <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>1. Select Debtor</h3>
            <BorrowerSelect
              value={selectedDebtor?.id || null}
              onChange={(id, debtor) => setSelectedDebtor(debtor || null)}
              placeholder="Search by name, email, or contact..."
              activeOnly={true}
            />
          </div>
          <PreviousChecksLog 
            logs={previousChecks} 
            loading={loadingLogs} 
            hasMore={hasMoreLogs}
            onLoadMore={loadMoreLogs}
          />
        </div>

        {/* Right column: Credit Score & Report */}
        <div className="lg:col-span-2 space-y-4">
          <CreditScoreDisplay
            score={creditScore}
            checking={checkingCredit}
            onCheck={() => selectedDebtor && performCheck(selectedDebtor)}
            debtorName={selectedDebtor?.name}
          />
          <CreditReportPreview report={report} onDownload={downloadReport} />
        </div>
      </div>
    </div>
  );
};

export default CreditCheckPage;