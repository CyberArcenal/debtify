// src/renderer/pages/loan-agreements/components/EditAgreementModal.tsx
import React, { useState, useEffect } from "react";
import type { LoanAgreement } from "../../../../api/core/loan_agreement";
import { dialogs } from "../../../../utils/dialogs";
import loanAgreementsAPI from "../../../../api/core/loan_agreement";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import FileDropzone from "../../../../components/UI/FileDropzone";

interface EditAgreementModalProps {
  isOpen: boolean;
  agreement: LoanAgreement | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EditAgreementModal: React.FC<EditAgreementModalProps> = ({
  isOpen,
  agreement,
  onClose,
  onSuccess,
}) => {
  const [lenderName, setLenderName] = useState("");
  const [agreementDate, setAgreementDate] = useState("");
  const [termsText, setTermsText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (agreement && isOpen) {
      setLenderName(agreement.lenderName || "");
      // ✅ Safe conversion: kung Date object, i-convert sa YYYY-MM-DD string
      let dateStr = "";
      if (agreement.agreementDate) {
        const date = new Date(agreement.agreementDate);
        if (!isNaN(date.getTime())) {
          dateStr = date.toISOString().slice(0, 10);
        }
      }
      setAgreementDate(dateStr);
      setTermsText(agreement.termsText || "");
      setFile(null);
      setRemoveFile(false);
    }
  }, [agreement, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreement) return;
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
      await loanAgreementsAPI.update(agreement.id, {
        lenderName: lenderName.trim(),
        agreementDate,
        termsText: termsText.trim() || undefined,
        fileBuffer,
        fileName,
        removeFile: removeFile && !file,
      });
      dialogs.success("Agreement updated");
      onSuccess();
      onClose();
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!agreement) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Loan Agreement"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">
            Lender Name *
          </label>
          <input
            type="text"
            value={lenderName}
            onChange={(e) => setLenderName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            style={{
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--border-color)",
            }}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">
            Agreement Date
          </label>
          <input
            type="date"
            value={agreementDate}
            onChange={(e) => setAgreementDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            style={{
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--border-color)",
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">
            Terms (optional)
          </label>
          <textarea
            rows={3}
            value={termsText}
            onChange={(e) => setTermsText(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            style={{
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--border-color)",
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--text-secondary)]">
            Agreement File
          </label>
          <FileDropzone
            onFileSelect={(selectedFile) => {
              setFile(selectedFile);
              if (selectedFile) setRemoveFile(false);
            }}
            currentFile={file}
            accept=".pdf,.doc,.docx"
            maxSizeMB={10}
            disabled={false}
          />
          {agreement.filePath && !file && !removeFile && (
            <div className="mt-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={removeFile}
                  onChange={(e) => setRemoveFile(e.target.checked)}
                />
                Remove current file (keep agreement record)
              </label>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Current file: {agreement.filePath.split("/").pop()}
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="success" disabled={submitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditAgreementModal;
