// src/renderer/pages/loans/active/components/ViewDebtModal.tsx
import React, { useEffect, useState, useRef } from "react";
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

type TabType = "details" | "payments" | "penalties";

const ViewDebtModal: React.FC<ViewDebtModalProps> = ({ isOpen, debt, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [penalties, setPenalties] = useState<PenaltyTransaction[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingPenalties, setLoadingPenalties] = useState(false);
  
  // Track if data has been fetched for this debt to prevent duplicate fetches
  const dataFetchedRef = useRef(false);

  // Reset and fetch all data when modal opens or debt changes
  useEffect(() => {
    if (isOpen && debt) {
      // Reset fetch flag for new debt
      dataFetchedRef.current = false;
      // Clear old data
      setPayments([]);
      setPenalties([]);
      // Fetch all data in parallel
      setLoadingPayments(true);
      setLoadingPenalties(true);
      
      Promise.all([
        paymentsAPI.getByDebtId(debt.id).catch(err => {
          console.error("Failed to fetch payments", err);
          return [];
        }),
        penaltiesAPI.getByDebtId(debt.id).catch(err => {
          console.error("Failed to fetch penalties", err);
          return [];
        })
      ]).then(([paymentsData, penaltiesData]) => {
        setPayments(paymentsData);
        setPenalties(penaltiesData);
        dataFetchedRef.current = true;
      }).finally(() => {
        setLoadingPayments(false);
        setLoadingPenalties(false);
      });
    } else if (!isOpen) {
      // Reset when modal closes
      setActiveTab("details");
      setPayments([]);
      setPenalties([]);
      dataFetchedRef.current = false;
    }
  }, [isOpen, debt?.id]); // Re-run when debt changes

  if (!debt) return null;

  const totalPenalty = debt.stats?.totalPenalty ?? 0;
  const daysOverdue = debt.stats?.daysOverdue ?? 0;
  const totalPaid = debt.stats?.totalPaid ?? debt.paidAmount;
  const remainingBalance = debt.stats?.remainingBalance ?? debt.remainingAmount;

  const SkeletonTableRow = () => (
    <tr className="animate-pulse">
      <td className="px-3 py-2"><div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
      <td className="px-3 py-2"><div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
      <td className="px-3 py-2"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
    </tr>
  );

  const renderDetailsTab = () => (
    <div className="grid grid-cols-2 gap-4 p-3 rounded-md bg-[var(--card-secondary-bg)]">
      <div><span className="text-sm text-[var(--text-secondary)]">Debt Name:</span> <div className="font-medium">{debt.name}</div></div>
      <div><span className="text-sm text-[var(--text-secondary)]">Borrower:</span> <div className="font-medium">{debt.borrower?.name || "—"}</div></div>
      <div><span className="text-sm text-[var(--text-secondary)]">Total Amount:</span> <div>{formatCurrency(debt.totalAmount)}</div></div>
      <div><span className="text-sm text-[var(--text-secondary)]">Paid Amount:</span> <div>{formatCurrency(totalPaid)}</div></div>
      <div><span className="text-sm text-[var(--text-secondary)]">Remaining Balance:</span> <div className="font-bold text-[var(--debt-high)]">{formatCurrency(remainingBalance)}</div></div>
      <div><span className="text-sm text-[var(--text-secondary)]">Due Date:</span> <div>{formatDate(debt.dueDate)}</div></div>
      {debt.interestRate && <div><span className="text-sm text-[var(--text-secondary)]">Interest Rate:</span> <div>{debt.interestRate}%</div></div>}
      {debt.penaltyRate && <div><span className="text-sm text-[var(--text-secondary)]">Penalty Rate:</span> <div>{debt.penaltyRate}%</div></div>}
      <div><span className="text-sm text-[var(--text-secondary)]">Total Penalty:</span> <div>{formatCurrency(totalPenalty)}</div></div>
      {daysOverdue > 0 && (
        <div><span className="text-sm text-[var(--text-secondary)]">Days Overdue:</span> <div className="text-red-500 font-semibold">{daysOverdue} days</div></div>
      )}
    </div>
  );

  const renderPaymentsTab = () => (
    <>
      {loadingPayments ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--card-secondary-bg)]">
              <tr><th className="px-3 py-1 text-left">Date</th><th className="px-3 py-1 text-right">Amount</th><th className="px-3 py-1 text-left">Reference</th></tr>
            </thead>
            <tbody><SkeletonTableRow /><SkeletonTableRow /><SkeletonTableRow /></tbody>
          </table>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center text-[var(--text-tertiary)] py-4">No payments recorded.</div>
      ) : (
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
    </>
  );

  const renderPenaltiesTab = () => (
    <>
      {loadingPenalties ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--card-secondary-bg)]">
              <tr><th className="px-3 py-1 text-left">Date</th><th className="px-3 py-1 text-right">Amount</th><th className="px-3 py-1 text-left">Reason</th></tr>
            </thead>
            <tbody><SkeletonTableRow /><SkeletonTableRow /><SkeletonTableRow /></tbody>
          </table>
        </div>
      ) : penalties.length === 0 ? (
        <div className="text-center text-[var(--text-tertiary)] py-4">No penalties recorded.</div>
      ) : (
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
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Debt Details: ${debt.name}`} size="lg">
      <div className="space-y-4">
        <div className="flex border-b" style={{ borderColor: "var(--border-color)" }}>
          <button onClick={() => setActiveTab("details")} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "details" ? "text-[var(--primary-color)] border-b-2 border-[var(--primary-color)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>Details</button>
          <button onClick={() => setActiveTab("payments")} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "payments" ? "text-[var(--primary-color)] border-b-2 border-[var(--primary-color)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>Payments ({payments.length})</button>
          <button onClick={() => setActiveTab("penalties")} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "penalties" ? "text-[var(--primary-color)] border-b-2 border-[var(--primary-color)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>Penalties ({penalties.length})</button>
        </div>
        <div className="min-h-[200px]">
          {activeTab === "details" && renderDetailsTab()}
          {activeTab === "payments" && renderPaymentsTab()}
          {activeTab === "penalties" && renderPenaltiesTab()}
        </div>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewDebtModal;