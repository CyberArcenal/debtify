// src/renderer/pages/reports/aging/components/AgingSummaryTable.tsx
import React from "react";
import type { AgingBucket } from "../types";
import { formatCurrency } from "../../../../utils/formatters";

interface AgingSummaryTableProps {
  buckets: AgingBucket[];
  totalOutstanding: number;
  onBucketClick: (bucket: AgingBucket) => void;
}

const AgingSummaryTable: React.FC<AgingSummaryTableProps> = ({ buckets, totalOutstanding, onBucketClick }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border rounded-md" style={{ borderColor: "var(--border-color)" }}>
        <thead style={{ backgroundColor: "var(--card-secondary-bg)" }}>
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Bucket</th>
            <th className="px-4 py-2 text-right text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Count</th>
            <th className="px-4 py-2 text-right text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Amount</th>
            <th className="px-4 py-2 text-right text-sm font-medium" style={{ color: "var(--text-secondary)" }}>% of Total</th>
            <th className="px-4 py-2 text-center text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket, idx) => (
            <tr key={idx} className="border-t hover:bg-[var(--card-hover-bg)]" style={{ borderColor: "var(--border-color)" }}>
              <td className="px-4 py-2" style={{ color: "var(--text-primary)" }}>{bucket.range}</td>
              <td className="px-4 py-2 text-right" style={{ color: "var(--text-primary)" }}>{bucket.count}</td>
              <td className="px-4 py-2 text-right font-medium" style={{ color: "var(--success-color)" }}>{formatCurrency(bucket.totalAmount)}</td>
              <td className="px-4 py-2 text-right" style={{ color: "var(--text-primary)" }}>{bucket.percentage.toFixed(1)}%</td>
              <td className="px-4 py-2 text-center">
                <button onClick={() => onBucketClick(bucket)} className="text-sm underline" style={{ color: "var(--accent-blue)" }}>View Details</button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot style={{ backgroundColor: "var(--card-secondary-bg)", fontWeight: "bold" }}>
          <tr>
            <td className="px-4 py-2" style={{ color: "var(--text-primary)" }}>Total</td>
            <td className="px-4 py-2 text-right" style={{ color: "var(--text-primary)" }}>{buckets.reduce((s,b)=>s+b.count,0)}</td>
            <td className="px-4 py-2 text-right" style={{ color: "var(--text-primary)" }}>{formatCurrency(totalOutstanding)}</td>
            <td className="px-4 py-2 text-right" style={{ color: "var(--text-primary)" }}>100%</td>
            <td className="px-4 py-2"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default AgingSummaryTable;