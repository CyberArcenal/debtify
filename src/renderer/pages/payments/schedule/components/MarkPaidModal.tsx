// src/renderer/pages/payments/schedule/components/MarkPaidModal.tsx
import React, { useState } from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import { dialogs } from "../../../../utils/dialogs";
import type { ScheduledPayment } from "../types";
import { formatCurrency } from "../../../../utils/formatters";

interface MarkPaidModalProps {
  isOpen: boolean;
  payment: ScheduledPayment | null;
  onClose: () => void;
  onConfirm: (amount: number, paymentDate: string) => Promise<void>;
}

const MarkPaidModal: React.FC<MarkPaidModalProps> = ({
  isOpen,
  payment,
  onClose,
  onConfirm,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
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
      await onConfirm(amount, paymentDate);
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
          <div className="bg-gray-50 p-3 rounded-md">
            <p>
              <strong>Debtor:</strong> {payment.borrowerName}
            </p>
            <p>
              <strong>Debt:</strong> {payment.debtName}
            </p>
            <p>
              <strong>Due Date:</strong> {payment.dueDate}
            </p>
            <p>
              <strong>Amount Due:</strong> {formatCurrency(payment.amountDue)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Payment Amount *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="success" disabled={submitting}>
              {submitting ? "Processing..." : "Record Payment"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default MarkPaidModal;
