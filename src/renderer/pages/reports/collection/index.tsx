// src/renderer/pages/reports/collection/index.tsx
import React from "react";
import { BarChart3 } from "lucide-react";
import useCollectionReport from "./hooks/useCollectionReport";
import FilterBar from "./components/FilterBar";
import KPICards from "./components/KPICards";
import CollectionChart from "./components/CollectionChart";
import PaymentsTable from "./components/PaymentsTable";

const CollectionReportPage: React.FC = () => {
  const { loading, error, period, target, report, updatePeriod, updateTarget, refresh } = useCollectionReport();

  if (error) return <div className="p-4 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <div className="rounded-md shadow-md border p-4 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold">Collection Report</h1>
        </div>

        <FilterBar
          fromDate={period.from}
          toDate={period.to}
          target={target}
          onFromDateChange={(date) => updatePeriod(date, period.to)}
          onToDateChange={(date) => updatePeriod(period.from, date)}
          onTargetChange={updateTarget}
          onRefresh={refresh}
          loading={loading}
        />

        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : report ? (
          <>
            <KPICards
              totalActual={report.totalActual}
              totalExpected={report.totalExpected}
              collectionRate={report.collectionRate}
              averagePerDay={report.averagePerDay}
            />
            <div className="mb-6">
              <CollectionChart data={report.dataPoints} />
            </div>
            <PaymentsTable payments={report.paymentsByDebtor} />
          </>
        ) : (
          <div className="text-center py-8">No data available.</div>
        )}
      </div>
    </div>
  );
};

export default CollectionReportPage;