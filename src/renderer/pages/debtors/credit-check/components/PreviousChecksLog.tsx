// src/renderer/pages/debtors/credit-check/components/PreviousChecksLog.tsx
import React from "react";
import { History, Clock } from "lucide-react";
import { formatDate } from "../../../../utils/formatters";
import type { CreditCheckLog } from "../../../../api/core/credit_check";

interface PreviousChecksLogProps {
  logs: CreditCheckLog[];
  loading: boolean;
}

const PreviousChecksLog: React.FC<PreviousChecksLogProps> = ({ logs, loading }) => {
  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "Low": return "bg-green-500/20 text-green-500";
      case "Medium": return "bg-yellow-500/20 text-yellow-500";
      case "High": return "bg-red-500/20 text-red-500";
      default: return "bg-gray-500/20 text-gray-500";
    }
  };

  return (
    <div className="rounded-md border p-4" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
      <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
        <History className="w-4 h-4" /> Previous Credit Checks
      </h3>
      {loading ? (
        <div className="text-center py-4" style={{ color: "var(--text-tertiary)" }}>Loading history...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-4" style={{ color: "var(--text-tertiary)" }}>No previous credit checks found.</div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
          {logs.map((log) => (
            <div key={log.id} className="p-2 rounded border" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium" style={{ color: "var(--text-primary)" }}>{log.debtorName}</div>
                  <div className="text-xs flex items-center gap-1 mt-1" style={{ color: "var(--text-tertiary)" }}>
                    <Clock className="w-3 h-3" />
                    {formatDate(log.dateChecked || log.createdAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${log.score >= 700 ? "text-green-500" : log.score >= 500 ? "text-yellow-500" : "text-red-500"}`}>
                    {log.score}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getRiskBadge(log.riskLevel)}`}>
                    {log.riskLevel}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PreviousChecksLog;