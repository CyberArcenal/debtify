// src/renderer/pages/reports/debtor-stmt/components/StatementPrintable.tsx
import React from "react";
import type { StatementData } from "../types";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface StatementPrintableProps {
  statement: StatementData;
  companyName: string;
}

const StatementPrintable: React.FC<StatementPrintableProps> = ({ statement, companyName }) => {
  return (
    <div id="statement-print-area" className="p-8 print:p-0" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      {/* Header */}
      <div className="text-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold">{companyName}</h1>
        <p className="text-gray-500">Debtor Statement of Account</p>
        <p className="text-sm mt-2">As of {new Date().toLocaleDateString()}</p>
      </div>

      {/* Debtor Info */}
      <div className="mb-6 p-3 bg-gray-50 rounded">
        <h2 className="font-semibold text-lg">{statement.debtor.name}</h2>
        <div className="grid grid-cols-2 gap-2 text-sm mt-1">
          {statement.debtor.contact && <div><span className="text-gray-500">Contact:</span> {statement.debtor.contact}</div>}
          {statement.debtor.email && <div><span className="text-gray-500">Email:</span> {statement.debtor.email}</div>}
          {statement.debtor.address && <div className="col-span-2"><span className="text-gray-500">Address:</span> {statement.debtor.address}</div>}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        <div className="bg-blue-50 p-3 rounded text-center"><div className="text-xs text-gray-500">Total Borrowed</div><div className="font-bold">{formatCurrency(statement.summary.totalBorrowed)}</div></div>
        <div className="bg-green-50 p-3 rounded text-center"><div className="text-xs text-gray-500">Total Paid</div><div className="font-bold text-green-600">{formatCurrency(statement.summary.totalPaid)}</div></div>
        <div className="bg-red-50 p-3 rounded text-center"><div className="text-xs text-gray-500">Penalties</div><div className="font-bold text-red-600">{formatCurrency(statement.summary.totalPenalties)}</div></div>
        <div className="bg-purple-50 p-3 rounded text-center"><div className="text-xs text-gray-500">Outstanding</div><div className="font-bold">{formatCurrency(statement.summary.outstanding)}</div></div>
      </div>

      {/* Debts Table */}
      <h3 className="font-semibold text-lg mt-6 mb-2">Loan Details</h3>
      <table className="min-w-full border mb-6">
        <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left">Debt Name</th><th className="px-3 py-2 text-right">Total Amount</th><th className="px-3 py-2 text-right">Paid</th><th className="px-3 py-2 text-right">Remaining</th><th className="px-3 py-2 text-left">Due Date</th></tr></thead>
        <tbody>
          {statement.debts.map(d => (
            <tr key={d.id} className="border-t"><td className="px-3 py-1">{d.name}</td><td className="px-3 py-1 text-right">{formatCurrency(d.totalAmount)}</td><td className="px-3 py-1 text-right">{formatCurrency(d.paidAmount)}</td><td className="px-3 py-1 text-right">{formatCurrency(d.remainingAmount)}</td><td className="px-3 py-1">{formatDate(d.dueDate)}</td></tr>
          ))}
        </tbody>
      </table>

      {/* Payments Table */}
      <h3 className="font-semibold text-lg mt-6 mb-2">Payment History</h3>
      <table className="min-w-full border mb-6">
        <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Debt</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2 text-left">Reference</th></tr></thead>
        <tbody>
          {statement.payments.map(p => (
            <tr key={p.id} className="border-t"><td className="px-3 py-1">{formatDate(p.paymentDate)}</td><td className="px-3 py-1">{p.debt?.name || "—"}</td><td className="px-3 py-1 text-right">{formatCurrency(p.amount)}</td><td className="px-3 py-1">{p.reference || "—"}</td></tr>
          ))}
          {statement.payments.length === 0 && <tr><td colSpan={4} className="text-center py-2 text-gray-500">No payments recorded.</td></tr>}
        </tbody>
      </table>

      {/* Penalties Table */}
      <h3 className="font-semibold text-lg mt-6 mb-2">Penalties Incurred</h3>
      <table className="min-w-full border">
        <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Debt</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2 text-left">Reason</th></tr></thead>
        <tbody>
          {statement.penalties.map(p => (
            <tr key={p.id} className="border-t"><td className="px-3 py-1">{formatDate(p.penaltyDate)}</td><td className="px-3 py-1">{p.debt?.name || "—"}</td><td className="px-3 py-1 text-right">{formatCurrency(p.amount)}</td><td className="px-3 py-1">{p.reason || "—"}</td></tr>
          ))}
          {statement.penalties.length === 0 && <tr><td colSpan={4} className="text-center py-2 text-gray-500">No penalties recorded.</td></tr>}
        </tbody>
      </table>

      <div className="text-center text-xs text-gray-400 mt-8 pt-4 border-t">Generated by Debtify • {new Date().toLocaleString()}</div>
    </div>
  );
};

export default StatementPrintable;