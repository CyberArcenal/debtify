// src/renderer/components/Selects/Borrower/index.tsx
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, User, X } from "lucide-react";
import type { Borrower } from "../../../api/core/borrower";
import borrowersAPI from "../../../api/core/borrower";

interface BorrowerSelectProps {
  value: number | null;
  onChange: (borrowerId: number | null, borrower?: Borrower) => void;
  disabled?: boolean;
  placeholder?: string;
  activeOnly?: boolean; // exclude soft-deleted
  className?: string;
}

const BorrowerSelect: React.FC<BorrowerSelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Select borrower...",
  activeOnly = true,
  className = "w-full max-w-md",
}) => {
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [filteredBorrowers, setFilteredBorrowers] = useState<Borrower[]>([]);
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

  // Load borrowers
  useEffect(() => {
    const loadBorrowers = async () => {
      setLoading(true);
      try {
        const response = await borrowersAPI.getAll({
          sortBy: "name",
          sortOrder: "ASC",
          limit: 1000,
          includeDeleted: !activeOnly,
        });
        if (response.status && response.data) {
          // ✅ response.data is PaginatedResult<Borrower>, so array is under .data
          const list = response.data.data || [];
          setBorrowers(list);
          setFilteredBorrowers(list);
        }
      } catch (error) {
        console.error("Failed to load borrowers:", error);
      } finally {
        setLoading(false);
      }
    };
    loadBorrowers();
  }, [activeOnly]);

  // Filter borrowers
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBorrowers(borrowers);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setFilteredBorrowers(
      borrowers.filter(
        (b) =>
          b.name.toLowerCase().includes(lower) ||
          (b.email && b.email.toLowerCase().includes(lower)) ||
          (b.contact && b.contact.toLowerCase().includes(lower)),
      ),
    );
  }, [searchTerm, borrowers]);

  // Focus search when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Update dropdown position
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

  // Close on outside click
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

  const handleSelect = (borrower: Borrower) => {
    onChange(borrower.id, borrower);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const selectedBorrower = borrowers.find((b) => b.id === value);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-2 rounded-lg text-left flex items-center gap-2
          transition-colors duration-200
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-800"}
        `}
        style={{
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          color: "var(--text-primary)",
          minHeight: "42px",
        }}
      >
        <User className="w-4 h-4 flex-shrink-0" style={{ color: "var(--primary-color)" }} />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {selectedBorrower ? (
            <>
              <span className="font-medium truncate">{selectedBorrower.name}</span>
              {selectedBorrower.contact && (
                <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                  ({selectedBorrower.contact})
                </span>
              )}
            </>
          ) : (
            <span className="truncate" style={{ color: "var(--text-secondary)" }}>
              {placeholder}
            </span>
          )}
        </div>
        {selectedBorrower && !disabled && (
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
                  placeholder="Search by name, email, or contact..."
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
              {loading && borrowers.length === 0 ? (
                <div className="p-3 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                  Loading...
                </div>
              ) : filteredBorrowers.length === 0 ? (
                <div className="p-3 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                  No borrowers found
                </div>
              ) : (
                filteredBorrowers.map((borrower) => (
                  <button
                    key={borrower.id}
                    type="button"
                    onClick={() => handleSelect(borrower)}
                    className={`
                      w-full px-3 py-2 text-left flex items-center gap-2
                      transition-colors text-sm cursor-pointer hover:bg-[var(--card-hover-bg)]
                      ${borrower.id === value ? "bg-[var(--accent-blue-light)]" : ""}
                    `}
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--primary-color)" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {borrower.name}
                        </span>
                        {borrower.contact && (
                          <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                            {borrower.contact}
                          </span>
                        )}
                      </div>
                      {borrower.email && (
                        <div className="text-xs truncate mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                          {borrower.email}
                        </div>
                      )}
                    </div>
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

export default BorrowerSelect;