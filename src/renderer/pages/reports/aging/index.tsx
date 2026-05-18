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

  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  if (!agingSummary) return <div className="text-center p-8">No active debts found.</div>;

  const { buckets, totalOutstanding } = agingSummary;

  return (
    <div className="p-4">
      <div className="rounded-md shadow-md border p-4 bg-white">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2"><TrendingUp className="w-6 h-6 text-blue-600" /><h1 className="text-xl font-bold">Aging Analysis</h1></div>
          <ExportButton summary={agingSummary} />
        </div>

        <AgingFilterBar asOfDate={asOfDate} onAsOfDateChange={setAsOfDate} onRefresh={refresh} />

        <div className="mb-6">
          <AgingChart buckets={buckets} />
        </div>

        <div className="mb-4 p-3 bg-gray-100 rounded-md">
          <p className="text-sm">Total Outstanding: <span className="font-bold text-lg">{totalOutstanding.toLocaleString()} PHP</span></p>
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