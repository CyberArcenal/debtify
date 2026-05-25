// src/renderer/pages/loans/active/components/PaymentScheduleModal.tsx
import React, { useEffect, useState } from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import type { Debt } from "../../../../api/core/debt";
import { formatCurrency, formatDate } from "../../../../utils/formatters";
import type { PaymentTransaction } from "../../../../api/core/payment_transaction";
import type { PenaltyTransaction } from "../../../../api/core/pernalty_transaction";
import paymentsAPI from "../../../../api/core/payment_transaction";
import penaltiesAPI from "../../../../api/core/pernalty_transaction";

interface PaymentScheduleModalProps {
  isOpen: boolean;
  debt: Debt | null;
  onClose: () => void;
}

const PaymentScheduleModal: React.FC<PaymentScheduleModalProps> = ({ isOpen, debt, onClose }) => {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [penalties, setPenalties] = useState<PenaltyTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"payments" | "penalties">("payments");

  useEffect(() => {
    if (isOpen && debt) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [paymentsRes, penaltiesRes] = await Promise.all([
            paymentsAPI.getByDebtId(debt.id),
            penaltiesAPI.getByDebtId(debt.id),
          ]);
          setPayments(paymentsRes);
          setPenalties(penaltiesRes);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, debt]);

  if (!debt) return null;

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPenalty = penalties.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Payment Schedule - ${debt.name}`} size="lg">
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 p-3 rounded-md bg-[var(--card-secondary-bg)]">
          <div><span className="text-sm text-[var(--text-secondary)]">Total Paid:</span> <div className="font-semibold text-green-600">{formatCurrency(totalPaid)}</div></div>
          <div><span className="text-sm text-[var(--text-secondary)]">Total Penalties:</span> <div className="font-semibold text-red-500">{formatCurrency(totalPenalty)}</div></div>
          <div><span className="text-sm text-[var(--text-secondary)]">Remaining Balance:</span> <div className="font-semibold text-[var(--debt-high)]">{formatCurrency(debt.remainingAmount)}</div></div>
          <div><span className="text-sm text-[var(--text-secondary)]">Due Date:</span> <div>{formatDate(debt.dueDate)}</div></div>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: "var(--border-color)" }}>
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "payments"
                ? "text-[var(--primary-color)] border-b-2 border-[var(--primary-color)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Payments ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab("penalties")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "penalties"
                ? "text-[var(--primary-color)] border-b-2 border-[var(--primary-color)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Penalties ({penalties.length})
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4 text-[var(--text-tertiary)]">Loading...</div>
          ) : activeTab === "payments" ? (
            payments.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-tertiary)]">No payments recorded.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--card-secondary-bg)] sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-left">Reference</th>
                    <th className="px-3 py-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} className="border-b border-[var(--border-color)]">
                      <td className="px-3 py-2">{formatDate(p.paymentDate)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(p.amount)}</td>
                      <td className="px-3 py-2">{p.reference || "—"}</td>
                      <td className="px-3 py-2">{p.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            penalties.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-tertiary)]">No penalties recorded.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--card-secondary-bg)] sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-left">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {penalties.map(p => (
                    <tr key={p.id} className="border-b border-[var(--border-color)]">
                      <td className="px-3 py-2">{formatDate(p.penaltyDate)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(p.amount)}</td>
                      <td className="px-3 py-2">{p.reason || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentScheduleModal;