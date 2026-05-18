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
          <div key={p.debtId} className="border rounded p-3 flex justify-between items-center">
            <div><div className="font-medium">{p.borrowerName}</div><div className="text-sm text-gray-500">{p.debtName}</div><div className="font-semibold text-green-600">{formatCurrency(p.amountDue)}</div></div>
            <button onClick={() => onMarkPaid(p)} className="px-3 py-1 rounded bg-green-500 text-white text-sm">Mark Paid</button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end"><Button variant="secondary" onClick={onClose}>Close</Button></div>
    </Modal>
  );
};

export default DateClickModal;