// src/renderer/pages/loans/overdue/components/SendReminderModal.tsx
import React, { useState } from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import { dialogs } from "../../../../utils/dialogs";
import notificationAPI from "../../../../api/core/notification";
import type { OverdueLoan } from "../hooks/useOverdueLoans";

interface SendReminderModalProps {
  isOpen: boolean;
  loan: OverdueLoan | null;
  onClose: () => void;
  onSuccess: () => void;
}

const SendReminderModal: React.FC<SendReminderModalProps> = ({ isOpen, loan, onClose, onSuccess }) => {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (loan) {
      setMessage(`Dear ${loan.borrower?.name},\n\nYour loan "${loan.name}" is overdue by ${loan.daysOverdue} days. Remaining balance: ${loan.remainingAmount}. Please make a payment as soon as possible to avoid additional penalties.\n\nThank you.`);
    }
  }, [loan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;
    setSubmitting(true);
    try {
      await notificationAPI.create({
        title: `Overdue Reminder: ${loan.name}`,
        message,
        type: "overdue",
        debtId: loan.id,
        scheduledFor: null,
      });
      dialogs.success("Reminder sent successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Overdue Reminder" size="md">
      {loan && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-red-50 p-3 rounded-md"><p><strong>To:</strong> {loan.borrower?.name} ({loan.borrower?.email || loan.borrower?.contact})</p><p><strong>Debt:</strong> {loan.name}</p><p><strong>Overdue:</strong> {loan.daysOverdue} days</p></div>
          <div><label className="block text-sm font-medium mb-1">Reminder Message</label><textarea rows={5} required value={message} onChange={(e) => setMessage(e.target.value)} className="w-full px-3 py-2 border rounded-md" /></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" variant="primary" disabled={submitting}>{submitting ? "Sending..." : "Send Reminder"}</Button></div>
        </form>
      )}
    </Modal>
  );
};

export default SendReminderModal;