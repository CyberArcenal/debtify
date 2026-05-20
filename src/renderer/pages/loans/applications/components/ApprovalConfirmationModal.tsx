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
        <div className="p-3 rounded-md" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
          <p><strong style={{ color: "var(--text-primary)" }}>Debtor:</strong> <span style={{ color: "var(--text-primary)" }}>{application.debtorName}</span></p>
          <p><strong style={{ color: "var(--text-primary)" }}>Requested Amount:</strong> <span style={{ color: "var(--text-primary)" }}>{application.requestedAmount}</span></p>
          <p><strong style={{ color: "var(--text-primary)" }}>Purpose:</strong> <span style={{ color: "var(--text-primary)" }}>{application.purpose}</span></p>
        </div>
        {type === "approve" ? (
          <p style={{ color: "var(--success-color)" }}>Approving this application will create an active loan for the debtor. Continue?</p>
        ) : (
          <>
            <p style={{ color: "var(--danger-color)" }}>Rejecting this application will archive it. The debtor will be notified (if email provided).</p>
            <div><label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Rejection Reason (optional)</label><textarea rows={2} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="w-full px-3 py-2 border rounded-md" style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} placeholder="Why is this application being rejected?" /></div>
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