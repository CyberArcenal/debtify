// src/renderer/pages/debtors/credit-check/components/DebtorSearch.tsx
import React, { useEffect } from "react";
import { Search, User } from "lucide-react";
import type { Borrower } from "../../../../api/core/borrower";

interface DebtorSearchProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  searchResults: Borrower[];
  searching: boolean;
  onSelectDebtor: (debtor: Borrower) => void;
  selectedDebtor: Borrower | null;
  onSearch: () => void;
}

const DebtorSearch: React.FC<DebtorSearchProps> = ({
  searchTerm,
  onSearchTermChange,
  searchResults,
  searching,
  onSelectDebtor,
  selectedDebtor,
  onSearch,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="rounded-md border p-4" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
      <h3 className="font-semibold mb-3" style={{ color: "var(--sidebar-text)" }}>1. Find Debtor</h3>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by name, email, or contact..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 pr-10 border rounded-md"
            style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--sidebar-text)" }}
          />
          <button
            onClick={onSearch}
            disabled={searching}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--card-hover-bg)]"
          >
            <Search className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
        </div>
      </div>

      {searching && (
        <div className="mt-3 text-sm text-[var(--text-tertiary)]">Searching...</div>
      )}

      {!searching && searchResults.length > 0 && (
        <div className="mt-3 border rounded-md divide-y" style={{ borderColor: "var(--border-color)" }}>
          {searchResults.map((debtor) => (
            <div
              key={debtor.id}
              onClick={() => onSelectDebtor(debtor)}
              className={`p-2 cursor-pointer hover:bg-[var(--card-hover-bg)] transition-colors ${
                selectedDebtor?.id === debtor.id ? "bg-[var(--primary-color)]/10" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--primary-color)]/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-[var(--primary-color)]" />
                </div>
                <div>
                  <div className="font-medium">{debtor.name}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">{debtor.email || debtor.contact || "No contact"}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!searching && searchTerm && searchResults.length === 0 && (
        <div className="mt-3 text-sm text-[var(--text-tertiary)]">No debtors found.</div>
      )}
    </div>
  );
};

export default DebtorSearch;