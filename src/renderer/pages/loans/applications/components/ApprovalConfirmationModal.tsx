// src/renderer/pages/loans/applications/components/ApprovalConfirmationModal.tsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import type { LoanApplication } from "../types";
import { Loader2 } from "lucide-react";

interface ApprovalConfirmationModalProps {
  isOpen: boolean;
  application: LoanApplication | null;
  type: "approve" | "reject";
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
}

const ApprovalConfirmationModal: React.FC<ApprovalConfirmationModalProps> = ({
  isOpen,
  application,
  type,
  onClose,
  onConfirm,
}) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleConfirm = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      // Call the parent action (async)
      await onConfirm(type === "reject" ? rejectionReason : undefined);
      // After successful action, parent will close modal via onClose (or its own state)
    } catch (error) {
      // Error already handled by parent (dialogs.error)
      // But we still need to stop loading and not close automatically
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
    // No need to set loading false here because modal will be closed by parent
    // However, if parent doesn't close on error (e.g., they might show error but keep modal open),
    // we should reset loading. The parent's confirmAction always calls setConfirmModal close in finally,
    // so modal unmounts. But if the parent changes behavior, we keep the flag.
  }, [isLoading, onConfirm, rejectionReason, type]);

  if (!application) return null;

  const isApprove = type === "approve";
  const confirmVariant = isApprove ? "success" : "danger";
  const confirmText = isApprove ? "Approve" : "Reject";
  const titleText = isApprove ? "Approve Application" : "Reject Application";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titleText} size="md">
      <div className="space-y-4">
        {/* Application summary card */}
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: "var(--card-secondary-bg)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                Debtor
              </span>
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                {application.debtorName}
              </p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                Requested Amount
              </span>
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                ₱{Number(application.requestedAmount).toLocaleString()}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-xs uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                Purpose
              </span>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {application.purpose || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Confirmation message */}
        {isApprove ? (
          <div
            className="p-3 rounded-md text-sm"
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              color: "var(--success-color)",
              borderLeft: "3px solid var(--success-color)",
            }}
          >
            ✅ Approving this application will create an active loan for the debtor. The debtor will be notified via email/SMS if configured.
          </div>
        ) : (
          <div
            className="p-3 rounded-md text-sm"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "var(--danger-color)",
              borderLeft: "3px solid var(--danger-color)",
            }}
          >
            ⚠️ Rejecting this application will archive it. The debtor will be notified (if contact info is provided).
          </div>
        )}

        {/* Rejection reason textarea (only for reject) */}
        {!isApprove && (
          <div>
            <label
              htmlFor="rejection-reason"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Rejection Reason <span className="text-xs">(optional)</span>
            </label>
            <textarea
              id="rejection-reason"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 transition"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)",
              }}
              placeholder="Why is this application being rejected? (will be shared with the debtor)"
              disabled={isLoading}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="min-w-[80px]"
          >
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={isLoading}
            className="min-w-[100px] flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ApprovalConfirmationModal;