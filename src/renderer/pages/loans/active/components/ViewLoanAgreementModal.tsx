// src/renderer/pages/loans/active/components/ViewLoanAgreementModal.tsx
import React, { useState, useEffect } from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import { formatDate } from "../../../../utils/formatters";
import { dialogs } from "../../../../utils/dialogs";
import type { LoanAgreement } from "../../../../api/core/loan_agreement";
import loanAgreementsAPI from "../../../../api/core/loan_agreement";

interface ViewLoanAgreementModalProps {
  isOpen: boolean;
  debtId: number | null;
  debtName: string;
  onClose: () => void;
}

const ViewLoanAgreementModal: React.FC<ViewLoanAgreementModalProps> = ({
  isOpen,
  debtId,
  debtName,
  onClose,
}) => {
  const [agreement, setAgreement] = useState<LoanAgreement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && debtId) {
      const fetchAgreement = async () => {
        setLoading(true);
        setError(null);
        try {
          // ✅ Use getByDebtId instead of getAll with sorting
          const agreements = await loanAgreementsAPI.getByDebtId(debtId);
          setAgreement(agreements.length > 0 ? agreements[0] : null);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchAgreement();
    } else {
      setAgreement(null);
      setError(null);
    }
  }, [isOpen, debtId]);

  const handleDownload = () => {
    if (agreement?.filePath) {
      // Buksan ang file gamit ang electron shell
      window.backendAPI.openExternal(agreement.filePath).catch((err: any) => {
        dialogs.error("Could not open file: " + err.message);
      });
    } else {
      dialogs.error("No file attached to this agreement");
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "signed" ? (
      <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500">
        Signed
      </span>
    ) : (
      <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500">
        Draft
      </span>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Loan Agreement - ${debtName}`}
      size="lg"
    >
      {loading && <div className="text-center py-8">Loading agreement...</div>}
      {error && (
        <div className="text-center py-4 text-red-500">Error: {error}</div>
      )}
      {!loading && !error && !agreement && (
        <div className="text-center py-8 text-[var(--text-secondary)]">
          No loan agreement found for this debt.
        </div>
      )}
      {!loading && !error && agreement && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-3 rounded-md bg-[var(--card-secondary-bg)]">
            <div>
              <span className="text-sm text-[var(--text-secondary)]">
                Lender:
              </span>{" "}
              <div>{agreement.lenderName || "—"}</div>
            </div>
            <div>
              <span className="text-sm text-[var(--text-secondary)]">
                Agreement Date:
              </span>{" "}
              <div>
                {agreement.agreementDate
                  ? formatDate(agreement.agreementDate)
                  : "—"}
              </div>
            </div>
            <div>
              <span className="text-sm text-[var(--text-secondary)]">
                Status:
              </span>{" "}
              <div>{getStatusBadge(agreement.status)}</div>
            </div>
            {agreement.signedBy && (
              <>
                <div>
                  <span className="text-sm text-[var(--text-secondary)]">
                    Signed By:
                  </span>{" "}
                  <div>{agreement.signedBy}</div>
                </div>
                <div>
                  <span className="text-sm text-[var(--text-secondary)]">
                    Signed At:
                  </span>{" "}
                  <div>
                    {agreement.signedAt ? formatDate(agreement.signedAt) : "—"}
                  </div>
                </div>
              </>
            )}
          </div>
          {agreement.termsText && (
            <div>
              <h4 className="font-semibold mb-1">Terms</h4>
              <div className="p-3 rounded-md bg-[var(--card-secondary-bg)] whitespace-pre-wrap max-h-40 overflow-y-auto">
                {agreement.termsText}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            {agreement.filePath && (
              <Button variant="secondary" onClick={handleDownload}>
                Download File
              </Button>
            )}
            <Button variant="primary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ViewLoanAgreementModal;
