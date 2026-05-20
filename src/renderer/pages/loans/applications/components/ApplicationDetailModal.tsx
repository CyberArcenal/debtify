// src/renderer/pages/loans/applications/components/ApplicationDetailModal.tsx
import React from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import type { LoanApplication } from "../types";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface ApplicationDetailModalProps {
  isOpen: boolean;
  application: LoanApplication | null;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({ isOpen, application, onClose, onApprove, onReject }) => {
  if (!application) return null;

  const getStatusColor = () => {
    switch (application.status) {
      case "pending": return "var(--status-pending-text)";
      case "approved": return "var(--status-paid-text)";
      case "rejected": return "var(--status-overdue-text)";
      default: return "var(--text-primary)";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Loan Application Details" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 p-3 rounded-md" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
          <div><span className="text-sm" style={{ color: "var(--text-secondary)" }}>Debtor:</span><div className="font-medium" style={{ color: "var(--text-primary)" }}>{application.debtorName}</div></div>
          <div><span className="text-sm" style={{ color: "var(--text-secondary)" }}>Status:</span><div className="font-semibold" style={{ color: getStatusColor() }}>{application.status.toUpperCase()}</div></div>
          <div><span className="text-sm" style={{ color: "var(--text-secondary)" }}>Requested Amount:</span><div style={{ color: "var(--text-primary)" }}>{formatCurrency(application.requestedAmount)}</div></div>
          <div><span className="text-sm" style={{ color: "var(--text-secondary)" }}>Purpose:</span><div style={{ color: "var(--text-primary)" }}>{application.purpose}</div></div>
          <div><span className="text-sm" style={{ color: "var(--text-secondary)" }}>Proposed Due Date:</span><div style={{ color: "var(--text-primary)" }}>{formatDate(application.proposedDueDate)}</div></div>
          <div><span className="text-sm" style={{ color: "var(--text-secondary)" }}>Interest Rate:</span><div style={{ color: "var(--text-primary)" }}>{application.interestRate ? `${application.interestRate}%` : "—"}</div></div>
          <div><span className="text-sm" style={{ color: "var(--text-secondary)" }}>Applied On:</span><div style={{ color: "var(--text-primary)" }}>{formatDate(application.createdAt)}</div></div>
          {application.approvedAt && <div><span className="text-sm" style={{ color: "var(--text-secondary)" }}>Approved On:</span><div style={{ color: "var(--text-primary)" }}>{formatDate(application.approvedAt)}</div></div>}
          {application.rejectedAt && <div><span className="text-sm" style={{ color: "var(--text-secondary)" }}>Rejected On:</span><div style={{ color: "var(--text-primary)" }}>{formatDate(application.rejectedAt)}</div></div>}
          {application.rejectionReason && <div className="col-span-2"><span className="text-sm" style={{ color: "var(--text-secondary)" }}>Rejection Reason:</span><div style={{ color: "var(--text-primary)" }}>{application.rejectionReason}</div></div>}
        </div>
        {application.status === "pending" && (
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="danger" onClick={onReject}>Reject</Button>
            <Button variant="success" onClick={onApprove}>Approve</Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ApplicationDetailModal;