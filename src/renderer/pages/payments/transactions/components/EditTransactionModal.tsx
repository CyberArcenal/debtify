// src/renderer/pages/payments/transactions/components/EditTransactionModal.tsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import { dialogs } from "../../../../utils/dialogs";
import type { PaymentTransaction } from "../../../../api/core/payment_transaction";

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: PaymentTransaction | null;
  onClose: () => void;
  onSave: (id: number, data: any) => Promise<void>;
}

type FormData = {
  amount: number;
  paymentDate: string;
  reference: string;
  notes: string;
};

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ isOpen, transaction, onClose, onSave }) => {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>();

  useEffect(() => {
    if (transaction) {
      // Safely get paymentDate string
      let paymentDateStr = "";
      if (transaction.paymentDate) {
        const date = new Date(transaction.paymentDate);
        if (!isNaN(date.getTime())) paymentDateStr = date.toISOString().slice(0, 10);
      }
      reset({
        amount: transaction.amount,
        paymentDate: paymentDateStr,
        reference: transaction.reference || "",
        notes: transaction.notes || "",
      });
    }
  }, [transaction, reset]);

  const onSubmit = async (data: FormData) => {
    if (!transaction) return;
    try {
      await onSave(transaction.id, data);
      dialogs.success("Transaction updated");
      onClose();
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--border-color)",
    color: "var(--text-primary)",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Transaction" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div><label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Amount</label><input type="number" step="0.01" {...register("amount", { required: true, valueAsNumber: true })} className="w-full px-3 py-2 border rounded" style={inputStyle} /></div>
        <div><label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Payment Date</label><input type="date" {...register("paymentDate", { required: true })} className="w-full px-3 py-2 border rounded" style={inputStyle} /></div>
        <div><label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Reference</label><input {...register("reference")} className="w-full px-3 py-2 border rounded" style={inputStyle} /></div>
        <div><label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Notes</label><textarea {...register("notes")} rows={2} className="w-full px-3 py-2 border rounded" style={inputStyle} /></div>
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" variant="success" disabled={isSubmitting}>Save</Button></div>
      </form>
    </Modal>
  );
};

export default EditTransactionModal;