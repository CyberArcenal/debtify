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
      ["Bucket", "Count", "Amount (PHP)", "Percentage"],
    ];
    summary.buckets.forEach(b => {
      rows.push([b.range, b.count.toString(), b.totalAmount.toString(), `${b.percentage.toFixed(2)}%`]);
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
    <button onClick={handleExportCSV} className="px-3 py-2 rounded flex items-center gap-1" style={{ backgroundColor: "var(--primary-color)", color: "white" }}>
      <Download className="w-4 h-4" /> Export Summary
    </button>
  );
};

export default ExportButton;