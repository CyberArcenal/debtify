// src/renderer/pages/loans/active/components/RecordPaymentModal.tsx
import React, { useState } from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import { dialogs } from "../../../../utils/dialogs";
import type { Debt } from "../../../../api/core/debt";
import paymentsAPI from "../../../../api/core/payment_transaction";

interface RecordPaymentModalProps {
  isOpen: boolean;
  loan: Debt | null;
  onClose: () => void;
  onSuccess: () => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, loan, onClose, onSuccess }) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (loan) setAmount(loan.remainingAmount);
  }, [loan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;
    if (amount <= 0) {
      dialogs.error("Amount must be greater than zero");
      return;
    }
    if (amount > loan.remainingAmount) {
      dialogs.error(`Amount cannot exceed remaining balance (${loan.remainingAmount})`);
      return;
    }
    setSubmitting(true);
    try {
      await paymentsAPI.create({
        amount,
        paymentDate,
        reference: reference || null,
        notes: notes || null,
        debtId: loan.id,
      });
      dialogs.success("Payment recorded successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment" size="md">
      {loan && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-[var(--card-secondary-bg)] p-3 rounded-md">
            <p><strong>Debt:</strong> {loan.name}</p>
            <p><strong>Borrower:</strong> {loan.borrower?.name}</p>
            <p><strong>Remaining Balance:</strong> <span className="font-bold text-[var(--debt-high)]">{loan.remainingAmount}</span></p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Amount *</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md"
              style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Date *</label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reference (optional)</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)" }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="success" disabled={submitting}>{submitting ? "Processing..." : "Record Payment"}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default RecordPaymentModal;