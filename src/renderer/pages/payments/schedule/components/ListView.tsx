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
    const date = p.dueDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(p);
    return acc;
  }, {} as Record<string, ScheduledPayment[]>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedByDate).map(([date, dayPayments]) => (
        <div key={date} className="border rounded-md overflow-hidden" style={{ borderColor: "var(--border-color)" }}>
          <div className="px-4 py-2 bg-gray-50 font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4" /> {formatDate(date)}
          </div>
          <table className="min-w-full">
            <thead className="bg-white">
              <tr><th className="px-4 py-2 text-left text-xs font-medium">Debtor</th><th className="px-4 py-2 text-left text-xs font-medium">Debt</th><th className="px-4 py-2 text-right text-xs font-medium">Amount Due</th><th className="px-4 py-2 text-right text-xs font-medium">Action</th></tr>
            </thead>
            <tbody>
              {dayPayments.map(p => (
                <tr key={p.debtId} className="border-t">
                  <td className="px-4 py-2"><div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" />{p.borrowerName}</div></td>
                  <td className="px-4 py-2">{p.debtName}</td>
                  <td className="px-4 py-2 text-right font-medium text-green-600">{formatCurrency(p.amountDue)}</td>
                  <td className="px-4 py-2 text-right"><button onClick={() => onMarkPaid(p)} className="px-2 py-1 rounded bg-green-500 text-white text-sm flex items-center gap-1 ml-auto"><CreditCard className="w-3 h-3" /> Mark Paid</button></td>
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