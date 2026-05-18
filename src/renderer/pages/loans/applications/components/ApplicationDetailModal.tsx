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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Loan Application Details" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-md">
          <div><span className="text-sm text-gray-500">Debtor:</span><div className="font-medium">{application.debtorName}</div></div>
          <div><span className="text-sm text-gray-500">Status:</span><div className={`font-semibold ${application.status === "pending" ? "text-yellow-600" : application.status === "approved" ? "text-green-600" : "text-red-600"}`}>{application.status.toUpperCase()}</div></div>
          <div><span className="text-sm text-gray-500">Requested Amount:</span><div>{formatCurrency(application.requestedAmount)}</div></div>
          <div><span className="text-sm text-gray-500">Purpose:</span><div>{application.purpose}</div></div>
          <div><span className="text-sm text-gray-500">Proposed Due Date:</span><div>{formatDate(application.proposedDueDate)}</div></div>
          <div><span className="text-sm text-gray-500">Interest Rate:</span><div>{application.interestRate ? `${application.interestRate}%` : "—"}</div></div>
          <div><span className="text-sm text-gray-500">Applied On:</span><div>{formatDate(application.createdAt)}</div></div>
          {application.approvedAt && <div><span className="text-sm text-gray-500">Approved On:</span><div>{formatDate(application.approvedAt)}</div></div>}
          {application.rejectedAt && <div><span className="text-sm text-gray-500">Rejected On:</span><div>{formatDate(application.rejectedAt)}</div></div>}
          {application.rejectionReason && <div className="col-span-2"><span className="text-sm text-gray-500">Rejection Reason:</span><div>{application.rejectionReason}</div></div>}
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