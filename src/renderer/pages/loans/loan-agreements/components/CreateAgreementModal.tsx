import React, { useState, useEffect } from "react";
import { dialogs } from "../../../../utils/dialogs";
import loanAgreementsAPI from "../../../../api/core/loan_agreement";
import Modal from "../../../../components/UI/Modal";
import DebtSelect from "../../../../components/Selects/Debt";
import Button from "../../../../components/UI/Button";

interface CreateAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateAgreementModal: React.FC<CreateAgreementModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [debtId, setDebtId] = useState<number | null>(null);
  const [lenderName, setLenderName] = useState("");
  const [agreementDate, setAgreementDate] = useState(new Date().toISOString().slice(0, 10));
  const [termsText, setTermsText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setDebtId(null);
      setLenderName("");
      setAgreementDate(new Date().toISOString().slice(0, 10));
      setTermsText("");
      setFile(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtId) {
      dialogs.error("Please select a debt");
      return;
    }
    if (!lenderName.trim()) {
      dialogs.error("Lender name is required");
      return;
    }

    setSubmitting(true);
    try {
      let fileBuffer: Uint8Array | undefined;
      let fileName: string | undefined;
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        fileBuffer = new Uint8Array(arrayBuffer);
        fileName = file.name;
      }
      await loanAgreementsAPI.create({
        debtId,
        lenderName: lenderName.trim(),
        agreementDate,
        termsText: termsText.trim() || undefined,
        fileBuffer,
        fileName,
      });
      dialogs.success("Loan agreement created");
      onSuccess();
      onClose();
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Loan Agreement" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Debt *</label>
          <DebtSelect
            value={debtId}
            onChange={(id) => setDebtId(id)}
            statusFilter="active"
            placeholder="Select active loan..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Lender Name *</label>
          <input
            type="text"
            value={lenderName}
            onChange={(e) => setLenderName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)" }}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Agreement Date</label>
          <input
            type="date"
            value={agreementDate}
            onChange={(e) => setAgreementDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)" }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Terms (optional)</label>
          <textarea
            rows={3}
            value={termsText}
            onChange={(e) => setTermsText(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)" }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">Upload File (PDF, optional)</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="success" disabled={submitting}>Create Draft</Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateAgreementModal;