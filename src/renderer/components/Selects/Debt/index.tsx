// src/renderer/components/Selects/Debt/index.tsx
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, HandCoins, X } from "lucide-react";
import type { Debt } from "../../../api/core/debt";
import debtsAPI from "../../../api/core/debt";

interface DebtSelectProps {
  value: number | null;
  onChange: (debtId: number | null, debt?: Debt) => void;
  disabled?: boolean;
  placeholder?: string;
  statusFilter?: "active" | "paid" | "overdue" | "defaulted" | "all";
  borrowerId?: number; // optional filter by borrower
  className?: string;
}

const DebtSelect: React.FC<DebtSelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Select loan...",
  statusFilter = "active",
  borrowerId,
  className = "w-full max-w-md",
}) => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [filteredDebts, setFilteredDebts] = useState<Debt[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

// src/renderer/components/Selects/Debt/index.tsx
// Only the loadDebts useEffect needs to change:

useEffect(() => {
  const loadDebts = async () => {
    setLoading(true);
    try {
      const params: any = {
        sortBy: "dueDate",
        sortOrder: "ASC",
        limit: 1000,
        includeDeleted: false,
      };
      if (statusFilter !== "all") params.status = statusFilter;
      if (borrowerId) params.borrowerId = borrowerId;
      const response = await debtsAPI.getAll(params);
      if (response.status && response.data) {
        // ✅ Fix: response.data is PaginatedResult<Debt>, so array is under .data
        const list = response.data.data || [];
        setDebts(list);
        setFilteredDebts(list);
      }
    } catch (error) {
      console.error("Failed to load debts:", error);
    } finally {
      setLoading(false);
    }
  };
  loadDebts();
}, [statusFilter, borrowerId]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDebts(debts);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setFilteredDebts(
      debts.filter(
        (d) =>
          d.name.toLowerCase().includes(lower) ||
          (d.borrower?.name && d.borrower.name.toLowerCase().includes(lower))
      )
    );
  }, [searchTerm, debts]);

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

  const handleSelect = (debt: Debt) => {
    onChange(debt.id, debt);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const selectedDebt = debts.find((d) => d.id === value);

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
        <HandCoins className="w-4 h-4 flex-shrink-0" style={{ color: "var(--primary-color)" }} />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {selectedDebt ? (
            <>
              <span className="font-medium truncate">{selectedDebt.name}</span>
              {selectedDebt.borrower?.name && (
                <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                  ({selectedDebt.borrower.name})
                </span>
              )}
            </>
          ) : (
            <span className="truncate" style={{ color: "var(--text-secondary)" }}>
              {placeholder}
            </span>
          )}
        </div>
        {selectedDebt && !disabled && (
          <button
            type="button"
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
            <div className="p-2 border-b" style={{ borderColor: "var(--border-color)" }}>
              <div className="relative">
                <Search
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--text-secondary)" }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by debt name or borrower..."
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
              {loading && debts.length === 0 ? (
                <div className="p-3 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                  Loading...
                </div>
              ) : filteredDebts.length === 0 ? (
                <div className="p-3 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                  No loans found
                </div>
              ) : (
                filteredDebts.map((debt) => (
                  <button
                    key={debt.id}
                    type="button"
                    onClick={() => handleSelect(debt)}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-colors text-sm cursor-pointer hover:bg-[var(--card-hover-bg)] ${
                      debt.id === value ? "bg-[var(--accent-blue-light)]" : ""
                    }`}
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    <HandCoins className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--primary-color)" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {debt.name}
                        </span>
                        {debt.borrower?.name && (
                          <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                            {debt.borrower.name}
                          </span>
                        )}
                      </div>
                      <div className="text-xs truncate mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                        Remaining: {debt.remainingAmount} | Due: {new Date(debt.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default DebtSelect;