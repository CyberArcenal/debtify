// src/renderer/pages/loans/applications/components/ApplicationCard.tsx
import React from "react";
import { Eye, CheckCircle, XCircle, Calendar, DollarSign, FileText } from "lucide-react";
import type { LoanApplication } from "../types";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface ApplicationCardProps {
  application: LoanApplication;
  onView: (app: LoanApplication) => void;
  onApprove?: (app: LoanApplication) => void;
  onReject?: (app: LoanApplication) => void;
  showActions?: boolean;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, onView, onApprove, onReject, showActions = true }) => {
  const getStatusBadge = () => {
    switch (application.status) {
      case "pending": return <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: "var(--status-pending-bg)", color: "var(--status-pending-text)" }}>Pending</span>;
      case "approved": return <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: "var(--status-paid-bg)", color: "var(--status-paid-text)" }}>Approved</span>;
      case "rejected": return <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: "var(--status-overdue-bg)", color: "var(--status-overdue-text)" }}>Rejected</span>;
      default: return null;
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>{application.debtorName}</h3>
        {getStatusBadge()}
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2"><DollarSign className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} /> <span className="font-medium" style={{ color: "var(--text-primary)" }}>{formatCurrency(application.requestedAmount)}</span></div>
        <div className="flex items-center gap-2"><FileText className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} /> <span style={{ color: "var(--text-primary)" }}>{application.purpose}</span></div>
        <div className="flex items-center gap-2"><Calendar className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} /> <span style={{ color: "var(--text-primary)" }}>Due: {formatDate(application.proposedDueDate)}</span></div>
        {application.interestRate && <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Interest: {application.interestRate}%</div>}
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={() => onView(application)} className="p-1.5 rounded hover:bg-[var(--card-hover-bg)]" style={{ color: "var(--accent-blue)" }}><Eye className="w-4 h-4" /></button>
        {showActions && application.status === "pending" && (
          <>
            <button onClick={() => onApprove?.(application)} className="p-1.5 rounded hover:bg-[var(--card-hover-bg)]" style={{ color: "var(--success-color)" }}><CheckCircle className="w-4 h-4" /></button>
            <button onClick={() => onReject?.(application)} className="p-1.5 rounded hover:bg-[var(--card-hover-bg)]" style={{ color: "var(--danger-color)" }}><XCircle className="w-4 h-4" /></button>
          </>
        )}
      </div>
    </div>
  );
};

export default ApplicationCard;