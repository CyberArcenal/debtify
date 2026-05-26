import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HandCoins,
  Users,
  AlertTriangle,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  Eye,
  Plus,
  ArrowUp,
  ArrowDown,
  Target,
  Wallet,
  UserCheck,
  Percent,
  PieChart,
  Activity,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  useDebtDashboardData,
  type DebtDashboardData,
} from "../hooks/useDebtDashboardData";
import { formatCurrency } from "../../../utils/formatters";
import DebtorViewDialog from "../../debtors/components/DebtorViewDialog";
import { AuditViewDialog } from "../../AuditTrail/components/AuditViewDialog";
import { useAuditView } from "../../AuditTrail/hooks/useAuditView";
import auditAPI from "../../../api/core/audit";
import { hideLoading, showError, showLoading } from "../../../utils/notification";

// ==================== Subcomponents ====================

const KPICard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  onClick?: () => void;
  badge?: { text: string; color: string };
  footer?: React.ReactNode;
}> = ({ title, value, icon, color, bgColor, onClick, badge, footer }) => (
  <div
    className="compact-card rounded-lg p-4 hover:shadow-md group cursor-pointer"
    style={{
      background: "var(--card-secondary-bg)",
      border: "1px solid var(--border-color)",
    }}
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 rounded-lg" style={{ background: bgColor }}>
        {icon}
      </div>
      {badge && (
        <div
          className="text-xs font-medium px-1.5 py-0.5 rounded-full"
          style={{ background: badge.color + "20", color: badge.color }}
        >
          {badge.text}
        </div>
      )}
    </div>
    <h3
      className="text-xl font-bold mb-0.5"
      style={{ color: "var(--sidebar-text)" }}
    >
      {value}
    </h3>
    <p className="text-xs" style={{ color: "var(--sidebar-text)" }}>
      {title}
    </p>
    {footer && (
      <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
        {footer}
      </div>
    )}
  </div>
);

const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const actions = [
    {
      label: "Debtors",
      path: "/debtors/list",
      icon: Users,
      color: "var(--accent-blue)",
    },
    {
      label: "New Loan",
      path: "/loans/applications",
      icon: Plus,
      color: "var(--accent-green)",
    },
    {
      label: "Record Payment",
      path: "/payments/transactions",
      icon: Wallet,
      color: "#f97316",
    },
    {
      label: "Reports",
      path: "/reports/collection",
      icon: Target,
      color: "var(--accent-purple)",
    },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((action, idx) => (
        <Link
          key={idx}
          to={action.path}
          className="compact-card rounded-lg p-4 flex flex-col items-center justify-center transition-transform hover:scale-105 group"
          style={{ background: action.color, border: "1px solid transparent" }}
        >
          <action.icon className="w-6 h-6 mb-2 text-white" />
          <span className="text-xs font-medium text-white">{action.label}</span>
        </Link>
      ))}
    </div>
  );
};

