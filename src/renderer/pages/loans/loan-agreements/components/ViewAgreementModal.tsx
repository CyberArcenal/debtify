// src/renderer/pages/loan-agreements/components/ViewAgreementModal.tsx
import React from "react";
import type { LoanAgreement } from "../../../../api/core/loan_agreement";
import Modal from "../../../../components/UI/Modal";
import { formatDate, formatCurrency } from "../../../../utils/formatters";
import Button from "../../../../components/UI/Button";

interface ViewAgreementModalProps {
  isOpen: boolean;
  agreement: LoanAgreement | null;
  onClose: () => void;
  onDownload: () => void;
}

const ViewAgreementModal: React.FC<ViewAgreementModalProps> = ({ isOpen, agreement, onClose, onDownload }) => {
  if (!agreement) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Loan Agreement Details" size="lg">
      <div className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4 p-3 rounded-md bg-[var(--card-secondary-bg)]">
          <div><span className="text-sm text-[var(--text-secondary)]">Debt:</span> <div>{agreement.debt?.name}</div></div>
          <div><span className="text-sm text-[var(--text-secondary)]">Borrower:</span> <div>{agreement.debt?.borrower?.name}</div></div>
          <div><span className="text-sm text-[var(--text-secondary)]">Lender:</span> <div>{agreement.lenderName || "—"}</div></div>
          <div><span className="text-sm text-[var(--text-secondary)]">Agreement Date:</span> <div>{agreement.agreementDate ? formatDate(agreement.agreementDate) : "—"}</div></div>
          <div><span className="text-sm text-[var(--text-secondary)]">Status:</span> <div>{agreement.status === "signed" ? "Signed" : "Draft"}</div></div>
          {agreement.signedBy && (
            <>
              <div><span className="text-sm text-[var(--text-secondary)]">Signed By:</span> <div>{agreement.signedBy}</div></div>
              <div><span className="text-sm text-[var(--text-secondary)]">Signed At:</span> <div>{agreement.signedAt ? formatDate(agreement.signedAt) : "—"}</div></div>
            </>
          )}
        </div>

        {/* Snapshot Loan Terms (if any) */}
        {(agreement.principalAmount || agreement.interestRate || agreement.penaltyRate || agreement.dueDate || agreement.purpose) && (
          <div>
            <h4 className="font-semibold mb-1">Loan Terms (as of signing)</h4>
            <div className="grid grid-cols-2 gap-4 p-3 rounded-md bg-[var(--card-secondary-bg)]">
              {agreement.principalAmount && <div><span className="text-sm text-[var(--text-secondary)]">Principal:</span> <div>{formatCurrency(agreement.principalAmount)}</div></div>}
              {agreement.interestRate && <div><span className="text-sm text-[var(--text-secondary)]">Interest Rate:</span> <div>{agreement.interestRate}% p.a.</div></div>}
              {agreement.penaltyRate && <div><span className="text-sm text-[var(--text-secondary)]">Penalty Rate:</span> <div>{agreement.penaltyRate}% p.a.</div></div>}
              {agreement.dueDate && <div><span className="text-sm text-[var(--text-secondary)]">Due Date:</span> <div>{formatDate(agreement.dueDate)}</div></div>}
              {agreement.purpose && <div className="col-span-2"><span className="text-sm text-[var(--text-secondary)]">Purpose:</span> <div>{agreement.purpose}</div></div>}
              {agreement.loanStartDate && <div><span className="text-sm text-[var(--text-secondary)]">Loan Start Date:</span> <div>{formatDate(agreement.loanStartDate)}</div></div>}
              {agreement.anniversaryDay && <div><span className="text-sm text-[var(--text-secondary)]">Interest Anniversary Day:</span> <div>Every {agreement.anniversaryDay}th of the month</div></div>}
            </div>
          </div>
        )}

        {/* Terms Text */}
        {agreement.termsText && (
          <div>
            <h4 className="font-semibold mb-1">Additional Terms</h4>
            <div className="p-3 rounded-md bg-[var(--card-secondary-bg)] whitespace-pre-wrap max-h-48 overflow-y-auto">
              {agreement.termsText}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          {agreement.filePath && (
            <Button variant="secondary" onClick={onDownload}>
              Download File
            </Button>
          )}
          <Button variant="primary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewAgreementModal;