// src/renderer/pages/loans/active/components/ViewDebtModal.tsx
import React, { useEffect, useState } from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import type { Debt } from "../../../../api/core/debt";
import { formatCurrency, formatDate } from "../../../../utils/formatters";
import type { PaymentTransaction } from "../../../../api/core/payment_transaction";
import type { PenaltyTransaction } from "../../../../api/core/pernalty_transaction";
import paymentsAPI from "../../../../api/core/payment_transaction";
import penaltiesAPI from "../../../../api/core/pernalty_transaction";

interface ViewDebtModalProps {
  isOpen: boolean;
  debt: Debt | null;
  onClose: () => void;
}

const ViewDebtModal: React.FC<ViewDebtModalProps> = ({ isOpen, debt, onClose }) => {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [penalties, setPenalties] = useState<PenaltyTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && debt) {
      const fetchHistory = async () => {
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
      fetchHistory();
    }
  }, [isOpen, debt]);

  if (!debt) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Debt Details" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 p-3 rounded-md bg-[var(--card-secondary-bg)]">
          <div><span className="text-sm text-[var(--text-secondary)]">Debt Name:</span> <div className="font-medium">{debt.name}</div></div>
          <div><span className="text-sm text-[var(--text-secondary)]">Borrower:</span> <div className="font-medium">{debt.borrower?.name || "—"}</div></div>
          <div><span className="text-sm text-[var(--text-secondary)]">Total Amount:</span> <div>{formatCurrency(debt.totalAmount)}</div></div>
          <div><span className="text-sm text-[var(--text-secondary)]">Paid Amount:</span> <div>{formatCurrency(debt.paidAmount)}</div></div>
          <div><span className="text-sm text-[var(--text-secondary)]">Remaining Balance:</span> <div className="font-bold text-[var(--debt-high)]">{formatCurrency(debt.remainingAmount)}</div></div>
          <div><span className="text-sm text-[var(--text-secondary)]">Due Date:</span> <div>{formatDate(debt.dueDate)}</div></div>
          {debt.interestRate && <div><span className="text-sm text-[var(--text-secondary)]">Interest Rate:</span> <div>{debt.interestRate}%</div></div>}
          {debt.penaltyRate && <div><span className="text-sm text-[var(--text-secondary)]">Penalty Rate:</span> <div>{debt.penaltyRate}%</div></div>}
        </div>

        <div>
          <h4 className="font-semibold mb-2">Payment History</h4>
          {loading ? <div className="text-center py-2">Loading...</div> : payments.length === 0 ? <div className="text-center text-[var(--text-tertiary)] py-2">No payments recorded.</div> : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--card-secondary-bg)]">
                  <tr><th className="px-3 py-1 text-left">Date</th><th className="px-3 py-1 text-right">Amount</th><th className="px-3 py-1 text-left">Reference</th></tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} className="border-b border-[var(--border-color)]">
                      <td className="px-3 py-1">{formatDate(p.paymentDate)}</td>
                      <td className="px-3 py-1 text-right">{formatCurrency(p.amount)}</td>
                      <td className="px-3 py-1">{p.reference || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h4 className="font-semibold mb-2">Penalty History</h4>
          {loading ? <div className="text-center py-2">Loading...</div> : penalties.length === 0 ? <div className="text-center text-[var(--text-tertiary)] py-2">No penalties recorded.</div> : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--card-secondary-bg)]">
                  <tr><th className="px-3 py-1 text-left">Date</th><th className="px-3 py-1 text-right">Amount</th><th className="px-3 py-1 text-left">Reason</th></tr>
                </thead>
                <tbody>
                  {penalties.map(p => (
                    <tr key={p.id} className="border-b border-[var(--border-color)]">
                      <td className="px-3 py-1">{formatDate(p.penaltyDate)}</td>
                      <td className="px-3 py-1 text-right">{formatCurrency(p.amount)}</td>
                      <td className="px-3 py-1">{p.reason || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewDebtModal;