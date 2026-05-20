// src/renderer/pages/reports/debtor-stmt/index.tsx
import React, { useRef } from "react";
import { FileText, Printer, Download, RefreshCw } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import useDebtorStatement from "./hooks/useDebtorStatement";
import DebtorSearch from "./components/DebtorSearch";
import StatementPrintable from "./components/StatementPrintable";
import { useSettings } from "../../../contexts/SettingsContext";

const DebtorStatementPage: React.FC = () => {
  const { searchTerm, setSearchTerm, searchResults, searching, selectedDebtor, statement, loading, error, selectDebtor, clearSelection } = useDebtorStatement();
  const { getSetting } = useSettings();
  const companyName = getSetting("general", "company_name", "Debt Management System");
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Statement_${selectedDebtor?.name || "Debtor"}_${new Date().toISOString().slice(0,10)}`,
  });

  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <div className="rounded-md shadow-md border p-4 bg-white">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2"><FileText className="w-6 h-6 text-blue-600" /><h1 className="text-xl font-bold">Debtor Statement</h1></div>
          {selectedDebtor && (
            <div className="flex gap-2">
              <button onClick={handlePrint} className="px-3 py-2 bg-blue-600 text-white rounded flex items-center gap-1"><Printer className="w-4 h-4" /> Print / PDF</button>
              <button onClick={clearSelection} className="px-3 py-2 border rounded flex items-center gap-1"><RefreshCw className="w-4 h-4" /> New Statement</button>
            </div>
          )}
        </div>

        <DebtorSearch
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          searchResults={searchResults}
          searching={searching}
          onSelectDebtor={selectDebtor}
          selectedDebtor={selectedDebtor}
        />

        {loading && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}

        {statement && (
          <div>
            {/* Invisible print area */}
            <div style={{ display: "none" }}><div ref={printRef}><StatementPrintable statement={statement} companyName={companyName} /></div></div>
            {/* Preview area (visible, same styles but not printable) */}
            <div className="border rounded-md p-4 bg-gray-50 max-h-[600px] overflow-y-auto">
              <StatementPrintable statement={statement} companyName={companyName} />
            </div>
          </div>
        )}

        {!loading && !statement && selectedDebtor && <div className="text-center py-8 text-gray-500">No data found for this debtor.</div>}
      </div>
    </div>
  );
};

export default DebtorStatementPage;