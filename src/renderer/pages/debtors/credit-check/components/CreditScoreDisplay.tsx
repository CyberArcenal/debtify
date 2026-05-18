// src/renderer/pages/debtors/credit-check/components/CreditScoreDisplay.tsx
import React from "react";
import { AlertTriangle } from "lucide-react";
import type { CreditScore } from "../types";

interface CreditScoreDisplayProps {
  score: CreditScore | null;
  checking: boolean;
  onCheck: () => void;
  debtorName?: string;
}

const CreditScoreDisplay: React.FC<CreditScoreDisplayProps> = ({ score, checking, onCheck, debtorName }) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low": return "text-green-500 bg-green-500/10";
      case "Medium": return "text-yellow-500 bg-yellow-500/10";
      case "High": return "text-red-500 bg-red-500/10";
      default: return "text-gray-500 bg-gray-500/10";
    }
  };

  const getScoreColor = (scoreNum: number) => {
    if (scoreNum >= 700) return "text-green-500";
    if (scoreNum >= 500) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="rounded-md border p-4" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
      <h3 className="font-semibold mb-3" style={{ color: "var(--sidebar-text)" }}>2. Credit Check</h3>
      {!debtorName ? (
        <div className="text-center py-6 text-[var(--text-tertiary)]">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Select a debtor to perform credit check.</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm text-[var(--text-secondary)]">Debtor: <span className="font-semibold">{debtorName}</span></p>
          </div>
          <button
            onClick={onCheck}
            disabled={checking}
            className="w-full py-2 rounded-md bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white transition-colors mb-4"
          >
            {checking ? "Checking credit..." : "Run Credit Check"}
          </button>

          {score && (
            <div className="mt-4 space-y-3">
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(score.score)}`}>{score.score}</div>
                <div className="text-sm text-[var(--text-tertiary)]">Credit Score (300-850)</div>
              </div>
              <div className="flex justify-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(score.riskLevel)}`}>
                  {score.riskLevel} Risk
                </span>
              </div>
              <div className="p-2 rounded bg-[var(--card-bg)] text-sm">
                <p className="text-[var(--sidebar-text)]">{score.remarks}</p>
              </div>
              <div className="text-xs text-[var(--text-tertiary)] text-center">
                Last checked: {new Date(score.dateChecked).toLocaleString()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CreditScoreDisplay;