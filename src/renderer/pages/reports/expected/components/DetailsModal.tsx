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
          <thead className="sticky top-0" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
            <tr>
              <th className="px-3 py-2 text-left text-sm" style={{ color: "var(--text-secondary)" }}>Debt</th>
              <th className="px-3 py-2 text-left text-sm" style={{ color: "var(--text-secondary)" }}>Debtor</th>
              <th className="px-3 py-2 text-right text-sm" style={{ color: "var(--text-secondary)" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {details.map((d, idx) => (
              <tr key={idx} className="border-t" style={{ borderColor: "var(--border-color)" }}>
                <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>{d.debtName}</td>
                <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>{d.debtorName}</td>
                <td className="px-3 py-2 text-right" style={{ color: "var(--debt-high)" }}>{formatCurrency(d.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end"><Button variant="secondary" onClick={onClose}>Close</Button></div>
    </Modal>
  );
};

export default DetailsModal;