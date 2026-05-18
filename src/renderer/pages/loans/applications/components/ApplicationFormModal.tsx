// src/renderer/pages/loans/applications/components/ApplicationFormModal.tsx
import React, { useState, useEffect } from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import { dialogs } from "../../../../utils/dialogs";
import borrowersAPI from "../../../../api/core/borrower";
import type { Borrower } from "../../../../api/core/borrower";
import { createApplication } from "../services/mockApplicationService";

interface ApplicationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  debtorType: "existing" | "new";
  debtorId: number | "";
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
    debtorId: "",
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

    setSubmitting(true);
    try {
      const createData: any = {
        requestedAmount: formData.requestedAmount,
        purpose: formData.purpose,
        proposedDueDate: formData.proposedDueDate,
        interestRate: formData.interestRate || null,
      };
      if (formData.debtorType === "existing" && formData.debtorId) {
        createData.debtorId = formData.debtorId;
      } else {
        createData.newDebtor = {
          name: formData.newDebtorName,
          contact: formData.newDebtorContact || null,
          email: formData.newDebtorEmail || null,
          address: formData.newDebtorAddress || null,
        };
      }
      await createApplication(createData);
      dialogs.success("Loan application submitted successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Loan Application" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Debtor Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2"><input type="radio" value="existing" checked={formData.debtorType === "existing"} onChange={() => setFormData({ ...formData, debtorType: "existing", debtorId: "" })} /> Existing Debtor</label>
            <label className="flex items-center gap-2"><input type="radio" value="new" checked={formData.debtorType === "new"} onChange={() => setFormData({ ...formData, debtorType: "new" })} /> New Debtor</label>
          </div>
        </div>

        {formData.debtorType === "existing" ? (
          <div>
            <label className="block text-sm font-medium mb-1">Select Debtor *</label>
            <select required value={formData.debtorId} onChange={(e) => setFormData({ ...formData, debtorId: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-md">
              <option value="">-- Select Debtor --</option>
              {loadingDebtors ? <option disabled>Loading...</option> : existingDebtors.map(d => <option key={d.id} value={d.id}>{d.name} - {d.email || d.contact}</option>)}
            </select>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1">Full Name *</label><input required value={formData.newDebtorName} onChange={(e) => setFormData({ ...formData, newDebtorName: e.target.value })} className="w-full px-3 py-2 border rounded-md" /></div>
            <div><label className="block text-sm font-medium mb-1">Contact</label><input value={formData.newDebtorContact} onChange={(e) => setFormData({ ...formData, newDebtorContact: e.target.value })} className="w-full px-3 py-2 border rounded-md" /></div>
            <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={formData.newDebtorEmail} onChange={(e) => setFormData({ ...formData, newDebtorEmail: e.target.value })} className="w-full px-3 py-2 border rounded-md" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Address</label><textarea value={formData.newDebtorAddress} onChange={(e) => setFormData({ ...formData, newDebtorAddress: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-md" /></div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium mb-1">Requested Amount *</label><input type="number" step="0.01" required value={formData.requestedAmount} onChange={(e) => setFormData({ ...formData, requestedAmount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-md" /></div>
          <div><label className="block text-sm font-medium mb-1">Interest Rate (%)</label><input type="number" step="0.01" value={formData.interestRate} onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-md" /></div>
        </div>
        <div><label className="block text-sm font-medium mb-1">Purpose *</label><textarea required value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-md" placeholder="e.g., Business loan, Education, Medical..." /></div>
        <div><label className="block text-sm font-medium mb-1">Proposed Due Date *</label><input type="date" required value={formData.proposedDueDate} onChange={(e) => setFormData({ ...formData, proposedDueDate: e.target.value })} className="w-full px-3 py-2 border rounded-md" /></div>

        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" variant="success" disabled={submitting}>{submitting ? "Submitting..." : "Submit Application"}</Button></div>
      </form>
    </Modal>
  );
};

export default ApplicationFormModal;