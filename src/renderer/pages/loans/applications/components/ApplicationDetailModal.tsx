// src/renderer/pages/loans/applications/components/ApplicationDetailModal.tsx
import React, { useState, useEffect } from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import type { LoanApplication } from "../types";
import { formatCurrency, formatDate } from "../../../../utils/formatters";
import debtsAPI from "../../../../api/core/debt";
import type { Debt } from "../../../../api/core/debt";

interface ApplicationDetailModalProps {
  isOpen: boolean;
  application: LoanApplication | null;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  isOpen,
  application,
  onClose,
  onApprove,
  onReject,
}) => {
  const [debt, setDebt] = useState<Debt | null>(null);
  const [loadingDebt, setLoadingDebt] = useState(false);

  // Kapag approved ang application, kunin ang kaakibat na debt
  useEffect(() => {
    if (isOpen && application && application.status === "approved" && application.id) {
      const fetchDebt = async () => {
        setLoadingDebt(true);
        try {
          // I-assume na ang application ay may `debtId` (kung wala, subukan sa endpoint)
          const response = await debtsAPI.getByApplicationId?.(application.id);
          if (response?.status && response.data) {
            setDebt(response.data);
          } else {
            // Fallback: kunin ang lahat ng debts para sa borrower at hanapin ang pinakabago
            const debtsRes = await debtsAPI.getAll({ borrowerId: application.debtorId, limit: 1, sortBy: "createdAt", sortOrder: "DESC" });
            if (debtsRes.status && debtsRes.data.data.length > 0) {
              setDebt(debtsRes.data.data[0]);
            }
          }
        } catch (error) {
          console.error("Failed to fetch associated debt", error);
        } finally {
          setLoadingDebt(false);
        }
      };
      fetchDebt();
    } else {
      setDebt(null);
    }
  }, [isOpen, application]);

  if (!application) return null;

  const getStatusColor = () => {
    switch (application.status) {
      case "pending":
        return "var(--status-pending-text)";
      case "approved":
        return "var(--status-paid-text)";
      case "rejected":
        return "var(--status-overdue-text)";
      default:
        return "var(--text-primary)";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Loan Application Details" size="lg">
      <div className="space-y-4">
        {/* Application Details Section */}
        <div>
          <h4 className="text-md font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Application Information
          </h4>
          <div className="grid grid-cols-2 gap-4 p-3 rounded-md" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
            <div>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Debtor:</span>
              <div className="font-medium" style={{ color: "var(--text-primary)" }}>{application.debtorName}</div>
            </div>
            <div>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Status:</span>
              <div className="font-semibold" style={{ color: getStatusColor() }}>{application.status.toUpperCase()}</div>
            </div>
            <div>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Requested Amount:</span>
              <div style={{ color: "var(--text-primary)" }}>{formatCurrency(application.requestedAmount)}</div>
            </div>
            <div>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Purpose:</span>
              <div style={{ color: "var(--text-primary)" }}>{application.purpose}</div>
            </div>
            <div>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Proposed Due Date:</span>
              <div style={{ color: "var(--text-primary)" }}>{formatDate(application.proposedDueDate)}</div>
            </div>
            <div>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Interest Rate (applied):</span>
              <div style={{ color: "var(--text-primary)" }}>{application.interestRate ? `${application.interestRate}%` : "—"}</div>
            </div>
            <div>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Applied On:</span>
              <div style={{ color: "var(--text-primary)" }}>{formatDate(application.createdAt)}</div>
            </div>
            {application.approvedAt && (
              <div>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Approved On:</span>
                <div style={{ color: "var(--text-primary)" }}>{formatDate(application.approvedAt)}</div>
              </div>
            )}
            {application.rejectedAt && (
              <div>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Rejected On:</span>
                <div style={{ color: "var(--text-primary)" }}>{formatDate(application.rejectedAt)}</div>
              </div>
            )}
            {application.rejectionReason && (
              <div className="col-span-2">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Rejection Reason:</span>
                <div style={{ color: "var(--text-primary)" }}>{application.rejectionReason}</div>
              </div>
            )}
          </div>
        </div>

        {/* Loan (Debt) Details Section - only if approved */}
        {application.status === "approved" && (
          <div>
            <h4 className="text-md font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Approved Loan Details
            </h4>
            {loadingDebt ? (
              <div className="p-3 rounded-md" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
                <div className="animate-pulse">Loading debt details...</div>
              </div>
            ) : debt ? (
              <div className="grid grid-cols-2 gap-4 p-3 rounded-md" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
                <div>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Debt Name:</span>
                  <div className="font-medium" style={{ color: "var(--text-primary)" }}>{debt.name}</div>
                </div>
                <div>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Debt Status:</span>
                  <div className="font-medium" style={{ color: debt.status === "paid" ? "var(--status-paid-text)" : "var(--status-overdue-text)" }}>
                    {debt.status.toUpperCase()}
                  </div>
                </div>
                <div>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Total Amount:</span>
                  <div style={{ color: "var(--text-primary)" }}>{formatCurrency(debt.totalAmount)}</div>
                </div>
                <div>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Paid Amount:</span>
                  <div style={{ color: "var(--text-primary)" }}>{formatCurrency(debt.paidAmount)}</div>
                </div>
                <div>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Remaining Balance:</span>
                  <div className="font-semibold" style={{ color: "var(--debt-high)" }}>{formatCurrency(debt.remainingAmount)}</div>
                </div>
                <div>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Due Date:</span>
                  <div style={{ color: "var(--text-primary)" }}>{formatDate(debt.dueDate)}</div>
                </div>
                <div>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Interest Rate:</span>
                  <div style={{ color: "var(--text-primary)" }}>{debt.interestRate ? `${debt.interestRate}%` : "—"}</div>
                </div>
                <div>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Penalty Rate:</span>
                  <div style={{ color: "var(--text-primary)" }}>{debt.penaltyRate ? `${debt.penaltyRate}%` : "—"}</div>
                </div>
                {debt.stats && (
                  <>
                    <div>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Total Penalty:</span>
                      <div style={{ color: "var(--text-primary)" }}>{formatCurrency(debt.stats.totalPenalty)}</div>
                    </div>
                    <div>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Days Overdue:</span>
                      <div className={debt.stats.daysOverdue > 0 ? "text-red-500" : "text-green-500"}>{debt.stats.daysOverdue}</div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-md" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
                <p className="text-center" style={{ color: "var(--text-tertiary)" }}>No associated debt record found.</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {application.status === "pending" && (
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="danger" onClick={onReject}>
              Reject
            </Button>
            <Button variant="success" onClick={onApprove}>
              Approve
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ApplicationDetailModal;