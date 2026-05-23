// src/renderer/components/Selects/LoanApplication/index.tsx
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, FileText, X } from "lucide-react";
import type { LoanApplication } from "../../../api/core/loan_application";
import loanApplicationsAPI from "../../../api/core/loan_application";

interface LoanApplicationSelectProps {
  value: number | null;
  onChange: (appId: number | null, app?: LoanApplication) => void;
  disabled?: boolean;
  placeholder?: string;
  statusFilter?: "pending" | "approved" | "rejected";
  className?: string;
}

const LoanApplicationSelect: React.FC<LoanApplicationSelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Select loan application...",
  statusFilter,
  className = "w-full max-w-md",
}) => {
  const [apps, setApps] = useState<LoanApplication[]>([]);
  const [filteredApps, setFilteredApps] = useState<LoanApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadApps = async () => {
      setLoading(true);
      try {
        const filters: any = {};
        if (statusFilter) filters.status = statusFilter;
        // Add pagination to get enough records (you can adjust limit)
        filters.page = 1;
        filters.limit = 500;
        const response = await loanApplicationsAPI.getAll(filters);
        if (response.status && response.data) {
          const list = response.data.data || [];
          setApps(list);
          setFilteredApps(list);
        }
      } catch (error) {
        console.error("Failed to load loan applications:", error);
      } finally {
        setLoading(false);
      }
    };
    loadApps();
  }, [statusFilter]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredApps(apps);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setFilteredApps(
      apps.filter(
        (a) =>
          a.debtorName.toLowerCase().includes(lower) ||
          a.purpose.toLowerCase().includes(lower),
      ),
    );
  }, [searchTerm, apps]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const updateDropdownPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener("scroll", updateDropdownPosition, true);
      window.addEventListener("resize", updateDropdownPosition);
    }
    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (app: LoanApplication) => {
    onChange(app.id, app);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const selectedApp = apps.find((a) => a.id === value);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-4 py-2 rounded-lg text-left flex items-center gap-2 transition-colors duration-200"
        style={{
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          color: "var(--text-primary)",
          minHeight: "42px",
        }}
      >
        <FileText
          className="w-4 h-4 flex-shrink-0"
          style={{ color: "var(--primary-color)" }}
        />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {selectedApp ? (
            <>
              <span className="font-medium truncate">
                {selectedApp.debtorName}
              </span>
              <span
                className="text-xs truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                ({selectedApp.requestedAmount})
              </span>
            </>
          ) : (
            <span
              className="truncate"
              style={{ color: "var(--text-secondary)" }}
            >
              {placeholder}
            </span>
          )}
        </div>
        {selectedApp && !disabled && (
          <button
            onClick={handleClear}
            className="p-1 rounded-full hover:bg-gray-700 transition-colors flex-shrink-0"
            style={{ color: "var(--text-secondary)" }}
            title="Remove selected"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
          style={{ color: "var(--text-secondary)" }}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] rounded-lg shadow-lg overflow-hidden"
            style={{
              top: dropdownStyle.top,
              left: dropdownStyle.left,
              width: dropdownStyle.width,
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              maxHeight: "350px",
            }}
          >
            <div
              className="p-2 border-b"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="relative">
                <Search
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--text-secondary)" }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by debtor or purpose..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded text-sm"
                  style={{
                    backgroundColor: "var(--card-secondary-bg)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "250px" }}>
              {loading && apps.length === 0 ? (
                <div
                  className="p-3 text-center text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Loading...
                </div>
              ) : filteredApps.length === 0 ? (
                <div
                  className="p-3 text-center text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  No applications found
                </div>
              ) : (
                filteredApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => handleSelect(app)}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-colors text-sm cursor-pointer hover:bg-[var(--card-hover-bg)] ${app.id === value ? "bg-[var(--accent-blue-light)]" : ""}`}
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    <FileText
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: "var(--primary-color)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {app.debtorName}
                      </div>
                      <div className="text-xs truncate text-[var(--text-tertiary)]">
                        {app.purpose} | {app.requestedAmount}
                      </div>
                    </div>
                    <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-gray-200">
                      {app.status}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default LoanApplicationSelect;
