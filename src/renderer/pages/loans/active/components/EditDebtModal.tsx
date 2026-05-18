// src/renderer/pages/loans/active/components/EditDebtModal.tsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import { dialogs } from "../../../../utils/dialogs";
import debtsAPI from "../../../../api/core/debt";
import type { Debt, DebtUpdateData } from "../../../../api/core/debt";

interface EditDebtModalProps {
  isOpen: boolean;
  debt: Debt | null;
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  name: string;
  totalAmount: number;
  dueDate: string;
  interestRate: number | null;
  penaltyRate: number | null;
};

const EditDebtModal: React.FC<EditDebtModalProps> = ({ isOpen, debt, onClose, onSuccess }) => {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>();

  useEffect(() => {
    if (debt) {
      // Safely convert dueDate to YYYY-MM-DD format
      let dueDateStr = "";
      if (debt.dueDate) {
        const date = new Date(debt.dueDate);
        if (!isNaN(date.getTime())) {
          dueDateStr = date.toISOString().slice(0, 10);
        }
      }
      reset({
        name: debt.name,
        totalAmount: debt.totalAmount,
        dueDate: dueDateStr,
        interestRate: debt.interestRate ?? null,
        penaltyRate: debt.penaltyRate ?? null,
      });
    }
  }, [debt, reset]);

  const onSubmit = async (data: FormData) => {
    if (!debt) return;
    try {
      await debtsAPI.update(debt.id, data as DebtUpdateData);
      dialogs.success("Debt updated successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Debt" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Debt Name *</label>
          <input {...register("name", { required: true })} className="w-full px-3 py-2 border rounded-md" style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)" }} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Total Amount *</label>
          <input type="number" step="0.01" {...register("totalAmount", { required: true, valueAsNumber: true })} className="w-full px-3 py-2 border rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Due Date *</label>
          <input type="date" {...register("dueDate", { required: true })} className="w-full px-3 py-2 border rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Interest Rate (%)</label>
          <input type="number" step="0.01" {...register("interestRate", { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Penalty Rate (%)</label>
          <input type="number" step="0.01" {...register("penaltyRate", { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-md" />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="success" disabled={isSubmitting}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditDebtModal;