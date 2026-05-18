// src/renderer/pages/debtors/credit-check/index.tsx
import React from "react";
import { CreditCard } from "lucide-react";
import useCreditCheck from "./hooks/useCreditCheck";
import DebtorSearch from "./components/DebtorSearch";
import CreditScoreDisplay from "./components/CreditScoreDisplay";
import CreditReportPreview from "./components/CreditReportPreview";
import PreviousChecksLog from "./components/PreviousChecksLog";

const CreditCheckPage: React.FC = () => {
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    searching,
    selectedDebtor,
    setSelectedDebtor,
    creditScore,
    checkingCredit,
    performCheck,
    report,
    downloadReport,
    previousChecks,
    loadingLogs,
    searchDebtors,
  } = useCreditCheck();

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-6 h-6 text-[var(--primary-color)]" />
        <h1 className="text-xl font-bold" style={{ color: "var(--sidebar-text)" }}>Credit Check</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column: Search and History */}
        <div className="space-y-4">
          <DebtorSearch
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            searchResults={searchResults}
            searching={searching}
            onSelectDebtor={(debtor) => {
              setSelectedDebtor(debtor);
              // Optionally auto-check? Not, user must click Run.
            }}
            selectedDebtor={selectedDebtor}
            onSearch={searchDebtors}
          />
          <PreviousChecksLog logs={previousChecks} loading={loadingLogs} />
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