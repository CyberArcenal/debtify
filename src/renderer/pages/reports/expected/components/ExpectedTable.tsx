// src/renderer/pages/reports/expected/components/ExpectedTable.tsx
import React, { useState } from "react";
import type { ExpectedReport, ExpectedPayment } from "../types";
import { formatCurrency } from "../../../../utils/formatters";

interface ExpectedTableProps {
  report: ExpectedReport;
  onRowClick?: (details: ExpectedPayment["details"]) => void;
}

const ExpectedTable: React.FC<ExpectedTableProps> = ({ report, onRowClick }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border rounded-md">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium">{report.groupBy === "day" ? "Date" : report.groupBy === "week" ? "Week" : "Month"}</th>
            <th className="px-4 py-2 text-right text-xs font-medium">Expected Amount</th>
            <th className="px-4 py-2 text-center text-xs font-medium">Debtors</th>
            <th className="px-4 py-2 text-center text-xs font-medium">Debts</th>
            <th className="px-4 py-2 text-center text-xs font-medium">Details</th>
          </tr>
        </thead>
        <tbody>
          {report.data.map(item => (
            <tr key={item.date} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">{item.date}</td>
              <td className="px-4 py-2 text-right font-medium text-green-600">{formatCurrency(item.amount)}</td>
              <td className="px-4 py-2 text-center">{item.debtorCount}</td>
              <td className="px-4 py-2 text-center">{item.debtCount}</td>
              <td className="px-4 py-2 text-center">
                <button onClick={() => onRowClick?.(item.details)} className="text-blue-600 text-sm hover:underline">View</button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-100 font-semibold">
          <tr><td className="px-4 py-2">Total</td><td className="px-4 py-2 text-right">{formatCurrency(report.totalExpected)}</td><td className="px-4 py-2 text-center">-</td><td className="px-4 py-2 text-center">-</td><td className="px-4 py-2"/></tr>
        </tfoot>
      </table>
    </div>
  );
};

export default ExpectedTable;