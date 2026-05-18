// src/renderer/pages/debtors/group/components/GroupList.tsx
import React from "react";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import type { DebtorGroup } from "../types";

interface GroupListProps {
  groups: DebtorGroup[];
  selectedGroup: DebtorGroup | null;
  onSelectGroup: (group: DebtorGroup) => void;
  onAddGroup: () => void;
  onEditGroup: (group: DebtorGroup) => void;
  onDeleteGroup: (id: number) => void;
  loading: boolean;
}

const GroupList: React.FC<GroupListProps> = ({
  groups,
  selectedGroup,
  onSelectGroup,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
  loading,
}) => {
  return (
    <div className="rounded-md border h-full flex flex-col" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
      <div className="p-3 border-b flex justify-between items-center" style={{ borderColor: "var(--border-color)" }}>
        <h3 className="font-semibold" style={{ color: "var(--sidebar-text)" }}>Groups</h3>
        <button
          onClick={onAddGroup}
          className="p-1 rounded hover:bg-[var(--card-hover-bg)] text-[var(--primary-color)]"
          title="Add Group"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-[var(--text-tertiary)]">Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className="p-4 text-center text-[var(--text-tertiary)]">No groups yet. Click + to add.</div>
        ) : (
          <ul>
            {groups.map((group) => (
              <li
                key={group.id}
                className={`p-3 border-b cursor-pointer transition-colors hover:bg-[var(--card-hover-bg)] ${
                  selectedGroup?.id === group.id ? "bg-[var(--primary-color)]/10 border-l-4 border-l-[var(--primary-color)]" : ""
                }`}
                style={{ borderColor: "var(--border-color)" }}
                onClick={() => onSelectGroup(group)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }}></div>
                    <span className="font-medium">{group.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditGroup(group); }}
                      className="p-1 rounded hover:bg-[var(--card-bg)]"
                    >
                      <Edit className="w-3 h-3 text-[var(--accent-amber)]" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteGroup(group.id); }}
                      className="p-1 rounded hover:bg-[var(--card-bg)]"
                    >
                      <Trash2 className="w-3 h-3 text-[var(--danger-color)]" />
                    </button>
                  </div>
                </div>
                {group.description && (
                  <div className="text-xs text-[var(--text-tertiary)] mt-1">{group.description}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default GroupList;