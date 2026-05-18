// src/renderer/pages/reports/collection/components/CollectionChart.tsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { CollectionDataPoint } from "../types";
import { formatCurrency } from "../../../../utils/formatters";

interface CollectionChartProps {
  data: CollectionDataPoint[];
}

const CollectionChart: React.FC<CollectionChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <h3 className="font-semibold mb-3">Collection Trend</h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
          <YAxis tickFormatter={(value) => formatCurrency(value)} width={80} />
          <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(label) => `Date: ${label}`} />
          <Legend />
          <Line type="monotone" dataKey="actualCollected" stroke="#10b981" name="Actual Collected" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="expectedCollected" stroke="#3b82f6" name="Expected Collection" strokeWidth={2} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CollectionChart;