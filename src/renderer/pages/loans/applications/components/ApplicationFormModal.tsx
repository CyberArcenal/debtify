// src/renderer/pages/loans/applications/components/ApplicationFormModal.tsx
import React, { useState, useEffect } from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import { dialogs } from "../../../../utils/dialogs";
import borrowersAPI from "../../../../api/core/borrower";
import BorrowerSelect from "../../../../components/Selects/Borrower";
import type { Borrower } from "../../../../api/core/borrower";
import loanApplicationsAPI from "../../../../api/core/loan_application";

interface ApplicationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  debtorType: "existing" | "new";
  debtorId: number | null;
  newDebtorName: string;
  newDebtorContact: string;
  newDebtorEmail: string;
  newDebtorAddress: string;
  requestedAmount: number;
  purpose: string;
  proposedDueDate: string;
  interestRate: number;
};

const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    debtorType: "existing",
    debtorId: null,
    newDebtorName: "",
    newDebtorContact: "",
    newDebtorEmail: "",
    newDebtorAddress: "",
    requestedAmount: 0,
    purpose: "",
    proposedDueDate: new Date().toISOString().slice(0, 10),
    interestRate: 0,
  });
  const [existingDebtors, setExistingDebtors] = useState<Borrower[]>([]);
  const [loadingDebtors, setLoadingDebtors] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && formData.debtorType === "existing") {
      const loadDebtors = async () => {
        setLoadingDebtors(true);
        try {
          const res = await borrowersAPI.getAll({ limit: 1000, includeDeleted: false });
          if (res.status) setExistingDebtors(res.data);
        } catch (err) { console.error(err); }
        finally { setLoadingDebtors(false); }
      };
      loadDebtors();
    }
  }, [isOpen, formData.debtorType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.requestedAmount <= 0) { dialogs.error("Requested amount must be greater than zero"); return; }
    if (!formData.purpose.trim()) { dialogs.error("Purpose is required"); return; }
    if (!formData.proposedDueDate) { dialogs.error("Due date is required"); return; }
    if (formData.debtorType === "existing" && !formData.debtorId) { dialogs.error("Please select a debtor"); return; }
    if (formData.debtorType === "new" && !formData.newDebtorName.trim()) { dialogs.error("New debtor name is required"); return; }

    setSubmitting(true);
    try {
      const createData: any = {
        requestedAmount: formData.requestedAmount,
        purpose: formData.purpose,
        proposedDueDate: formData.proposedDueDate,
        interestRate: formData.interestRate || null,
      };
      if (formData.debtorType === "existing") {
        createData.debtorId = formData.debtorId;
      } else {
        createData.newDebtor = {
          name: formData.newDebtorName,
          contact: formData.newDebtorContact || null,
          email: formData.newDebtorEmail || null,
          address: formData.newDebtorAddress || null,
        };
      }
      const response = await loanApplicationsAPI.create(createData);
      if (response.status) {
        dialogs.success("Loan application submitted successfully");
        onSuccess();
        onClose();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--border-color)",
    color: "var(--text-primary)",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Loan Application" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Debtor Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <input type="radio" value="existing" checked={formData.debtorType === "existing"} onChange={() => setFormData({ ...formData, debtorType: "existing", debtorId: null })} /> Existing Debtor
            </label>
            <label className="flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <input type="radio" value="new" checked={formData.debtorType === "new"} onChange={() => setFormData({ ...formData, debtorType: "new" })} /> New Debtor
            </label>
          </div>
        </div>

        {formData.debtorType === "existing" ? (
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Select Debtor *</label>
            <BorrowerSelect
              value={formData.debtorId}
              onChange={(id, debtor) => setFormData({ ...formData, debtorId: id })}
              placeholder="-- Select Debtor --"
              activeOnly={true}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Full Name *</label>
              <input required value={formData.newDebtorName} onChange={(e) => setFormData({ ...formData, newDebtorName: e.target.value })} className="w-full px-3 py-2 border rounded-md" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Contact</label>
              <input value={formData.newDebtorContact} onChange={(e) => setFormData({ ...formData, newDebtorContact: e.target.value })} className="w-full px-3 py-2 border rounded-md" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Email</label>
              <input type="email" value={formData.newDebtorEmail} onChange={(e) => setFormData({ ...formData, newDebtorEmail: e.target.value })} className="w-full px-3 py-2 border rounded-md" style={inputStyle} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Address</label>
              <textarea value={formData.newDebtorAddress} onChange={(e) => setFormData({ ...formData, newDebtorAddress: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-md" style={inputStyle} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Requested Amount *</label>
            <input type="number" step="0.01" required value={formData.requestedAmount} onChange={(e) => setFormData({ ...formData, requestedAmount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-md" style={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Interest Rate (%)</label>
            <input type="number" step="0.01" value={formData.interestRate} onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-md" style={inputStyle} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Purpose *</label>
          <textarea required value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-md" style={inputStyle} placeholder="e.g., Business loan, Education, Medical..." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Proposed Due Date *</label>
          <input type="date" required value={formData.proposedDueDate} onChange={(e) => setFormData({ ...formData, proposedDueDate: e.target.value })} className="w-full px-3 py-2 border rounded-md" style={inputStyle} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="success" disabled={submitting}>{submitting ? "Submitting..." : "Submit Application"}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default ApplicationFormModal;