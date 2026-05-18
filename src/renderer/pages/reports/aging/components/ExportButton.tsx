// src/renderer/pages/reports/aging/components/ExportButton.tsx
import React from "react";
import { Download } from "lucide-react";
import { dialogs } from "../../../../utils/dialogs";
import type { AgingBucket } from "../types";

interface ExportButtonProps {
  summary: { asOfDate: string; totalOutstanding: number; buckets: AgingBucket[] };
}

const ExportButton: React.FC<ExportButtonProps> = ({ summary }) => {
  const handleExportCSV = () => {
    const rows = [
      ["Aging Analysis Report"],
      [`As of: ${summary.asOfDate}`],
      [`Total Outstanding: ${summary.totalOutstanding}`],
      [],
      ["Bucket", "Count", "Amount", "Percentage"],
    ];
    summary.buckets.forEach(b => {
      rows.push([b.range, b.count.toString(), b.totalAmount.toString(), `${b.percentage.toFixed(2)}%`]);
    });
    rows.push([], ["DETAILS PER BUCKET"]);
    summary.buckets.forEach(b => {
      rows.push([`${b.range} - Debts:`]);
      rows.push(["Debt Name", "Borrower", "Amount", "Due Date"]);
      b.debts.forEach(d => {
        rows.push([d.name, d.borrower?.name || "", d.remainingAmount.toString(), d.dueDate]);
      });
      rows.push([]);
    });
    const csvContent = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aging_analysis_${summary.asOfDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    dialogs.success("Export completed");
  };

  return (
    <button onClick={handleExportCSV} className="px-3 py-2 bg-green-600 text-white rounded flex items-center gap-1">
      <Download className="w-4 h-4" /> Export CSV
    </button>
  );
};

export default ExportButton;