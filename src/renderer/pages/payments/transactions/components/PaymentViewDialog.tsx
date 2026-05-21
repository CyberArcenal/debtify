// src/renderer/pages/payments/transactions/components/PaymentViewDialog.tsx
import React from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import { Receipt, DollarSign, Calendar, Hash, FileText, User, BookOpen, CreditCard, Clock, Archive } from "lucide-react";
import type { PaymentTransaction } from "../../../../api/core/payment_transaction";
import { formatCurrency, formatDate, formatDateTime } from "../../../../utils/formatters";

interface PaymentViewDialogProps {
  transaction: PaymentTransaction | null;
  isOpen: boolean;
  onClose: () => void;
}

const PaymentViewDialog: React.FC<PaymentViewDialogProps> = ({ transaction, isOpen, onClose }) => {
  if (!transaction) return null;

  const isDeleted = !!transaction.deletedAt;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Transaction Details" size="lg">
      <div className="space-y-4">
        {/* Header with icon and status */}
        <div className="flex items-center gap-4 border-b pb-4" style={{ borderColor: "var(--border-color)" }}>
          <div className="w-16 h-16 rounded-full bg-[var(--primary-color)]/20 flex items-center justify-center">
            <Receipt className="w-8 h-8 text-[var(--primary-color)]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
              Payment #{transaction.id}
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Recorded on {formatDateTime(transaction.recordedAt)}
            </p>
            {isDeleted && (
              <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                Deleted
              </span>
            )}
          </div>
        </div>

        {/* Two‑column grid for details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Amount */}
          <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)]">
            <DollarSign className="w-5 h-5 text-[var(--success-color)]" />
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Amount</p>
              <p className="font-bold text-lg" style={{ color: "var(--success-color)" }}>
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>

          {/* Payment Date */}
          <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)]">
            <Calendar className="w-5 h-5 text-[var(--accent-blue)]" />
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Payment Date</p>
              <p className="font-medium">{formatDate(transaction.paymentDate)}</p>
            </div>
          </div>

          {/* Reference */}
          <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)]">
            <Hash className="w-5 h-5 text-[var(--accent-purple)]" />
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Reference</p>
              <p className="font-medium">{transaction.reference || "—"}</p>
            </div>
          </div>

          {/* Method (if available) */}
          {transaction.methodId && (
            <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)]">
              <CreditCard className="w-5 h-5 text-[var(--accent-amber)]" />
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">Payment Method ID</p>
                <p className="font-medium">{transaction.methodId}</p>
              </div>
            </div>
          )}

          {/* Debt Name */}
          <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)]">
            <BookOpen className="w-5 h-5 text-[var(--accent-blue)]" />
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Debt</p>
              <p className="font-medium">{transaction.debt?.name || "—"}</p>
              {transaction.debt && (
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  Total: {formatCurrency(transaction.debt.totalAmount)} | Remaining: {formatCurrency(transaction.debt.remainingAmount)}
                </p>
              )}
            </div>
          </div>

          {/* Borrower */}
          <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)]">
            <User className="w-5 h-5 text-[var(--accent-blue)]" />
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Borrower</p>
              <p className="font-medium">{transaction.debt?.borrower?.name || "—"}</p>
              {transaction.debt?.borrower?.id && (
                <p className="text-xs text-[var(--text-tertiary)]">ID: {transaction.debt.borrower.id}</p>
              )}
            </div>
          </div>
        </div>

        {/* Notes (full width) */}
        {transaction.notes && (
          <div className="p-3 rounded-md bg-[var(--card-secondary-bg)]">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-[var(--text-tertiary)]" />
              <p className="text-xs text-[var(--text-tertiary)]">Notes</p>
            </div>
            <p className="whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
              {transaction.notes}
            </p>
          </div>
        )}

        {/* Recorded at and deletion info */}
        <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)]">
          <Clock className="w-5 h-5 text-[var(--text-tertiary)]" />
          <div>
            <p className="text-xs text-[var(--text-tertiary)]">Recorded At</p>
            <p className="font-medium">{formatDateTime(transaction.recordedAt)}</p>
            {transaction.deletedAt && (
              <p className="text-xs text-red-500 mt-1">Deleted: {formatDateTime(transaction.deletedAt)}</p>
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "var(--border-color)" }}>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentViewDialog;