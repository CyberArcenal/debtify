// src/renderer/pages/reports/expected/components/ExpectedChart.tsx
import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { ExpectedReport } from "../types";
import { formatCurrency } from "../../../../utils/formatters";

interface ExpectedChartProps {
  report: ExpectedReport;
}

const ExpectedChart: React.FC<ExpectedChartProps> = ({ report }) => {
  const data = report.data.map(d => ({ period: d.date, amount: d.amount }));
  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <h3 className="font-semibold mb-3">Expected Payments by {report.groupBy}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" angle={-45} textAnchor="end" height={60} />
          <YAxis tickFormatter={(v) => formatCurrency(v)} width={80} />
          <Tooltip formatter={(v: number) => formatCurrency(v)} />
          <Legend />
          <Bar dataKey="amount" fill="#0e9d7c" name="Expected Amount" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpectedChart;