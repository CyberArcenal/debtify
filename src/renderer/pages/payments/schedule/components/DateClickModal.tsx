// src/renderer/pages/payments/schedule/components/DateClickModal.tsx
import React from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import type { ScheduledPayment } from "../types";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface DateClickModalProps {
  isOpen: boolean;
  date: string;
  payments: ScheduledPayment[];
  onClose: () => void;
  onMarkPaid: (payment: ScheduledPayment) => void;
}

const DateClickModal: React.FC<DateClickModalProps> = ({ isOpen, date, payments, onClose, onMarkPaid }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Payments due on ${formatDate(date)}`} size="lg">
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {payments.map(p => (
          <div key={p.debtId} className="border rounded p-3 flex justify-between items-center" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
            <div>
              <div className="font-medium" style={{ color: "var(--text-primary)" }}>{p.borrowerName}</div>
              <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{p.debtName}</div>
              <div className="font-semibold" style={{ color: "var(--success-color)" }}>{formatCurrency(p.amountDue)}</div>
            </div>
            <button onClick={() => onMarkPaid(p)} className="px-3 py-1 rounded text-white text-sm" style={{ backgroundColor: "var(--success-color)" }}>Mark Paid</button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end"><Button variant="secondary" onClick={onClose}>Close</Button></div>
    </Modal>
  );
};

export default DateClickModal;