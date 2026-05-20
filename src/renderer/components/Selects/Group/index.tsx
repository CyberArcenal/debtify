// src/renderer/components/Selects/Group/index.tsx
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Layers, X } from "lucide-react";
import type { DebtorGroup } from "../../../api/core/group";
import groupsAPI from "../../../api/core/group";

interface GroupSelectProps {
  value: number | null;
  onChange: (groupId: number | null, group?: DebtorGroup) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const GroupSelect: React.FC<GroupSelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Select group...",
  className = "w-full max-w-md",
}) => {
  const [groups, setGroups] = useState<DebtorGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<DebtorGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadGroups = async () => {
      setLoading(true);
      try {
        const response = await groupsAPI.getAll();
        if (response.status && response.data) {
          const list = Array.isArray(response.data) ? response.data : [];
          setGroups(list);
          setFilteredGroups(list);
        }
      } catch (error) {
        console.error("Failed to load groups:", error);
      } finally {
        setLoading(false);
      }
    };
    loadGroups();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredGroups(groups);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setFilteredGroups(
      groups.filter(
        (g) =>
          g.name.toLowerCase().includes(lower) ||
          (g.description && g.description.toLowerCase().includes(lower))
      )
    );
  }, [searchTerm, groups]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const updateDropdownPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
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

  const handleSelect = (group: DebtorGroup) => {
    onChange(group.id, group);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const selectedGroup = groups.find((g) => g.id === value);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-4 py-2 rounded-lg text-left flex items-center gap-2 transition-colors duration-200"
        style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)", minHeight: "42px" }}
      >
        <Layers className="w-4 h-4 flex-shrink-0" style={{ color: "var(--primary-color)" }} />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {selectedGroup ? (
            <>
              <span className="font-medium truncate">{selectedGroup.name}</span>
              {selectedGroup.description && (
                <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                  ({selectedGroup.description})
                </span>
              )}
            </>
          ) : (
            <span className="truncate" style={{ color: "var(--text-secondary)" }}>{placeholder}</span>
          )}
        </div>
        {selectedGroup && !disabled && (
          <button onClick={handleClear} className="p-1 rounded-full hover:bg-gray-700 transition-colors flex-shrink-0" style={{ color: "var(--text-secondary)" }} title="Remove selected">
            <X className="w-4 h-4" />
          </button>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} style={{ color: "var(--text-secondary)" }} />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] rounded-lg shadow-lg overflow-hidden"
          style={{ top: dropdownStyle.top, left: dropdownStyle.left, width: dropdownStyle.width, backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)", maxHeight: "350px" }}
        >
          <div className="p-2 border-b" style={{ borderColor: "var(--border-color)" }}>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-secondary)" }} />
              <input ref={searchInputRef} type="text" placeholder="Search groups..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-1.5 rounded text-sm" style={{ backgroundColor: "var(--card-secondary-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} />
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "250px" }}>
            {loading && groups.length === 0 ? <div className="p-3 text-center text-sm" style={{ color: "var(--text-secondary)" }}>Loading...</div>
            : filteredGroups.length === 0 ? <div className="p-3 text-center text-sm" style={{ color: "var(--text-secondary)" }}>No groups found</div>
            : filteredGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => handleSelect(group)}
                className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-colors text-sm cursor-pointer hover:bg-[var(--card-hover-bg)] ${group.id === value ? "bg-[var(--accent-blue-light)]" : ""}`}
                style={{ borderBottom: "1px solid var(--border-color)" }}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{group.name}</div>
                  {group.description && <div className="text-xs truncate text-[var(--text-tertiary)]">{group.description}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default GroupSelect;