// src/renderer/pages/reports/collection/components/KPICards.tsx
import React from "react";
import { DollarSign, TrendingUp, Calendar, Target } from "lucide-react";
import { formatCurrency } from "../../../../utils/formatters";

interface KPICardsProps {
  totalActual: number;
  totalExpected: number;
  collectionRate: number;
  averagePerDay: number;
}

const KPICards: React.FC<KPICardsProps> = ({ totalActual, totalExpected, collectionRate, averagePerDay }) => {
  const cards = [
    { title: "Total Collected", value: formatCurrency(totalActual), icon: DollarSign, color: "var(--success-color)" },
    { title: "Expected Collection", value: formatCurrency(totalExpected), icon: Target, color: "var(--accent-blue)" },
    { title: "Collection Rate", value: `${collectionRate.toFixed(1)}%`, icon: TrendingUp, color: "var(--accent-purple)" },
    { title: "Average Per Day", value: formatCurrency(averagePerDay), icon: Calendar, color: "var(--warning-color)" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => (
        <div key={idx} className="rounded-lg border p-4 shadow-sm" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{card.title}</p>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{card.value}</p>
            </div>
            <card.icon className="w-8 h-8" style={{ color: card.color }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPICards;