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
      case "pending": return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Pending</span>;
      case "approved": return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Approved</span>;
      case "rejected": return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Rejected</span>;
      default: return null;
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white" style={{ borderColor: "var(--border-color)" }}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{application.debtorName}</h3>
        {getStatusBadge()}
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-gray-500" /> <span className="font-medium">{formatCurrency(application.requestedAmount)}</span></div>
        <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-gray-500" /> <span>{application.purpose}</span></div>
        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-500" /> <span>Due: {formatDate(application.proposedDueDate)}</span></div>
        {application.interestRate && <div className="text-xs text-gray-500">Interest: {application.interestRate}%</div>}
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={() => onView(application)} className="p-1.5 rounded hover:bg-gray-100 text-blue-500"><Eye className="w-4 h-4" /></button>
        {showActions && application.status === "pending" && (
          <>
            <button onClick={() => onApprove?.(application)} className="p-1.5 rounded hover:bg-green-100 text-green-600"><CheckCircle className="w-4 h-4" /></button>
            <button onClick={() => onReject?.(application)} className="p-1.5 rounded hover:bg-red-100 text-red-600"><XCircle className="w-4 h-4" /></button>
          </>
        )}
      </div>
    </div>
  );
};

export default ApplicationCard;