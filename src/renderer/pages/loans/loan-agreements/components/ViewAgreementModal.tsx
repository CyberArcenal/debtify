import React from "react";
import type { LoanAgreement } from "../../../../api/core/loan_agreement";
import Modal from "../../../../components/UI/Modal";
import { formatDate } from "../../../../utils/formatters";
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
        {agreement.termsText && (
          <div>
            <h4 className="font-semibold mb-1">Terms</h4>
            <div className="p-3 rounded-md bg-[var(--card-secondary-bg)] whitespace-pre-wrap">{agreement.termsText}</div>
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