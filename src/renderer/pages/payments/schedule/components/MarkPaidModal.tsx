// src/renderer/pages/payments/schedule/components/MarkPaidModal.tsx
import React, { useState, useEffect } from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import { dialogs } from "../../../../utils/dialogs";
import type { ScheduledPayment } from "../types";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface MarkPaidModalProps {
  isOpen: boolean;
  payment: ScheduledPayment | null;
  onClose: () => void;
  onConfirm: (amount: number, paymentDate: string) => Promise<void>;
}

const MarkPaidModal: React.FC<MarkPaidModalProps> = ({ isOpen, payment, onClose, onConfirm }) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (payment) setAmount(payment.amountDue);
  }, [payment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment) return;
    if (amount <= 0) {
      dialogs.error("Amount must be greater than zero");
      return;
    }
    if (amount > payment.amountDue) {
      dialogs.error(`Amount cannot exceed due amount (${payment.amountDue})`);
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(Number(payment.amountDue.toFixed(2)), paymentDate);
      dialogs.success("Payment recorded successfully");
      onClose();
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment" size="md">
      {payment && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 rounded-md" style={{ backgroundColor: "var(--card-secondary-bg)", border: `1px solid var(--border-color)` }}>
            <p><strong style={{ color: "var(--text-primary)" }}>Debtor:</strong> <span style={{ color: "var(--text-primary)" }}>{payment.borrowerName}</span></p>
            <p><strong style={{ color: "var(--text-primary)" }}>Debt:</strong> <span style={{ color: "var(--text-primary)" }}>{payment.debtName}</span></p>
            <p><strong style={{ color: "var(--text-primary)" }}>Due Date:</strong> <span style={{ color: "var(--text-primary)" }}>{formatDate(payment.dueDate)}</span></p>
            <p><strong style={{ color: "var(--text-primary)" }}>Amount Due:</strong> <span style={{ color: "var(--success-color)" }}>{formatCurrency(payment.amountDue)}</span></p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Payment Amount *</label>
            <input type="number" step="0.01" required value={amount.toFixed(2)} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-md" style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Payment Date *</label>
            <input type="date" required value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full px-3 py-2 border rounded-md" style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="success" disabled={submitting}>{submitting ? "Processing..." : "Record Payment"}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default MarkPaidModal;