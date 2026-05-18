// src/renderer/pages/loans/applications/components/ApprovalConfirmationModal.tsx
import React, { useState } from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import type { LoanApplication } from "../types";

interface ApprovalConfirmationModalProps {
  isOpen: boolean;
  application: LoanApplication | null;
  type: "approve" | "reject";
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}

const ApprovalConfirmationModal: React.FC<ApprovalConfirmationModalProps> = ({ isOpen, application, type, onClose, onConfirm }) => {
  const [rejectionReason, setRejectionReason] = useState("");

  if (!application) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={type === "approve" ? "Approve Application" : "Reject Application"} size="md">
      <div className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-md">
          <p><strong>Debtor:</strong> {application.debtorName}</p>
          <p><strong>Requested Amount:</strong> {application.requestedAmount}</p>
          <p><strong>Purpose:</strong> {application.purpose}</p>
        </div>
        {type === "approve" ? (
          <p className="text-green-600">Approving this application will create an active loan for the debtor. Continue?</p>
        ) : (
          <>
            <p className="text-red-600">Rejecting this application will archive it. The debtor will be notified (if email provided).</p>
            <div><label className="block text-sm font-medium mb-1">Rejection Reason (optional)</label><textarea rows={2} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="Why is this application being rejected?" /></div>
          </>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={type === "approve" ? "success" : "danger"} onClick={() => onConfirm(type === "reject" ? rejectionReason : undefined)}>Confirm {type === "approve" ? "Approve" : "Reject"}</Button>
        </div>
      </div>
    </Modal>
  );
};

export default ApprovalConfirmationModal;