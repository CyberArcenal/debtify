// src/renderer/pages/debtors/credit-check/components/CreditReportPreview.tsx
import React from "react";
import { FileText, Download } from "lucide-react";
import type { CreditReport } from "../types";

interface CreditReportPreviewProps {
  report: CreditReport | null;
  onDownload: () => void;
}

const CreditReportPreview: React.FC<CreditReportPreviewProps> = ({ report, onDownload }) => {
  if (!report) {
    return (
      <div className="rounded-md border p-4" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
        <h3 className="font-semibold mb-3" style={{ color: "var(--sidebar-text)" }}>3. Credit Report</h3>
        <div className="text-center py-6 text-[var(--text-tertiary)]">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Run a credit check to generate report.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border p-4" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold" style={{ color: "var(--sidebar-text)" }}>3. Credit Report</h3>
        <button
          onClick={onDownload}
          className="px-3 py-1 rounded-md bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white text-sm flex items-center gap-1"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between border-b pb-1" style={{ borderColor: "var(--border-color)" }}>
          <span className="text-[var(--text-secondary)]">Debtor:</span>
          <span className="font-medium">{report.debtorName}</span>
        </div>
        <div className="flex justify-between border-b pb-1" style={{ borderColor: "var(--border-color)" }}>
          <span className="text-[var(--text-secondary)]">Credit Score:</span>
          <span className={`font-bold ${report.score.score >= 700 ? "text-green-500" : report.score.score >= 500 ? "text-yellow-500" : "text-red-500"}`}>
            {report.score.score}
          </span>
        </div>
        <div className="flex justify-between border-b pb-1" style={{ borderColor: "var(--border-color)" }}>
          <span className="text-[var(--text-secondary)]">Risk Level:</span>
          <span>{report.score.riskLevel}</span>
        </div>
        <div className="flex justify-between border-b pb-1" style={{ borderColor: "var(--border-color)" }}>
          <span className="text-[var(--text-secondary)]">Remarks:</span>
          <span>{report.score.remarks}</span>
        </div>
        <div className="flex justify-between border-b pb-1" style={{ borderColor: "var(--border-color)" }}>
          <span className="text-[var(--text-secondary)]">Payment History:</span>
          <span>{report.paymentHistory || "N/A"}</span>
        </div>
        <div className="flex justify-between border-b pb-1" style={{ borderColor: "var(--border-color)" }}>
          <span className="text-[var(--text-secondary)]">Outstanding Debts:</span>
          <span>₱{report.outstandingDebts?.toLocaleString() || "0"}</span>
        </div>
        <div className="flex justify-between border-b pb-1" style={{ borderColor: "var(--border-color)" }}>
          <span className="text-[var(--text-secondary)]">Overdue Debts:</span>
          <span>{report.overdueDebts || 0}</span>
        </div>
        <div className="mt-2 p-2 rounded bg-[var(--card-bg)]">
          <p className="text-xs text-[var(--text-tertiary)]">Recommendations</p>
          <p className="text-sm">{report.recommendations}</p>
        </div>
      </div>
    </div>
  );
};

export default CreditReportPreview;