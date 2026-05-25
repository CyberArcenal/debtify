// src/renderer/pages/reports/debtor-stmt/index.tsx
import React, { useRef } from "react";
import { FileText, Printer, RefreshCw, User } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import useDebtorStatement from "./hooks/useDebtorStatement";
import StatementPrintable from "./components/StatementPrintable";
import { useSettings } from "../../../contexts/SettingsContext";
import BorrowerSelect from "../../../components/Selects/Borrower";

const DebtorStatementPage: React.FC = () => {
  const { selectedDebtor, statement, loading, error, selectDebtor, clearSelection } = useDebtorStatement();
  const { getSetting } = useSettings();
  const companyName = getSetting("general", "company_name", "Debt Management System");
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Statement_${selectedDebtor?.name || "Debtor"}_${new Date().toISOString().slice(0, 10)}`,
  });

  if (error) return <div className="m-1" style={{ color: "var(--danger-color)" }}>Error: {error}</div>;

  return (
    <div className="m-1" style={{ backgroundColor: "var(--background-color)" }}>
      <div className="rounded-md shadow-md border p-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6" style={{ color: "var(--primary-color)" }} />
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Debtor Statement</h1>
          </div>
          {selectedDebtor && (
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="px-3 py-2 rounded flex items-center gap-1"
                style={{ backgroundColor: "var(--primary-color)", color: "white" }}
              >
                <Printer className="w-4 h-4" /> Print / PDF
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-2 border rounded flex items-center gap-1"
                style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
              >
                <RefreshCw className="w-4 h-4" /> New Statement
              </button>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Select Debtor</label>
          <BorrowerSelect
            value={selectedDebtor?.id || null}
            onChange={(id, debtor) => {
              if (debtor) selectDebtor(debtor);
            }}
            placeholder="Search debtor by name, email, or contact..."
            activeOnly={true}
          />
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--primary-color)" }}></div>
          </div>
        )}

        {!loading && !selectedDebtor && (
          <div className="text-center py-12 border rounded-md" style={{ borderColor: "var(--border-color)" }}>
            <User className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
            <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>No debtor selected</p>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Search and select a debtor to generate their statement.</p>
          </div>
        )}

        {statement && (
          <>
            {/* Hidden print area */}
            <div style={{ display: "none" }}>
              <div ref={printRef}>
                <StatementPrintable statement={statement} companyName={companyName} />
              </div>
            </div>
            {/* Visible preview */}
            <div
              className="border rounded-md mt-4 max-h-[70vh] overflow-y-auto"
              style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}
            >
              <StatementPrintable statement={statement} companyName={companyName} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DebtorStatementPage;