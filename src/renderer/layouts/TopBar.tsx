// TopBar.tsx - Light theme version
import {
  Menu,
  Search,
  User,
  Plus,
  HandCoins,
  DollarSign,
  Bell,
  Calendar,
  FileText,
  Moon,
  Sun,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import notificationAPI from "../api/core/notification";
import { NotificationDrawer } from "../components/Shared/NotificationDrawer";
import UpdateNotifier from "../components/Shared/UpdateNotifier";

interface RouteInfo {
  path: string;
  name: string;
  category: string;
}

interface TopBarProps {
  toggleSidebar: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    // I-load mula sa localStorage
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    // Opsyonal: i-detect ang system preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches)
      return "dark";
    return "light";
  });

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const count = await notificationAPI.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error("Failed to fetch unread count", error);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const allRoutes: RouteInfo[] = useMemo(
    () => [
      { path: "/", name: "Dashboard", category: "Main" },
      { path: "/dashboard", name: "Dashboard", category: "Main" },
      { path: "/debtors/list", name: "Debtor Directory", category: "Debtors" },
      {
        path: "/debtors/credit-check",
        name: "Credit Checks",
        category: "Debtors",
      },
      { path: "/debtors/group", name: "Debtor Groups", category: "Debtors" },
      { path: "/loans/active", name: "Active Loans", category: "Loans" },
      { path: "/loans/overdue", name: "Overdue Accounts", category: "Loans" },
      { path: "/loans/closed", name: "Closed Loans", category: "Loans" },
      {
        path: "/loans/applications",
        name: "Loan Applications",
        category: "Loans",
      },
      {
        path: "/payments/schedule",
        name: "Payment Schedule",
        category: "Collections",
      },
      {
        path: "/payments/transactions",
        name: "Transaction Log",
        category: "Collections",
      },
      {
        path: "/payments/methods",
        name: "Payment Methods",
        category: "Collections",
      },
      {
        path: "/payments/reminders",
        name: "Reminders",
        category: "Collections",
      },
      { path: "/reports/aging", name: "Aging Analysis", category: "Reports" },
      {
        path: "/reports/collection",
        name: "Collection Report",
        category: "Reports",
      },
      {
        path: "/reports/debtor-stmt",
        name: "Debtor Statement",
        category: "Reports",
      },
      {
        path: "/reports/expected",
        name: "Expected Payments",
        category: "Reports",
      },
      { path: "/system/audit", name: "Audit Trail", category: "System" },
      {
        path: "/notification-logs",
        name: "Notification Logs",
        category: "System",
      },
      { path: "/devices", name: "Device Manager", category: "System" },
      { path: "/system/settings", name: "System Settings", category: "System" },
    ],
    [],
  );

  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allRoutes.filter(
      (route) =>
        route.name.toLowerCase().includes(query) ||
        route.path.toLowerCase().includes(query.replace(/\s+/g, "-")) ||
        route.category.toLowerCase().includes(query),
    );
  }, [searchQuery, allRoutes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredRoutes.length > 0) {
      navigate(filteredRoutes[0].path);
      setSearchQuery("");
      setShowSearchResults(false);
    }
  };

  const handleRouteSelect = (path: string) => {
    navigate(path);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const getRouteIcon = (category: string) => {
    switch (category) {
      case "Main":
        return HandCoins;
      case "Debtors":
        return User;
      case "Loans":
        return HandCoins;
      case "Collections":
        return DollarSign;
      case "Reports":
        return FileText;
      default:
        return HandCoins;
    }
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-40 bg-[var(--sidebar-bg)] border-b border-[var(--sidebar-border)] flex items-center justify-between shadow-sm px-2 py-1">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle menu"
          className="p-2 rounded-lg hover:bg-[var(--card-hover-bg)] text-[var(--sidebar-text)] transition-all duration-200"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center shadow-md">
            <HandCoins className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-semibold text-[var(--sidebar-text)]">
            Debt Mgr
          </span>
        </div>
        <div className="hidden md:flex items-center gap-3 ml-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--card-secondary-bg)] border border-[var(--border-color)]">
            <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
            <div className="flex flex-col">
              <div className="text-sm font-medium text-[var(--sidebar-text)]">
                {today.toLocaleDateString("en-US", { weekday: "long" })}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">
                {formattedDate}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center Section - Search Bar */}
      <div className="flex-1 max-w-2xl mx-4">
        <div className="relative">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-[var(--text-tertiary)]" />
              </div>
              <input
                type="text"
                placeholder="Search debtors, loans, payments, reports..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                onBlur={() =>
                  setTimeout(() => setShowSearchResults(false), 200)
                }
                className="w-full pl-10 pr-4 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--sidebar-text)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent text-sm shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <div className="w-5 h-5 rounded-full bg-[var(--text-tertiary)]/20 flex items-center justify-center">
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      ×
                    </span>
                  </div>
                </button>
              )}
            </div>
          </form>

          {showSearchResults && filteredRoutes.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg bg-[var(--sidebar-bg)] border border-[var(--border-color)] max-h-80 overflow-auto z-50">
              <div className="p-2 border-b border-[var(--border-color)]">
                <div className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-2 py-1">
                  Quick Navigation
                </div>
              </div>
              {filteredRoutes.map((route, index) => {
                const RouteIcon = getRouteIcon(route.category);
                const categoryColor =
                  route.category === "Debtors"
                    ? "var(--accent-blue)"
                    : route.category === "Loans"
                      ? "var(--primary-color)"
                      : route.category === "Collections"
                        ? "var(--accent-green)"
                        : route.category === "Reports"
                          ? "var(--accent-purple)"
                          : "var(--primary-color)";
                return (
                  <div
                    key={index}
                    className="px-3 py-2.5 cursor-pointer border-b border-[var(--border-color)] last:border-b-0 hover:bg-[var(--card-hover-bg)] transition-colors group"
                    onMouseDown={() => handleRouteSelect(route.path)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform"
                        style={{
                          backgroundColor: categoryColor + "20",
                          color: categoryColor,
                        }}
                      >
                        <RouteIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[var(--sidebar-text)] truncate text-sm">
                          {route.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--card-secondary-bg)] text-[var(--text-tertiary)]">
                            {route.category}
                          </span>
                          <span className="text-xs text-[var(--text-tertiary)] truncate">
                            {route.path}
                          </span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-6 h-6 rounded-full bg-[var(--primary-color)]/20 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary-color)]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showSearchResults &&
            searchQuery.trim() &&
            filteredRoutes.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg bg-[var(--sidebar-bg)] border border-[var(--border-color)] p-6 z-50">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--card-secondary-bg)] flex items-center justify-center mx-auto mb-3">
                    <Search className="w-5 h-5 text-[var(--text-tertiary)]" />
                  </div>
                  <div className="text-[var(--sidebar-text)] font-medium mb-1">
                    No results found
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)]">
                    Try searching for debtors, loans, payments, or reports
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-[var(--card-hover-bg)] text-[var(--sidebar-text)] transition-colors"
          aria-label="Toggle dark mode"
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </button>
        <UpdateNotifier />
        <button
          onClick={() => setNotificationsOpen(true)}
          className="relative p-2 rounded-lg hover:bg-[var(--card-hover-bg)] text-[var(--sidebar-text)] transition-colors duration-200 group"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-[var(--primary-color)] text-white text-xs font-bold rounded-full px-1 border border-[var(--sidebar-bg)]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => navigate("/loans/applications")}
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-sm font-medium transition-all duration-200 shadow-md"
        >
          <Plus className="w-4 h-4" /> New Loan
        </button>
      </div>

      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </header>
  );
};

export default TopBar;
