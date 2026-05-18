// src/renderer/pages/loans/overdue/components/ApplyPenaltyModal.tsx
import React, { useState } from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import { dialogs } from "../../../../utils/dialogs";
import type { OverdueLoan } from "../hooks/useOverdueLoans";
import penaltiesAPI from "../../../../api/core/pernalty_transaction";

interface ApplyPenaltyModalProps {
  isOpen: boolean;
  loan: OverdueLoan | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ApplyPenaltyModal: React.FC<ApplyPenaltyModalProps> = ({ isOpen, loan, onClose, onSuccess }) => {
  const [amount, setAmount] = useState<number>(0);
  const [penaltyDate, setPenaltyDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (loan) {
      // Suggest penalty based on overdue days or penalty rate
      const suggested = loan.penaltyRate ? (loan.remainingAmount * (loan.penaltyRate / 100)) : 500;
      setAmount(Math.min(suggested, loan.remainingAmount));
    }
  }, [loan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;
    if (amount <= 0) { dialogs.error("Penalty amount must be greater than zero"); return; }
    setSubmitting(true);
    try {
      await penaltiesAPI.create({ amount, penaltyDate, reason: reason || null, debtId: loan.id });
      dialogs.success("Penalty applied successfully");
      onSuccess();
      onClose();
    } catch (err: any) { dialogs.error(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply Penalty" size="md">
      {loan && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-orange-50 p-3 rounded-md"><p><strong>Debt:</strong> {loan.name}</p><p><strong>Overdue:</strong> {loan.daysOverdue} days</p><p><strong>Remaining:</strong> {loan.remainingAmount}</p></div>
          <div><label className="block text-sm font-medium mb-1">Penalty Amount *</label><input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-md" /></div>
          <div><label className="block text-sm font-medium mb-1">Penalty Date *</label><input type="date" required value={penaltyDate} onChange={(e) => setPenaltyDate(e.target.value)} className="w-full px-3 py-2 border rounded-md" /></div>
          <div><label className="block text-sm font-medium mb-1">Reason</label><textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Late payment fee" className="w-full px-3 py-2 border rounded-md" /></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" variant="warning" disabled={submitting}>{submitting ? "Applying..." : "Apply Penalty"}</Button></div>
        </form>
      )}
    </Modal>
  );
};

export default ApplyPenaltyModal;