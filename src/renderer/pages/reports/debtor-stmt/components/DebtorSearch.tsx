// src/renderer/pages/reports/debtor-stmt/components/DebtorSearch.tsx
import React from "react";
import { Search, User } from "lucide-react";

interface DebtorSearchProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  searchResults: any[];
  searching: boolean;
  onSelectDebtor: (debtor: any) => void;
  selectedDebtor: any;
}

const DebtorSearch: React.FC<DebtorSearchProps> = ({ searchTerm, onSearchTermChange, searchResults, searching, onSelectDebtor, selectedDebtor }) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-1">Select Debtor</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or contact..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border rounded-md"
          style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)" }}
        />
      </div>
      {searching && <div className="text-sm text-gray-500 mt-1">Searching...</div>}
      {!searching && searchResults.length > 0 && (
        <ul className="border rounded-md mt-2 max-h-48 overflow-y-auto">
          {searchResults.map((debtor) => (
            <li
              key={debtor.id}
              onClick={() => onSelectDebtor(debtor)}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-2 ${selectedDebtor?.id === debtor.id ? "bg-green-50" : ""}`}
            >
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <div>{debtor.name}</div>
                <div className="text-xs text-gray-500">{debtor.email || debtor.contact}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DebtorSearch;