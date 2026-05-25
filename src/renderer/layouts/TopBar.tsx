// src/layouts/TopBar.tsx (bagong bersyon)
import React from "react";
import { HandCoins, Menu, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DateDisplay from "../components/Shared/DateDisplay";
import SearchBar from "../components/Shared/SearchBar";
import SyncStatusIndicator from "../components/Shared/SyncStatusIndicator";
import ThemeToggle from "../components/Shared/ThemeToggle";
import UpdateNotifier from "../components/Shared/UpdateNotifier";
import NotificationBell from "../components/Shared/NotificationBell";
import StatusIndicators from "../components/Shared/StatusIndicators";

interface TopBarProps {
  toggleSidebar: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-[var(--sidebar-bg)] border-b border-[var(--sidebar-border)] flex items-center justify-between shadow-sm px-2 py-1">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-[var(--card-hover-bg)] text-[var(--sidebar-text)] transition-all duration-200"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center shadow-md">
            <HandCoins className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-semibold text-[var(--sidebar-text)]">Debt Mgr</span>
        </div>
        <div className="hidden md:block">
          <DateDisplay />
        </div>
      </div>

      {/* Center */}
      <div className="flex-1 max-w-2xl mx-4">
        <SearchBar />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <StatusIndicators />
        <UpdateNotifier />
        <SyncStatusIndicator />
        <ThemeToggle />
        <NotificationBell />
        <button
          onClick={() => navigate("/loans/applications")}
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-sm font-medium transition-all duration-200 shadow-md"
        >
          <Plus className="w-4 h-4" /> New Loan
        </button>
      </div>
    </header>
  );
};

export default TopBar;