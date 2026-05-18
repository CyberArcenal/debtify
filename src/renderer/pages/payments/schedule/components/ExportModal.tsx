// src/renderer/pages/payments/schedule/components/ExportModal.tsx
import React, { useState } from "react";
import Modal from "../../../../components/UI/Modal";
import Button from "../../../../components/UI/Button";
import type { ScheduledPayment } from "../types";

interface ExportModalProps {
  isOpen: boolean;
  payments: ScheduledPayment[];
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, payments, onClose }) => {
  const [format, setFormat] = useState<"csv" | "json">("csv");

  const handleExport = () => {
    if (format === "csv") {
      const headers = ["Due Date", "Borrower", "Debt Name", "Amount Due", "Contact", "Email"];
      const rows = payments.map(p => [
        p.dueDate,
        p.borrowerName,
        p.debtName,
        p.amountDue.toString(),
        p.contact || "",
        p.email || "",
      ]);
      const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payment_schedule_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const data = JSON.stringify(payments, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payment_schedule_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Payment Schedule" size="sm">
      <div className="space-y-4">
        <div><label className="block text-sm font-medium mb-1">Export Format</label><select value={format} onChange={(e) => setFormat(e.target.value as any)} className="w-full px-3 py-2 border rounded-md"><option value="csv">CSV</option><option value="json">JSON</option></select></div>
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={handleExport}>Export</Button></div>
      </div>
    </Modal>
  );
};

export default ExportModal;