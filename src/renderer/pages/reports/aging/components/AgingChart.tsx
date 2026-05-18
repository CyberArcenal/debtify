// src/renderer/pages/reports/aging/components/AgingChart.tsx
import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import type { AgingBucket } from "../types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AgingChartProps {
  buckets: AgingBucket[];
}

const AgingChart: React.FC<AgingChartProps> = ({ buckets }) => {
  const data = {
    labels: buckets.map(b => b.range),
    datasets: [
      {
        label: "Outstanding Amount (PHP)",
        data: buckets.map(b => b.totalAmount),
        backgroundColor: "rgba(14, 157, 124, 0.6)",
        borderColor: "rgba(14, 157, 124, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Aging Summary by Bucket" },
      tooltip: { callbacks: { label: (ctx: any) => `₱${ctx.raw.toLocaleString()}` } },
    },
    scales: { y: { ticks: { callback: (value: any) => `₱${value.toLocaleString()}` } } },
  };

  return (
    <div className="w-full h-80">
      <Bar data={data} options={options} />
    </div>
  );
};

export default AgingChart;