// src/renderer/pages/reports/aging/index.tsx
import React, { useState } from "react";
import { TrendingUp, RefreshCw } from "lucide-react";
import useAgingAnalysis from "./hooks/useAgingAnalysis";
import AgingFilterBar from "./components/AgingFilterBar";
import AgingChart from "./components/AgingChart";
import AgingSummaryTable from "./components/AgingSummaryTable";
import BucketDrillDownModal from "./components/BucketDrillDownModal";
import ExportButton from "./components/ExportButton";
import type { AgingBucket } from "./types";

const AgingAnalysisPage: React.FC = () => {
  const { loading, error, asOfDate, setAsOfDate, agingSummary, refresh } = useAgingAnalysis();
  const [selectedBucket, setSelectedBucket] = useState<AgingBucket | null>(null);

  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--primary-color)" }}></div></div>;
  if (error) return <div className="text-center p-8" style={{ color: "var(--danger-color)" }}>Error: {error}</div>;
  if (!agingSummary) return <div className="text-center p-8" style={{ color: "var(--text-secondary)" }}>No active debts found.</div>;

  const { buckets, totalOutstanding } = agingSummary;

  return (
    <div className="p-4" style={{ backgroundColor: "var(--background-color)" }}>
      <div className="rounded-md shadow-md border p-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6" style={{ color: "var(--primary-color)" }} />
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Aging Analysis</h1>
          </div>
          <ExportButton summary={agingSummary} />
        </div>

        <AgingFilterBar asOfDate={asOfDate} onAsOfDateChange={setAsOfDate} onRefresh={refresh} />

        <div className="mb-6">
          <AgingChart buckets={buckets} />
        </div>

        <div className="mb-4 p-3 rounded-md" style={{ backgroundColor: "var(--card-secondary-bg)", border: `1px solid var(--border-color)` }}>
          <p className="text-sm" style={{ color: "var(--text-primary)" }}>Total Outstanding: <span className="font-bold text-lg" style={{ color: "var(--debt-high)" }}>{totalOutstanding.toLocaleString()} PHP</span></p>
        </div>

        <AgingSummaryTable buckets={buckets} totalOutstanding={totalOutstanding} onBucketClick={setSelectedBucket} />
      </div>

      <BucketDrillDownModal
        isOpen={!!selectedBucket}
        bucketName={selectedBucket?.range || ""}
        debts={selectedBucket?.debts || []}
        onClose={() => setSelectedBucket(null)}
      />
    </div>
  );
};

export default AgingAnalysisPage;