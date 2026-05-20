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
    <div
      id="statement-print-area"
      className="p-8 print:p-0"
      style={{
        fontFamily: "'Segoe UI', Arial, sans-serif",
        backgroundColor: "var(--card-bg)",
        color: "var(--text-primary)",
      }}
    >
      {/* Header */}
      <div className="text-center mb-8 border-b pb-4" style={{ borderColor: "var(--border-color)" }}>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{companyName}</h1>
        <p style={{ color: "var(--text-secondary)" }}>Debtor Statement of Account</p>
        <p className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>As of {new Date().toLocaleDateString()}</p>
      </div>

      {/* Debtor Info */}
      <div className="mb-6 p-3 rounded" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
        <h2 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>{statement.debtor.name}</h2>
        <div className="grid grid-cols-2 gap-2 text-sm mt-1">
          {statement.debtor.contact && (
            <div><span style={{ color: "var(--text-secondary)" }}>Contact:</span> <span style={{ color: "var(--text-primary)" }}>{statement.debtor.contact}</span></div>
          )}
          {statement.debtor.email && (
            <div><span style={{ color: "var(--text-secondary)" }}>Email:</span> <span style={{ color: "var(--text-primary)" }}>{statement.debtor.email}</span></div>
          )}
          {statement.debtor.address && (
            <div className="col-span-2"><span style={{ color: "var(--text-secondary)" }}>Address:</span> <span style={{ color: "var(--text-primary)" }}>{statement.debtor.address}</span></div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        <div className="p-3 rounded text-center" style={{ backgroundColor: "var(--accent-blue-light)" }}>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>Total Borrowed</div>
          <div className="font-bold" style={{ color: "var(--accent-blue)" }}>{formatCurrency(statement.summary.totalBorrowed)}</div>
        </div>
        <div className="p-3 rounded text-center" style={{ backgroundColor: "var(--accent-green-light)" }}>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>Total Paid</div>
          <div className="font-bold" style={{ color: "var(--success-color)" }}>{formatCurrency(statement.summary.totalPaid)}</div>
        </div>
        <div className="p-3 rounded text-center" style={{ backgroundColor: "var(--accent-red-light)" }}>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>Penalties</div>
          <div className="font-bold" style={{ color: "var(--danger-color)" }}>{formatCurrency(statement.summary.totalPenalties)}</div>
        </div>
        <div className="p-3 rounded text-center" style={{ backgroundColor: "var(--accent-purple-light)" }}>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>Outstanding</div>
          <div className="font-bold" style={{ color: "var(--accent-purple)" }}>{formatCurrency(statement.summary.outstanding)}</div>
        </div>
      </div>

      {/* Debts Table */}
      <h3 className="font-semibold text-lg mt-6 mb-2" style={{ color: "var(--text-primary)" }}>Loan Details</h3>
      <table className="min-w-full border mb-6" style={{ borderColor: "var(--border-color)" }}>
        <thead style={{ backgroundColor: "var(--card-secondary-bg)" }}>
          <tr>
            <th className="px-3 py-2 text-left text-sm" style={{ color: "var(--text-secondary)" }}>Debt Name</th>
            <th className="px-3 py-2 text-right text-sm" style={{ color: "var(--text-secondary)" }}>Total Amount</th>
            <th className="px-3 py-2 text-right text-sm" style={{ color: "var(--text-secondary)" }}>Paid</th>
            <th className="px-3 py-2 text-right text-sm" style={{ color: "var(--text-secondary)" }}>Remaining</th>
            <th className="px-3 py-2 text-left text-sm" style={{ color: "var(--text-secondary)" }}>Due Date</th>
          </tr>
        </thead>
        <tbody>
          {statement.debts.map(d => (
            <tr key={d.id} className="border-t" style={{ borderColor: "var(--border-color)" }}>
              <td className="px-3 py-1" style={{ color: "var(--text-primary)" }}>{d.name}</td>
              <td className="px-3 py-1 text-right" style={{ color: "var(--text-primary)" }}>{formatCurrency(d.totalAmount)}</td>
              <td className="px-3 py-1 text-right" style={{ color: "var(--text-primary)" }}>{formatCurrency(d.paidAmount)}</td>
              <td className="px-3 py-1 text-right" style={{ color: "var(--debt-high)" }}>{formatCurrency(d.remainingAmount)}</td>
              <td className="px-3 py-1" style={{ color: "var(--text-primary)" }}>{formatDate(d.dueDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Payments Table */}
      <h3 className="font-semibold text-lg mt-6 mb-2" style={{ color: "var(--text-primary)" }}>Payment History</h3>
      <table className="min-w-full border mb-6" style={{ borderColor: "var(--border-color)" }}>
        <thead style={{ backgroundColor: "var(--card-secondary-bg)" }}>
          <tr>
            <th className="px-3 py-2 text-left text-sm" style={{ color: "var(--text-secondary)" }}>Date</th>
            <th className="px-3 py-2 text-left text-sm" style={{ color: "var(--text-secondary)" }}>Debt</th>
            <th className="px-3 py-2 text-right text-sm" style={{ color: "var(--text-secondary)" }}>Amount</th>
            <th className="px-3 py-2 text-left text-sm" style={{ color: "var(--text-secondary)" }}>Reference</th>
          </tr>
        </thead>
        <tbody>
          {statement.payments.map(p => (
            <tr key={p.id} className="border-t" style={{ borderColor: "var(--border-color)" }}>
              <td className="px-3 py-1" style={{ color: "var(--text-primary)" }}>{formatDate(p.paymentDate)}</td>
              <td className="px-3 py-1" style={{ color: "var(--text-primary)" }}>{p.debt?.name || "—"}</td>
              <td className="px-3 py-1 text-right font-medium" style={{ color: "var(--success-color)" }}>{formatCurrency(p.amount)}</td>
              <td className="px-3 py-1" style={{ color: "var(--text-primary)" }}>{p.reference || "—"}</td>
            </tr>
          ))}
          {statement.payments.length === 0 && (
            <tr><td colSpan={4} className="text-center py-2" style={{ color: "var(--text-tertiary)" }}>No payments recorded.</td></tr>
          )}
        </tbody>
      </table>

      {/* Penalties Table */}
      <h3 className="font-semibold text-lg mt-6 mb-2" style={{ color: "var(--text-primary)" }}>Penalties Incurred</h3>
      <table className="min-w-full border" style={{ borderColor: "var(--border-color)" }}>
        <thead style={{ backgroundColor: "var(--card-secondary-bg)" }}>
          <tr>
            <th className="px-3 py-2 text-left text-sm" style={{ color: "var(--text-secondary)" }}>Date</th>
            <th className="px-3 py-2 text-left text-sm" style={{ color: "var(--text-secondary)" }}>Debt</th>
            <th className="px-3 py-2 text-right text-sm" style={{ color: "var(--text-secondary)" }}>Amount</th>
            <th className="px-3 py-2 text-left text-sm" style={{ color: "var(--text-secondary)" }}>Reason</th>
          </tr>
        </thead>
        <tbody>
          {statement.penalties.map(p => (
            <tr key={p.id} className="border-t" style={{ borderColor: "var(--border-color)" }}>
              <td className="px-3 py-1" style={{ color: "var(--text-primary)" }}>{formatDate(p.penaltyDate)}</td>
              <td className="px-3 py-1" style={{ color: "var(--text-primary)" }}>{p.debt?.name || "—"}</td>
              <td className="px-3 py-1 text-right" style={{ color: "var(--danger-color)" }}>{formatCurrency(p.amount)}</td>
              <td className="px-3 py-1" style={{ color: "var(--text-primary)" }}>{p.reason || "—"}</td>
            </tr>
          ))}
          {statement.penalties.length === 0 && (
            <tr><td colSpan={4} className="text-center py-2" style={{ color: "var(--text-tertiary)" }}>No penalties recorded.</td></tr>
          )}
        </tbody>
      </table>

      <div className="text-center text-xs mt-8 pt-4 border-t" style={{ color: "var(--text-tertiary)", borderColor: "var(--border-color)" }}>
        Generated by Debtify • {new Date().toLocaleString()}
      </div>

      {/* Print styles – force black/white for printed version */}
      <style>{`
        @media print {
          body, #statement-print-area, * {
            background-color: white !important;
            color: black !important;
            border-color: #ccc !important;
          }
          .bg-blue-50, .bg-green-50, .bg-red-50, .bg-purple-50 {
            background-color: #f3f4f6 !important;
          }
          .text-green-600, .text-red-600 {
            color: #000 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StatementPrintable;