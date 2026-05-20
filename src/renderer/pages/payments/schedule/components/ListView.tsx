// src/renderer/pages/payments/schedule/components/ListView.tsx
import React from "react";
import { Calendar, User, DollarSign, CreditCard } from "lucide-react";
import type { ScheduledPayment } from "../types";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface ListViewProps {
  payments: ScheduledPayment[];
  onMarkPaid: (payment: ScheduledPayment) => void;
}

const ListView: React.FC<ListViewProps> = ({ payments, onMarkPaid }) => {
  const groupedByDate = payments.reduce((acc, p) => {
    // Convert dueDate to YYYY-MM-DD string
    let dateKey: string;
    if (typeof p.dueDate === 'string') {
      dateKey = p.dueDate.slice(0, 10);
    } else if (p.dueDate instanceof Date) {
      dateKey = p.dueDate.toISOString().slice(0, 10);
    } else {
      return acc;
    }
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(p);
    return acc;
  }, {} as Record<string, ScheduledPayment[]>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedByDate).map(([date, dayPayments]) => (
        <div key={date} className="border rounded-md overflow-hidden" style={{ borderColor: "var(--border-color)" }}>
          <div className="px-4 py-2 font-semibold flex items-center gap-2" style={{ backgroundColor: "var(--card-secondary-bg)", color: "var(--text-primary)" }}>
            <Calendar className="w-4 h-4" style={{ color: "var(--primary-color)" }} /> {formatDate(date)}
          </div>
          <table className="min-w-full">
            <thead style={{ backgroundColor: "var(--card-bg)" }}>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Debtor</th>
                <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Debt</th>
                <th className="px-4 py-2 text-right text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Amount Due</th>
                <th className="px-4 py-2 text-right text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {dayPayments.map(p => (
                <tr key={p.debtId} className="border-t" style={{ borderColor: "var(--border-color)" }}>
                  <td className="px-4 py-2"><div className="flex items-center gap-2"><User className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} /><span style={{ color: "var(--text-primary)" }}>{p.borrowerName}</span></div></td>
                  <td className="px-4 py-2" style={{ color: "var(--text-primary)" }}>{p.debtName}</td>
                  <td className="px-4 py-2 text-right font-medium" style={{ color: "var(--success-color)" }}>{formatCurrency(p.amountDue)}</td>
                  <td className="px-4 py-2 text-right"><button onClick={() => onMarkPaid(p)} className="px-2 py-1 rounded text-white text-sm flex items-center gap-1 ml-auto" style={{ backgroundColor: "var(--success-color)" }}><CreditCard className="w-3 h-3" /> Mark Paid</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default ListView;