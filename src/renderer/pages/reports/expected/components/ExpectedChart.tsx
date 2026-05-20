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
    <div className="rounded-lg border p-4 shadow-sm" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
      <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Expected Payments by {report.groupBy}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="period" angle={-45} textAnchor="end" height={60} tick={{ fill: "var(--text-secondary)" }} />
          <YAxis tickFormatter={(v) => formatCurrency(v)} width={80} tick={{ fill: "var(--text-secondary)" }} />
          <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
          <Legend wrapperStyle={{ color: "var(--text-primary)" }} />
          <Bar dataKey="amount" fill="var(--primary-color)" name="Expected Amount" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpectedChart;