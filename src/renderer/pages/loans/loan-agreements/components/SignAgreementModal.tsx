import React from "react";
import Button from "../../../../components/UI/Button";
import Modal from "../../../../components/UI/Modal";
import type { LoanAgreement } from "../../../../api/core/loan_agreement";

interface SignAgreementModalProps {
  isOpen: boolean;
  agreement: LoanAgreement | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const SignAgreementModal: React.FC<SignAgreementModalProps> = ({ isOpen, agreement, onClose, onConfirm, isLoading }) => {
  if (!agreement) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sign Loan Agreement" size="md">
      <div className="space-y-4">
        <p className="text-[var(--text-primary)]">
          You are about to sign the loan agreement for debt <strong>{agreement.debt?.name}</strong> with lender <strong>{agreement.lenderName}</strong>.
        </p>
        <p className="text-sm text-red-500">This action is irreversible. After signing, the agreement cannot be edited.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="warning" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Signing..." : "Confirm Sign"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SignAgreementModal;