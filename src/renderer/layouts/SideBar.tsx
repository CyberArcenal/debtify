// Sidebar.tsx - Light theme version
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { version, name } from "../../../package.json";
import {
  LayoutDashboard,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Bell,
  HelpCircle,
  ListChecks,
  CalendarDays,
  Users2,
  FileCheck,
  Receipt,
  FileBarChart,
  DollarSign,
  Sliders,
  FileText,
  ComputerIcon,
  HandCoins,
  Landmark,
  AlertTriangle,
  Target,
  Clock,
  CreditCard,
  FileSignature,
  ChartNoAxesCombined,
  Layers,
  Upload,
} from "lucide-react";
import { formatCurrency } from "../utils/formatters";
import { useSettings } from "../contexts/SettingsContext";
import dashboardAPI from "../api/analytics/analytics";
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
  const { getSetting } = useSettings();
  const companyName = getSetting("general", "company_name", "Debt Manager");

  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(
    {},
  );
  const [stats, setStats] = useState({
    totalOutstanding: 0,
    overdueAmount: 0,
    collectionRate: 0,
    activeDebtors: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const [menuItems] = useState<MenuItem[]>([
    {
      path: "/dashboard",
      name: "Dashboard",
      icon: LayoutDashboard,
      category: "core",
    },
    {
      path: "/debtors",
      name: "Debtors",
      icon: Users,
      category: "core",
      children: [
        { path: "/debtors/list", name: "Debtor Directory", icon: Users2 },
        {
          path: "/debtors/credit-check",
          name: "Credit Checks",
          icon: FileCheck,
        },
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
        {
          path: "/loans/overdue",
          name: "Overdue Accounts",
          icon: AlertTriangle,
        },
        { path: "/loans/closed", name: "Closed / Paid", icon: FileCheck },
        {
          path: "/loans/applications",
          name: "Loan Applications",
          icon: FileSignature,
        },
        {
          path: "/loans/agreements",
          name: "Loan Agreements",
          icon: FileText,
        }
      ],
    },
    {
      path: "/payments",
      name: "Collections",
      icon: Landmark,
      category: "core",
      children: [
        {
          path: "/payments/schedule",
          name: "Payment Schedule",
          icon: CalendarDays,
        },
        {
          path: "/payments/transactions",
          name: "Transaction Log",
          icon: Receipt,
        },
        {
          path: "/payments/methods",
          name: "Payment Methods",
          icon: CreditCard,
        },
        { path: "/notification-logs", name: "Reminders", icon: Bell },
      ],
    },
    {
      path: "/reports",
      name: "Reports",
      icon: FileBarChart,
      category: "analytics",
      children: [
        { path: "/reports/aging", name: "Aging Analysis", icon: Clock },
        {
          path: "/reports/collection",
          name: "Collection Report",
          icon: ChartNoAxesCombined,
        },
        {
          path: "/reports/debtor-stmt",
          name: "Debtor Statement",
          icon: FileText,
        },
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
        { path: "/sync", name: "Data Sync", icon: Upload },
        { path: "/devices", name: "Device Manager", icon: ComputerIcon },
        { path: "/system/settings", name: "System Settings", icon: Sliders },
      ],
    },
  ]);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const dashboardStatsRes = await dashboardAPI.getDashboardStats();
        if (!dashboardStatsRes.status)
          throw new Error(dashboardStatsRes.message);
        const { totalRemainingBalance, totalOverdue, totalPaymentsCollected } =
          dashboardStatsRes.data;
        const totalCollectedAndOutstanding =
          totalPaymentsCollected + totalRemainingBalance;
        const collectionRate =
          totalCollectedAndOutstanding > 0
            ? (totalPaymentsCollected / totalCollectedAndOutstanding) * 100
            : 0;

        const debtsRes = await debtsAPI.getAll({
          limit: 1000,
          includeDeleted: false,
        });
        if (!debtsRes.status) throw new Error(debtsRes.message);
        const activeDebtorIds = new Set<number>();
        // ✅ Fix: Access the nested array through .data
        debtsRes.data.data.forEach((debt) => {
          if (debt.status !== "paid" && debt.borrower?.id)
            activeDebtorIds.add(debt.borrower.id);
        });
        if (mounted) {
          setStats({
            totalOutstanding: totalRemainingBalance,
            overdueAmount: totalOverdue,
            collectionRate,
            activeDebtors: activeDebtorIds.size,
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) setStatsLoading(false);
      }
    };
    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredMenu = menuItems
    .map((item) => {
      if (item.children)
        return {
          ...item,
          children: item.children.filter((child) => child.path !== "/users"),
        };
      return item;
    })
    .filter(
      (item) =>
        item.path !== "/users" &&
        (item.children ? item.children.length > 0 : true),
    );

  const toggleDropdown = (name: string) =>
    setOpenDropdowns((prev) => ({ ...prev, [name]: !prev[name] }));
  const isActivePath = (path: string) => location.pathname === path;
  const isDropdownActive = (items: MenuItem[] = []) =>
    items.some((item) => isActivePath(item.path));

  useEffect(() => {
    filteredMenu.forEach((item) => {
      if (item.children && isDropdownActive(item.children))
        setOpenDropdowns((prev) => ({ ...prev, [item.name]: true }));
    });
  }, [location.pathname]);

  const renderMenuItems = (items: MenuItem[]) => {
    return items.map((item) => {
      const hasChildren = !!item.children?.length;
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
                className={`group flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  is_active
                    ? "bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-hover)] text-white shadow-md"
                    : "text-[var(--sidebar-text)] hover:bg-[var(--card-hover-bg)] hover:text-[var(--primary-color)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`w-5 h-5 ${is_active ? "text-white" : "text-[var(--sidebar-text)] group-hover:text-[var(--primary-color)]"}`}
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${is_active ? "text-white" : "text-[var(--sidebar-text)] group-hover:text-[var(--primary-color)]"}`}
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
                          className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                            isChildActive
                              ? "text-[var(--primary-color)] bg-[var(--primary-color)]/10 font-semibold border-l-2 border-[var(--primary-color)] pl-2"
                              : "text-[var(--sidebar-text)] hover:bg-[var(--card-hover-bg)] hover:text-[var(--primary-color)]"
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
              className={`group flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                is_active
                  ? "bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-hover)] text-white shadow-md"
                  : "text-[var(--sidebar-text)] hover:bg-[var(--card-hover-bg)] hover:text-[var(--primary-color)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={`w-5 h-5 ${is_active ? "text-white" : "text-[var(--sidebar-text)] group-hover:text-[var(--primary-color)]"}`}
                />
                <span className="font-medium">{item.name}</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-opacity duration-200 ${is_active ? "opacity-100 text-white" : "opacity-0 group-hover:opacity-50 text-[var(--sidebar-text)]"}`}
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
        fixed md:relative flex flex-col h-screen bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]
        shadow-lg transition-all duration-300 ease-in-out overflow-hidden
        ${isOpen ? "w-64" : "w-0"}
      `}
    >
      {/* Header */}
    {/* Header with app icon */}
      <div className="flex-shrink-0 border-b border-[var(--sidebar-border)] bg-[var(--card-secondary-bg)] p-5">
        <div className="flex items-center gap-3">
          <img
            src="./icon.png"
            alt="Collectly"
            className="w-10 h-10 object-contain rounded-lg shadow-md"
            onError={(e) => {
              // Fallback to gradient with HandCoins if icon fails to load
              const target = e.currentTarget;
              target.style.display = 'none';
              const fallbackDiv = document.createElement('div');
              fallbackDiv.className = 'w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center shadow-md';
              const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
              svg.setAttribute('class', 'w-6 h-6 text-white');
              svg.setAttribute('fill', 'none');
              svg.setAttribute('viewBox', '0 0 24 24');
              svg.setAttribute('stroke', 'currentColor');
              const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              path.setAttribute('stroke-linecap', 'round');
              path.setAttribute('stroke-linejoin', 'round');
              path.setAttribute('stroke-width', '2');
              path.setAttribute('d', 'M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V7a2 2 0 012-2h5.5a1 1 0 01.8.4l3.5 4.5a1 1 0 01.2.6V18a2 2 0 01-2 2z');
              svg.appendChild(path);
              fallbackDiv.appendChild(svg);
              target.parentNode?.appendChild(fallbackDiv);
            }}
          />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-[var(--sidebar-text)]">
              {companyName}
            </h2>
            <p className="text-xs text-[var(--text-tertiary)]">
              Collection Platform
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {categories.map((category) => {
          const categoryItems = menuItems.filter(
            (item) => item.category === category.id,
          );
          if (categoryItems.length === 0) return null;
          return (
            <div key={category.id} className="mb-6">
              <h6 className="px-4 py-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider bg-[var(--card-secondary-bg)] rounded-lg">
                {category.name}
              </h6>
              <ul className="space-y-1 mt-2">
                {renderMenuItems(categoryItems)}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Quick Status Indicators */}
      <div className="p-4 border-t border-[var(--border-color)] bg-[var(--card-secondary-bg)]">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-[var(--status-overdue-bg)] text-[var(--status-overdue)] text-xs py-2 px-2 rounded-lg text-center border border-[var(--border-light)]">
            <div className="font-bold text-sm">
              {statsLoading ? (
                <div className="animate-pulse h-4 w-16 bg-gray-300 rounded mx-auto"></div>
              ) : (
                formatCurrency(stats.totalOutstanding)
              )}
            </div>
            <div className="text-[10px]">Total Outstanding</div>
          </div>
          <div className="bg-[var(--status-partial-bg)] text-[var(--status-partial)] text-xs py-2 px-2 rounded-lg text-center border border-[var(--border-light)]">
            <div className="font-bold text-sm">
              {statsLoading ? (
                <div className="animate-pulse h-4 w-16 bg-gray-300 rounded mx-auto"></div>
              ) : (
                formatCurrency(stats.overdueAmount)
              )}
            </div>
            <div className="text-[10px]">Overdue</div>
          </div>
          <div className="bg-[var(--status-paid-bg)] text-[var(--status-paid)] text-xs py-2 px-2 rounded-lg text-center border border-[var(--border-light)]">
            <div className="font-bold text-sm">
              {statsLoading ? (
                <div className="animate-pulse h-4 w-12 bg-gray-300 rounded mx-auto"></div>
              ) : (
                `${stats.collectionRate.toFixed(1)}%`
              )}
            </div>
            <div className="text-[10px]">Collection Rate</div>
          </div>
          <div className="bg-[var(--accent-blue-light)] text-[var(--accent-blue)] text-xs py-2 px-2 rounded-lg text-center border border-[var(--border-light)]">
            <div className="font-bold text-sm">
              {statsLoading ? (
                <div className="animate-pulse h-4 w-8 bg-gray-300 rounded mx-auto"></div>
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
            className="w-full bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-sm py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
          >
            <HandCoins className="w-4 h-4" /> Manage Debts
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border-color)] text-center flex-shrink-0 bg-[var(--card-secondary-bg)]">
        <p className="text-xs text-[var(--text-tertiary)] mb-2">
          {version} • © {new Date().getFullYear()} {toTitleCase(name)}
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate("/help")}
            className="text-[var(--text-tertiary)] hover:text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 p-1.5 rounded-full transition-colors"
            title="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <Link
            to="system/settings"
            className="text-[var(--text-tertiary)] hover:text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 p-1.5 rounded-full transition-colors"
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