const AgingBuckets: React.FC<{
  buckets: DebtDashboardData["agingBuckets"];
  onClick: () => void;
}> = ({ buckets, onClick }) => (
  <div
    className="compact-card rounded-lg p-4 hover:shadow-md cursor-pointer"
    style={{
      background: "var(--card-secondary-bg)",
      border: "1px solid var(--border-color)",
    }}
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-4">
      <h3
        className="font-semibold flex items-center gap-1.5"
        style={{ color: "var(--sidebar-text)" }}
      >
        <PieChart className="w-4 h-4" /> Aging Analysis
      </h3>
    </div>
    <div className="space-y-2">
      {Object.entries(buckets).map(([key, bucket]) => {
        let label = "";
        if (key === "current") label = "Current (<30d)";
        else if (key === "days30") label = "30-60 days";
        else if (key === "days60") label = "60-90 days";
        else label = "90+ days";
        let color = "var(--accent-green)";
        if (key === "days30") color = "#f59e0b";
        if (key === "days60") color = "#f97316";
        if (key === "days90plus") color = "var(--accent-red)";
        return (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span
                className="text-xs"
                style={{ color: "var(--sidebar-text)" }}
              >
                {label}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs font-medium"
                style={{ color: "var(--sidebar-text)" }}
              >
                {formatCurrency(bucket.amount)}
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  background: "var(--card-bg)",
                  color: "var(--text-secondary)",
                }}
              >
                {bucket.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const TopDebtorsList: React.FC<{
  debtors: DebtDashboardData["topDebtors"];
  onViewAll: () => void;
  onSelect: (id: number) => void;
}> = ({ debtors, onViewAll, onSelect }) => (
  <div
    className="compact-card rounded-lg p-4 hover:shadow-md"
    style={{
      background: "var(--card-secondary-bg)",
      border: "1px solid var(--border-color)",
    }}
  >
    <div className="flex items-center justify-between mb-4">
      <h3
        className="font-semibold flex items-center gap-1.5"
        style={{ color: "var(--sidebar-text)" }}
      >
        <Users className="w-4 h-4" /> Top Debtors
      </h3>
      <button
        onClick={onViewAll}
        className="text-xs hover:underline"
        style={{ color: "var(--primary-color)" }}
      >
        View all <ChevronRight className="w-3 h-3 inline" />
      </button>
    </div>
    <div className="space-y-3">
      {debtors.map((debtor) => (
        <div
          key={debtor.id}
          className="flex justify-between items-center p-2 rounded-md hover:bg-[var(--card-hover-bg)] cursor-pointer"
          onClick={() => onSelect(debtor.id)}
        >
          <div>
            <div
              className="font-medium text-sm"
              style={{ color: "var(--sidebar-text)" }}
            >
              {debtor.name}
            </div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {debtor.daysOverdue > 0
                ? `${debtor.daysOverdue} days overdue`
                : "Current"}
            </div>
          </div>
          <div className="text-right">
            <div
              className="text-sm font-bold"
              style={{
                color:
                  debtor.daysOverdue > 0
                    ? "var(--accent-red)"
                    : "var(--sidebar-text)",
              }}
            >
              {formatCurrency(debtor.outstanding)}
            </div>
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              outstanding
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RecentActivitiesList: React.FC<{
  activities: DebtDashboardData["recentActivities"];
  onViewAll: () => void;
  onSelect: (id: number) => void;
}> = ({ activities, onViewAll, onSelect }) => (
  <div
    className="compact-card rounded-lg p-4"
    style={{
      background: "var(--card-secondary-bg)",
      border: "1px solid var(--border-color)",
    }}
  >
    <div className="flex items-center justify-between mb-4">
      <h3
        className="font-semibold flex items-center gap-1.5"
        style={{ color: "var(--sidebar-text)" }}
      >
        <Activity className="w-4 h-4" /> Recent Activities
      </h3>
      <button
        onClick={onViewAll}
        className="text-xs hover:underline"
        style={{ color: "var(--primary-color)" }}
      >
        View all <ChevronRight className="w-3 h-3 inline" />
      </button>
    </div>
    <div className="space-y-3">
      {activities.slice(0, 4).map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-2 rounded-md hover:bg-[var(--card-hover-bg)] cursor-pointer"
          onClick={() => onSelect(activity.id)}
        >
          <div className="relative mt-0.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: activity.action.includes("Payment")
                  ? "var(--accent-green)"
                  : activity.action.includes("Overdue")
                    ? "var(--accent-red)"
                    : "var(--primary-color)",
              }}
            />
          </div>
          <div className="flex-1">
            <div className="flex justify-between">
              <p
                className="text-sm font-medium"
                style={{ color: "var(--sidebar-text)" }}
              >
                {activity.action}
              </p>
              <span
                className="text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                {new Date(activity.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-xs" style={{ color: "var(--sidebar-text)" }}>
              {activity.details}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              by {activity.user}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ==================== Main Component ====================

const DebtDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useDebtDashboardData();
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingDebtor, setViewingDebtor] = useState<any>(null);
  const viewAuditDialog = useAuditView();

  const openView = (debtor: any) => {
    setViewingDebtor(debtor);
    setViewOpen(true);
  };

  if (loading) {
    return (
      <div
        className="compact-card rounded-lg"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
        }}
      >
        <div className="flex justify-center items-center h-48">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-3"
              style={{ borderColor: "var(--primary-color)" }}
            />
            <p className="text-sm" style={{ color: "var(--sidebar-text)" }}>
              Loading debt dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="compact-card rounded-lg"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
        }}
      >
        <div
          className="text-center p-6"
          style={{ color: "var(--danger-color)" }}
        >
          <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
          <p className="text-base font-semibold mb-1">
            Error Loading Dashboard
          </p>
          <p className="text-sm mb-3">{error || "Unknown error"}</p>
          <button
            onClick={refetch}
            className="btn btn-primary btn-sm rounded-md flex items-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    totalOutstanding,
    overdueAmount,
    collectionRate,
    activeDebtors,
    currentPeriod,
    agingBuckets,
    topDebtors,
    recentActivities,
    stats,
    metadata,
  } = data;

  return (
    <div className="space-y-4 transition-all duration-300 ease-in-out m-1">
      {/* Header */}
      <div
        className="compact-card rounded-lg"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
        }}
      >
        <div className="flex justify-between items-center p-4">
          <div>
            <h2
              className="text-lg font-semibold flex items-center gap-1.5"
              style={{ color: "var(--sidebar-text)" }}
            >
              <div
                className="w-1.5 h-5 rounded-full"
                style={{ backgroundColor: "var(--primary-color)" }}
              />
              Debt Management Dashboard
            </h2>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Overview - {metadata.period}
              <span
                className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  background: "var(--card-secondary-bg)",
                  color: "var(--primary-color)",
                }}
              >
                {new Date(metadata.periodStart).toLocaleDateString()} -{" "}
                {new Date(metadata.periodEnd).toLocaleDateString()}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refetch}
              className="btn btn-secondary btn-sm rounded-md flex items-center"
              style={{
                background: "var(--card-hover-bg)",
                color: "var(--sidebar-text)",
              }}
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </button>
            <div
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: "var(--card-secondary-bg)",
                color: "var(--text-secondary)",
              }}
            >
              <Clock className="inline-block w-2.5 h-2.5 mr-0.5" />
              {new Date(metadata.generatedAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      <QuickActions />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Total Outstanding"
          value={formatCurrency(totalOutstanding)}
          icon={
            <HandCoins
              className="w-5 h-5"
              style={{ color: "var(--primary-color)" }}
            />
          }
          bgColor="rgba(220,38,38,0.2)"
          color="var(--primary-color)"
          onClick={() => navigate("/loans/active")}
          badge={{ text: "Total", color: "var(--status-overdue)" }}
          footer={
            <div className="flex justify-between text-xs">
              <span
                className="cursor-pointer hover:underline"
                style={{ color: "var(--primary-color)" }}
              >
                <Eye className="w-3 h-3 inline mr-1" /> View all
              </span>
            </div>
          }
        />
        <KPICard
          title="Overdue Amount"
          value={formatCurrency(overdueAmount)}
          icon={
            <AlertTriangle
              className="w-5 h-5"
              style={{ color: "var(--accent-red)" }}
            />
          }
          bgColor="rgba(239,68,68,0.2)"
          color="var(--accent-red)"
          onClick={() => navigate("/loans/overdue")}
          badge={{ text: "Overdue", color: "var(--status-overdue)" }}
          footer={
            <div className="flex justify-between text-xs">
              <span
                className="cursor-pointer hover:underline"
                style={{ color: "var(--primary-color)" }}
              >
                <Eye className="w-3 h-3 inline mr-1" /> View overdue
              </span>
            </div>
          }
        />
        <KPICard
          title="Collection Rate"
          value={`${collectionRate.toFixed(1)}%`}
          icon={
            <Percent
              className="w-5 h-5"
              style={{ color: "var(--accent-green)" }}
            />
          }
          bgColor="rgba(16,185,129,0.2)"
          color="var(--accent-green)"
          badge={{
            text:
              collectionRate >= 70
                ? `${collectionRate.toFixed(0)}% ↑`
                : `${collectionRate.toFixed(0)}% ↓`,
            color:
              collectionRate >= 70
                ? "var(--accent-green)"
                : "var(--status-partial)",
          }}
          footer={<div className="text-xs">Target: 85%</div>}
        />
        <KPICard
          title="Active Debtors"
          value={activeDebtors}
          icon={
            <Users
              className="w-5 h-5"
              style={{ color: "var(--accent-blue)" }}
            />
          }
          bgColor="rgba(59,130,246,0.2)"
          color="var(--accent-blue)"
          onClick={() => navigate("/debtors/list")}
          badge={{ text: "Active", color: "var(--accent-blue)" }}
          footer={
            <div className="text-xs">
              Total borrowers: {stats.totalBorrowers}
            </div>
          }
        />
      </div>

      {/* Current Period Performance */}
      <div
        className="compact-card rounded-lg"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
        }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-base font-semibold flex items-center gap-1.5"
              style={{ color: "var(--sidebar-text)" }}
            >
              <Calendar className="w-4 h-4" /> Current Period
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  background: "var(--primary-light)",
                  color: "var(--primary-color)",
                }}
              >
                {new Date(metadata.periodStart).toLocaleDateString()} -{" "}
                {new Date(metadata.periodEnd).toLocaleDateString()}
              </span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div
              className="text-center p-3 rounded-lg cursor-pointer hover:bg-[var(--card-hover-bg)]"
              style={{ background: "var(--card-secondary-bg)" }}
              onClick={() => navigate("/payments/transactions")}
            >
              <Wallet
                className="w-6 h-6 mx-auto mb-2"
                style={{ color: "var(--accent-green)" }}
              />
              <div
                className="text-lg font-bold"
                style={{ color: "var(--sidebar-text)" }}
              >
                {formatCurrency(currentPeriod.collected)}
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                Collected
              </div>
            </div>
            <div
              className="text-center p-3 rounded-lg cursor-pointer hover:bg-[var(--card-hover-bg)]"
              style={{ background: "var(--card-secondary-bg)" }}
              onClick={() => navigate("/loans/active")}
            >
              <Target
                className="w-6 h-6 mx-auto mb-2"
                style={{ color: "#f59e0b" }}
              />
              <div
                className="text-lg font-bold"
                style={{ color: "var(--sidebar-text)" }}
              >
                {formatCurrency(currentPeriod.expected)}
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                Expected
              </div>
            </div>
            <div
              className="text-center p-3 rounded-lg"
              style={{ background: "var(--card-secondary-bg)" }}
            >
              <Plus
                className="w-6 h-6 mx-auto mb-2"
                style={{ color: "var(--accent-blue)" }}
              />
              <div
                className="text-lg font-bold"
                style={{ color: "var(--sidebar-text)" }}
              >
                {currentPeriod.newDebts}
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                New Loans
              </div>
            </div>
            <div
              className="text-center p-3 rounded-lg"
              style={{ background: "var(--card-secondary-bg)" }}
            >
              <UserCheck
                className="w-6 h-6 mx-auto mb-2"
                style={{ color: "var(--accent-purple)" }}
              />
              <div
                className="text-lg font-bold"
                style={{ color: "var(--sidebar-text)" }}
              >
                {currentPeriod.newDebtors}
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                New Debtors
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aging & Top Debtors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <AgingBuckets
          buckets={agingBuckets}
          onClick={() => navigate("/reports/aging")}
        />
        <TopDebtorsList
          debtors={topDebtors}
          onViewAll={() => navigate("/debtors/list")}
          onSelect={(id) => {
            openView({ id: id });
          }}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          className="compact-card rounded-lg p-3 text-center"
          style={{
            background: "var(--card-secondary-bg)",
            border: "1px solid var(--border-color)",
          }}
        >
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Total Debts
          </div>
          <div
            className="text-lg font-bold"
            style={{ color: "var(--sidebar-text)" }}
          >
            {stats.totalDebts}
          </div>
        </div>
        <div
          className="compact-card rounded-lg p-3 text-center"
          style={{
            background: "var(--card-secondary-bg)",
            border: "1px solid var(--border-color)",
          }}
        >
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Paid Debts
          </div>
          <div
            className="text-lg font-bold"
            style={{ color: "var(--accent-green)" }}
          >
            {stats.totalPaidDebts}
          </div>
        </div>
        <div
          className="compact-card rounded-lg p-3 text-center"
          style={{
            background: "var(--card-secondary-bg)",
            border: "1px solid var(--border-color)",
          }}
        >
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Overdue Count
          </div>
          <div
            className="text-lg font-bold"
            style={{ color: "var(--accent-red)" }}
          >
            {stats.totalOverdue}
          </div>
        </div>
        <div
          className="compact-card rounded-lg p-3 text-center"
          style={{
            background: "var(--card-secondary-bg)",
            border: "1px solid var(--border-color)",
          }}
        >
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Penalties Collected
          </div>
          <div className="text-lg font-bold" style={{ color: "#f59e0b" }}>
            {formatCurrency(stats.totalPenaltiesCollected)}
          </div>
        </div>
      </div>

      {/* Recent Activities & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <RecentActivitiesList
          activities={recentActivities}
          onViewAll={() => navigate("/system/audit")}
          onSelect={async (id) => {
            try {
              showLoading("Loading audit details...")
              const result = await auditAPI.getById(id);
              if (result.status) {
                viewAuditDialog.open(result.data);
              }
            } catch (err: any) {
              showError("Error loading audit details...")
            }finally{
              hideLoading()
            }
          }}
        />
        <div
          className="compact-card rounded-lg p-4"
          style={{
            background: "var(--card-secondary-bg)",
            border: "1px solid var(--border-color)",
          }}
        >
          <h3
            className="font-semibold flex items-center gap-1.5 mb-4"
            style={{ color: "var(--sidebar-text)" }}
          >
            <Target className="w-4 h-4" /> Key Insights
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 rounded-md hover:bg-[var(--card-hover-bg)]">
              <span
                className="text-xs flex items-center gap-1.5"
                style={{ color: "var(--sidebar-text)" }}
              >
                <Wallet className="w-3 h-3" /> Avg. Collection per Debtor
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: "var(--accent-blue)" }}
              >
                {formatCurrency(
                  stats.totalPaymentsCollected / (activeDebtors || 1),
                )}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-md hover:bg-[var(--card-hover-bg)]">
              <span
                className="text-xs flex items-center gap-1.5"
                style={{ color: "var(--sidebar-text)" }}
              >
                <Percent className="w-3 h-3" /> Overdue Ratio
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: "var(--accent-red)" }}
              >
                {(
                  (overdueAmount / (totalOutstanding + overdueAmount)) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-md hover:bg-[var(--card-hover-bg)]">
              <span
                className="text-xs flex items-center gap-1.5"
                style={{ color: "var(--sidebar-text)" }}
              >
                <TrendingUp className="w-3 h-3" /> Collection Trend
              </span>
              <span
                className="text-xs font-medium"
                style={{
                  color:
                    collectionRate > 70 ? "var(--accent-green)" : "#f59e0b",
                }}
              >
                {collectionRate > 70 ? "Healthy" : "Needs attention"}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
            <div
              className="text-xs text-center"
              style={{ color: "var(--text-tertiary)" }}
            >
              Generated: {new Date(metadata.generatedAt).toLocaleString()} | v
              {metadata.formulaVersion}
            </div>
          </div>
        </div>
      </div>
      <DebtorViewDialog
        debtorId={viewingDebtor?.id}
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
      />

      {/* View Dialog */}
      <AuditViewDialog
        isOpen={viewAuditDialog.isOpen}
        log={viewAuditDialog.log}
        onClose={viewAuditDialog.close}
      />
    </div>
  );
};

export default DebtDashboard;
