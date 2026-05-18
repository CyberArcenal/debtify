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
      <table className="min-w-full border rounded-md">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium">Bucket</th>
            <th className="px-4 py-2 text-right text-sm font-medium">Count</th>
            <th className="px-4 py-2 text-right text-sm font-medium">Amount</th>
            <th className="px-4 py-2 text-right text-sm font-medium">% of Total</th>
            <th className="px-4 py-2 text-center text-sm font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket, idx) => (
            <tr key={idx} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">{bucket.range}</td>
              <td className="px-4 py-2 text-right">{bucket.count}</td>
              <td className="px-4 py-2 text-right font-medium text-green-600">{formatCurrency(bucket.totalAmount)}</td>
              <td className="px-4 py-2 text-right">{bucket.percentage.toFixed(1)}%</td>
              <td className="px-4 py-2 text-center">
                <button onClick={() => onBucketClick(bucket)} className="text-blue-600 hover:underline text-sm">
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-100 font-semibold">
          <tr>
            <td className="px-4 py-2">Total</td>
            <td className="px-4 py-2 text-right">{buckets.reduce((s,b)=>s+b.count,0)}</td>
            <td className="px-4 py-2 text-right">{formatCurrency(totalOutstanding)}</td>
            <td className="px-4 py-2 text-right">100%</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default AgingSummaryTable;