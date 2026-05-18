// components/Sidebar.tsx (Debt Management Version)
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { version, name } from "../../../package.json";
import {
  LayoutDashboard,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Bell,
  LogOut,
  HelpCircle,
  Calculator,
  ListChecks,
  CalendarDays,
  Users2,
  FileCheck,
  User2,
  Receipt,
  BarChart2,
  Trophy,
  Layers,
  Shuffle,
  Truck,
  FileBarChart,
  DollarSign,
  ClipboardList,
  UserCheck,
  Sliders,
  FileText,
  Boxes,
  Tags,
  RotateCcw,
  ClipboardCheck,
  Building2,
  ComputerIcon,
  HandCoins,
  Landmark,
  AlertTriangle,
  Scale,
  Target,
  PiggyBank,
  Clock,
  CreditCard,
  FileSignature,
  ChartNoAxesCombined,
} from "lucide-react";
import { formatCurrency } from "../utils/formatters";
import systemConfigAPI from "../api/utils/system_config";
import { useSettings } from "../contexts/SettingsContext";
import dashboardAPI from "../api/core/analytics";
import debtsAPI from "../api/core/debt";

interface SidebarProps {
  isOpen: boolean;
}

interface MenuItem {
  path: string;
  name: string;
  icon: React.ComponentType<any>;
  category?: string;
  children?: MenuItem[];
}

