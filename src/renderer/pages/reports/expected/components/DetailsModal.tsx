// src/renderer/pages/reports/expected/components/DetailsModal.tsx
import React from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import { formatCurrency } from "../../../../utils/formatters";

interface DetailsModalProps {
  isOpen: boolean;
  title: string;
  details: Array<{ debtName: string; debtorName: string; amount: number }>;
  onClose: () => void;
}

const DetailsModal: React.FC<DetailsModalProps> = ({ isOpen, title, details, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Expected Payments - ${title}`} size="lg">
      <div className="max-h-96 overflow-y-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Debt</th><th className="px-3 py-2 text-left">Debtor</th><th className="px-3 py-2 text-right">Amount</th></tr></thead>
          <tbody>
            {details.map((d, idx) => (
              <tr key={idx} className="border-t"><td className="px-3 py-2">{d.debtName}</td><td className="px-3 py-2">{d.debtorName}</td><td className="px-3 py-2 text-right">{formatCurrency(d.amount)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end"><Button variant="secondary" onClick={onClose}>Close</Button></div>
    </Modal>
  );
};

export default DetailsModal;