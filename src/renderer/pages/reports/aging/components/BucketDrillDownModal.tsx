// src/renderer/pages/reports/aging/components/BucketDrillDownModal.tsx
import React from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import type { Debt } from "../../../../api/core/debt";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface BucketDrillDownModalProps {
  isOpen: boolean;
  bucketName: string;
  debts: Debt[];
  onClose: () => void;
}

const BucketDrillDownModal: React.FC<BucketDrillDownModalProps> = ({ isOpen, bucketName, debts, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Debts in ${bucketName}`} size="xl">
      <div className="max-h-96 overflow-y-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr><th className="px-3 py-2 text-left text-xs">Debt Name</th><th className="px-3 py-2 text-left text-xs">Borrower</th><th className="px-3 py-2 text-right text-xs">Amount</th><th className="px-3 py-2 text-left text-xs">Due Date</th><th className="px-3 py-2 text-right text-xs">Days Past Due</th></tr>
          </thead>
          <tbody>
            {debts.map(debt => {
              const daysPastDue = Math.max(0, Math.floor((new Date().getTime() - new Date(debt.dueDate).getTime()) / (1000*3600*24)));
              return (
                <tr key={debt.id} className="border-t">
                  <td className="px-3 py-2">{debt.name}</td>
                  <td className="px-3 py-2">{debt.borrower?.name || "—"}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(debt.remainingAmount)}</td>
                  <td className="px-3 py-2">{formatDate(debt.dueDate)}</td>
                  <td className="px-3 py-2 text-right">{daysPastDue}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end"><Button variant="secondary" onClick={onClose}>Close</Button></div>
    </Modal>
  );
};

export default BucketDrillDownModal;