export function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
  );
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const title = toTitleCase(name);
  const { settings, getSetting, updateSetting } = useSettings();
  const companyName = getSetting("general", "company_name", "Debt Manager");

  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  // Real debt management stats
  const [stats, setStats] = useState({
    totalOutstanding: 0,
    overdueAmount: 0,
    collectionRate: 0,
    activeDebtors: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Menu items for Debt Management
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { path: "/dashboard", name: "Dashboard", icon: LayoutDashboard, category: "core" },

    {
      path: "/debtors",
      name: "Debtors",
      icon: Users,
      category: "core",
      children: [
        { path: "/debtors/list", name: "Debtor Directory", icon: Users2 },
        { path: "/debtors/credit-check", name: "Credit Checks", icon: FileCheck },
        { path: "/debtors/group", name: "Groups / Segments", icon: Layers },
      ],
    },

    {
      path: "/loans",
      name: "Loans & Debts",
      icon: HandCoins,
      category: "core",
      children: [
        { path: "/loans/active", name: "Active Loans", icon: Clock },
        { path: "/loans/overdue", name: "Overdue Accounts", icon: AlertTriangle },
        { path: "/loans/closed", name: "Closed / Paid", icon: FileCheck },
        { path: "/loans/applications", name: "Loan Applications", icon: FileSignature },
      ],
    },

    {
      path: "/payments",
      name: "Collections",
      icon: Landmark,
      category: "core",
      children: [
        { path: "/payments/schedule", name: "Payment Schedule", icon: CalendarDays },
        { path: "/payments/transactions", name: "Transaction Log", icon: Receipt },
        { path: "/payments/methods", name: "Payment Methods", icon: CreditCard },
        { path: "/payments/reminders", name: "Reminders", icon: Bell },
      ],
    },

    {
      path: "/reports",
      name: "Reports",
      icon: FileBarChart,
      category: "analytics",
      children: [
        { path: "/reports/aging", name: "Aging Analysis", icon: Clock },
        { path: "/reports/collection", name: "Collection Report", icon: ChartNoAxesCombined },
        { path: "/reports/debtor-stmt", name: "Debtor Statement", icon: FileText },
        { path: "/reports/expected", name: "Expected Payments", icon: Target },
      ],
    },

    {
      path: "/system",
      name: "System",
      icon: Settings,
      category: "system",
      children: [
        { path: "/system/audit", name: "Audit Trail", icon: ListChecks },
        { path: "/notification-logs", name: "Notification Logs", icon: Bell },
        { path: "/devices", name: "Device Manager", icon: ComputerIcon },
        { path: "/system/settings", name: "System Settings", icon: Sliders },
      ],
    },
  ]);

  // Fetch real stats
  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        setStatsLoading(true);

        // Get dashboard statistics (total outstanding, overdue amount, payments)
        const dashboardStatsRes = await dashboardAPI.getDashboardStats();
        if (!dashboardStatsRes.status) throw new Error(dashboardStatsRes.message);

        const { totalRemainingBalance, totalOverdue, totalPaymentsCollected } = dashboardStatsRes.data;

        // Calculate collection rate
        const totalCollectedAndOutstanding = totalPaymentsCollected + totalRemainingBalance;
        const collectionRate = totalCollectedAndOutstanding > 0
          ? (totalPaymentsCollected / totalCollectedAndOutstanding) * 100
          : 0;

        // Get all debts to compute active debtors (distinct borrowers with non-paid debts)
        const debtsRes = await debtsAPI.getAll({ limit: 1000, includeDeleted: false });
        if (!debtsRes.status) throw new Error(debtsRes.message);

        const activeDebtorIds = new Set<number>();
        debtsRes.data.forEach((debt) => {
          if (debt.status !== "paid" && debt.borrower?.id) {
            activeDebtorIds.add(debt.borrower.id);
          }
        });
        const activeDebtors = activeDebtorIds.size;

        if (mounted) {
          setStats({
            totalOutstanding: totalRemainingBalance,
            overdueAmount: totalOverdue,
            collectionRate,
            activeDebtors,
          });
        }
      } catch (error) {
        console.error("Failed to fetch debt stats:", error);
        // Keep existing stats (default zeros) on error
      } finally {
        if (mounted) setStatsLoading(false);
      }
    };

    fetchStats();
    return () => { mounted = false; };
  }, []);

  const filteredMenu = menuItems
    .map((item) => {
      if (item.children) {
        const children = item.children.filter(
          (child) => !(child.path === "/users"),
        );
        return { ...item, children };
      }
      return item;
    })
    .filter(
      (item) =>
        item.path !== "/users" &&
        (item.children ? item.children.length > 0 : true),
    );

  const toggleDropdown = (name: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const isDropdownActive = (items: MenuItem[] = []) => {
    return items.some((item) => isActivePath(item.path));
  };

  useEffect(() => {
    filteredMenu.forEach((item) => {
      if (item.children && isDropdownActive(item.children)) {
        setOpenDropdowns((prev) => ({ ...prev, [item.name]: true }));
      }
    });
  }, [location.pathname]);

  const renderMenuItems = (items: MenuItem[]) => {
    return items.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const is_active = hasChildren
        ? isDropdownActive(item.children)
        : isActivePath(item.path);
      const isOpen = openDropdowns[item.name];

      return (
        <li key={item.path || item.name} className="mb-1">
          {hasChildren ? (
            <>
              <div
                onClick={() => toggleDropdown(item.name)}
                className={`group flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer
                  ${
                    is_active
                      ? "bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-hover)] text-white shadow-lg"
                      : "text-[var(--sidebar-text)] hover:bg-[var(--card-hover-bg)] hover:text-white"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`w-5 h-5 ${
                      is_active
                        ? "text-white"
                        : "text-[var(--sidebar-text)] group-hover:text-white"
                    }`}
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  } ${
                    is_active
                      ? "text-white"
                      : "text-[var(--sidebar-text)] group-hover:text-white"
                  }`}
                />
              </div>

              {isOpen && (
                <ul
                  className="ml-4 mt-1 space-y-1 border-l-2 pl-3"
                  style={{ borderColor: "var(--primary-color)" }}
                >
                  {item.children?.map((child) => {
                    const isChildActive = isActivePath(child.path);
                    return (
                      <li key={child.path} className="mb-1">
                        <Link
                          to={child.path}
                          className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm
                            ${
                              isChildActive
                                ? "text-white bg-[var(--primary-color)]/20 font-semibold border-l-2 border-[var(--primary-color)] pl-2"
                                : "text-[var(--sidebar-text)] hover:bg-[var(--card-hover-bg)] hover:text-white"
                            }`}
                        >
                          <child.icon className="w-4 h-4" />
                          <span>{child.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : (
            <Link
              to={item.path}
              className={`group flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${
                  is_active
                    ? "bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-hover)] text-white shadow-lg"
                    : "text-[var(--sidebar-text)] hover:bg-[var(--card-hover-bg)] hover:text-white"
                }`}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={`w-5 h-5 ${
                    is_active
                      ? "text-white"
                      : "text-[var(--sidebar-text)] group-hover:text-white"
                  }`}
                />
                <span className="font-medium">{item.name}</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-opacity duration-200 ${
                  is_active
                    ? "opacity-100 text-white"
                    : "opacity-0 group-hover:opacity-50 text-[var(--sidebar-text)]"
                }`}
              />
            </Link>
          )}
        </li>
      );
    });
  };

  const categories = [
    { id: "core", name: "Debt Management" },
    { id: "analytics", name: "Reports & Insights" },
    { id: "system", name: "System" },
  ];

  return (
    <div
      className={`
    fixed md:relative
    flex flex-col h-screen
    bg-gradient-to-b from-[var(--sidebar-bg)] to-[#1a1625]
    border-r border-[var(--sidebar-border)]
    shadow-xl
    transition-all duration-300 ease-in-out
    overflow-hidden
    ${isOpen ? "w-64" : "w-0"}
  `}
    >
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[var(--sidebar-border)] bg-gradient-to-r from-[var(--sidebar-bg)] to-[#1a1625] p-6">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary-color)] to-[#b91c1c] flex items-center justify-center overflow-hidden shadow-lg">
            <div className="flex items-center justify-center w-full h-full">
              <HandCoins className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-white">
              {companyName}
            </h2>
            <p className="text-xs text-[var(--text-tertiary)]">
              Debt Management System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto pos-scrollbar p-4">
        {categories.map((category) => {
          const categoryItems = menuItems.filter(
            (item) => item.category === category.id,
          );
          if (categoryItems.length === 0) return null;

          return (
            <div key={category.id} className="mb-6">
              <h6 className="px-4 py-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider bg-[#334155]/50 rounded-lg">
                {category.name}
              </h6>
              <ul className="space-y-1 mt-2">
                {renderMenuItems(categoryItems)}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Quick Status Indicators - Debt Focus */}
      <div className="p-4 border-t border-[var(--border-color)] bg-[#1e1b2e]/30">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-[var(--status-overdue-bg)] text-[var(--status-overdue)] text-xs py-2 px-2 rounded-lg text-center border border-[var(--border-light)]">
            <div className="font-bold text-sm">
              {statsLoading ? (
                <div className="animate-pulse h-4 w-16 bg-gray-500 rounded mx-auto"></div>
              ) : (
                formatCurrency(stats.totalOutstanding)
              )}
            </div>
            <div className="text-[10px]">Total Outstanding</div>
          </div>
          <div className="bg-[var(--status-partial-bg)] text-[var(--status-partial)] text-xs py-2 px-2 rounded-lg text-center border border-[var(--border-light)]">
            <div className="font-bold text-sm">
              {statsLoading ? (
                <div className="animate-pulse h-4 w-16 bg-gray-500 rounded mx-auto"></div>
              ) : (
                formatCurrency(stats.overdueAmount)
              )}
            </div>
            <div className="text-[10px]">Overdue</div>
          </div>
          <div className="bg-[var(--status-paid-bg)] text-[var(--status-paid)] text-xs py-2 px-2 rounded-lg text-center border border-[var(--border-light)]">
            <div className="font-bold text-sm">
              {statsLoading ? (
                <div className="animate-pulse h-4 w-12 bg-gray-500 rounded mx-auto"></div>
              ) : (
                `${stats.collectionRate.toFixed(1)}%`
              )}
            </div>
            <div className="text-[10px]">Collection Rate</div>
          </div>
          <div className="bg-[var(--accent-blue-light)] text-[var(--accent-blue)] text-xs py-2 px-2 rounded-lg text-center border border-[var(--border-light)]">
            <div className="font-bold text-sm">
              {statsLoading ? (
                <div className="animate-pulse h-4 w-8 bg-gray-500 rounded mx-auto"></div>
              ) : (
                stats.activeDebtors
              )}
            </div>
            <div className="text-[10px]">Active Debtors</div>
          </div>
        </div>
        <div className="flex justify-center">
          <Link
            to="/loans/active"
            className="w-full bg-gradient-to-r from-[var(--primary-color)] to-[#b91c1c] text-white text-sm py-2 px-4 rounded-lg text-center hover:from-[var(--primary-hover)] hover:to-[#991b1b] transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
          >
            <HandCoins className="w-4 h-4" />
            Manage Debts
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border-color)] text-center flex-shrink-0 bg-gradient-to-r from-[var(--sidebar-bg)] to-[#1a1625]">
        <p className="text-xs text-[var(--text-tertiary)] mb-2">
          {version} • © {new Date().getFullYear()} {toTitleCase(name)}
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate("/help")}
            className="text-[var(--text-tertiary)] hover:text-[var(--accent-amber)] hover:bg-[var(--accent-amber)]/10 p-1.5 rounded-full transition-colors duration-200"
            title="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <Link
            to="system/settings"
            className="text-[var(--text-tertiary)] hover:text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 p-1.5 rounded-full transition-colors duration-200"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;