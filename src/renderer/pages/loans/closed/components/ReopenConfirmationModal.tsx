// src/renderer/pages/loans/closed/components/ReopenConfirmationModal.tsx
import React from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import { dialogs } from "../../../../utils/dialogs";
import debtsAPI from "../../../../api/core/debt";
import type { ClosedLoan } from "../hooks/useClosedLoans";

interface ReopenConfirmationModalProps {
  isOpen: boolean;
  loan: ClosedLoan | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ReopenConfirmationModal: React.FC<ReopenConfirmationModalProps> = ({ isOpen, loan, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = React.useState(false);

  const handleReopen = async () => {
    if (!loan) return;
    setSubmitting(true);
    try {
      await debtsAPI.update(loan.id, { status: "active" });
      dialogs.success(`Loan "${loan.name}" has been reopened.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reopen Closed Loan" size="md">
      {loan && (
        <div className="space-y-4">
          <div className="p-3 rounded-md border" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
            <p><strong>Debt:</strong> {loan.name}</p>
            <p><strong>Borrower:</strong> {loan.borrower?.name}</p>
            <p><strong>Closed Date:</strong> {new Date(loan.closedAt).toLocaleDateString()}</p>
            <p className="font-bold mt-2" style={{ color: "var(--warning-color)" }}>Are you sure you want to reopen this loan? It will become active again.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="warning" onClick={handleReopen} disabled={submitting}>{submitting ? "Processing..." : "Yes, Reopen"}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ReopenConfirmationModal;