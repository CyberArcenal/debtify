// src/renderer/pages/loans/overdue/components/RecordPartialPaymentModal.tsx
import React, { useState } from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import { dialogs } from "../../../../utils/dialogs";
import type { OverdueLoan } from "../hooks/useOverdueLoans";
import paymentsAPI from "../../../../api/core/payment_transaction";

interface RecordPartialPaymentModalProps {
  isOpen: boolean;
  loan: OverdueLoan | null;
  onClose: () => void;
  onSuccess: () => void;
}

const RecordPartialPaymentModal: React.FC<RecordPartialPaymentModalProps> = ({ isOpen, loan, onClose, onSuccess }) => {
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
    if (amount <= 0) { dialogs.error("Amount must be greater than zero"); return; }
    if (amount > loan.remainingAmount) { dialogs.error(`Amount cannot exceed remaining balance (${loan.remainingAmount})`); return; }
    setSubmitting(true);
    try {
      await paymentsAPI.create({ amount, paymentDate, reference: reference || null, notes: notes || null, debtId: loan.id });
      dialogs.success("Payment recorded successfully");
      onSuccess();
      onClose();
    } catch (err: any) { dialogs.error(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment (Overdue Account)" size="md">
      {loan && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-red-50 p-3 rounded-md border border-red-200"><p><strong>Debt:</strong> {loan.name}</p><p><strong>Borrower:</strong> {loan.borrower?.name}</p><p><strong>Remaining:</strong> {loan.remainingAmount}</p><p className="text-red-600 font-bold">Overdue by {loan.daysOverdue} days</p></div>
          <div><label className="block text-sm font-medium mb-1">Amount *</label><input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-md" /></div>
          <div><label className="block text-sm font-medium mb-1">Payment Date *</label><input type="date" required value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full px-3 py-2 border rounded-md" /></div>
          <div><label className="block text-sm font-medium mb-1">Reference</label><input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className="w-full px-3 py-2 border rounded-md" /></div>
          <div><label className="block text-sm font-medium mb-1">Notes</label><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded-md" /></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" variant="success" disabled={submitting}>{submitting ? "Processing..." : "Record Payment"}</Button></div>
        </form>
      )}
    </Modal>
  );
};

export default RecordPartialPaymentModal;