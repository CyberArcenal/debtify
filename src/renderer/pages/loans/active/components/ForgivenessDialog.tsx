// src/renderer/components/Shared/ForgivenessDialog.tsx
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface ForgivenessDialogProps {
  isOpen: boolean;
  remainingBalance: number;
  onClose: () => void;
  onConfirm: (amount: number, reason?: string) => void;
  isLoading?: boolean;
}

export const ForgivenessDialog: React.FC<ForgivenessDialogProps> = ({
  isOpen,
  remainingBalance,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [amount, setAmount] = useState<number>(remainingBalance);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmount(remainingBalance);
      setReason("");
    }
  }, [isOpen, remainingBalance]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (amount <= 0) {
      // maybe show inline error
      return;
    }
    if (amount > remainingBalance) {
      return;
    }
    onConfirm(amount, reason.trim() || undefined);
  };

  const isValid = amount > 0 && amount <= remainingBalance;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--card-bg)] rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Apply Forgiveness</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--card-hover-bg)] rounded">
            <X className="w-5 h-5 text-[var(--text-tertiary)]" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Amount to forgive *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">₱</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={remainingBalance}
                value={amount.toFixed(2)}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
              />
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Max: ₱{remainingBalance.toFixed(2)}
            </p>
            {(amount <= 0 || amount > remainingBalance) && (
              <p className="text-xs text-red-500 mt-1">
                Amount must be between 0.01 and {remainingBalance.toFixed(2)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Good payer, hardship, etc."
              rows={3}
              className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[var(--text-primary)] bg-[var(--card-hover-bg)] rounded-lg hover:bg-[var(--border-color)]"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Applying..." : "Apply Forgiveness"}
          </button>
        </div>
      </div>
    </div>
  );
};