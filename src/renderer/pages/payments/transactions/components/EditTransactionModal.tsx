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
      reset({
        amount: transaction.amount,
        paymentDate: transaction.paymentDate.slice(0, 10),
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Transaction" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div><label className="block text-sm font-medium mb-1">Amount</label><input type="number" step="0.01" {...register("amount", { required: true, valueAsNumber: true })} className="w-full px-3 py-2 border rounded" /></div>
        <div><label className="block text-sm font-medium mb-1">Payment Date</label><input type="date" {...register("paymentDate", { required: true })} className="w-full px-3 py-2 border rounded" /></div>
        <div><label className="block text-sm font-medium mb-1">Reference</label><input {...register("reference")} className="w-full px-3 py-2 border rounded" /></div>
        <div><label className="block text-sm font-medium mb-1">Notes</label><textarea {...register("notes")} rows={2} className="w-full px-3 py-2 border rounded" /></div>
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" variant="success" disabled={isSubmitting}>Save</Button></div>
      </form>
    </Modal>
  );
};

export default EditTransactionModal;