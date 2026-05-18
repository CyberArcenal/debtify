// src/renderer/pages/debtors/group/components/GroupMembers.tsx
import React, { useState } from "react";
import { User, X, UserPlus, CheckSquare, Square, Users } from "lucide-react";
import type { Borrower } from "../../../../api/core/borrower";

interface GroupMembersProps {
  groupName: string;
  members: Borrower[];
  loading: boolean;
  availableDebtors: Borrower[];
  onAssign: (debtorId: number) => void;
  onRemove: (debtorId: number) => void;
  onBulkAssign: (debtorIds: number[]) => void;
}

const GroupMembers: React.FC<GroupMembersProps> = ({
  groupName,
  members,
  loading,
  availableDebtors,
  onAssign,
  onRemove,
  onBulkAssign,
}) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDebtorIds, setSelectedDebtorIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAvailable = availableDebtors.filter(d => 
    !members.some(m => m.id === d.id) &&
    (d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (d.email && d.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
     (d.contact && d.contact.includes(searchTerm)))
  );

  const toggleDebtorSelection = (id: number) => {
    setSelectedDebtorIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAssign = () => {
    if (selectedDebtorIds.length === 0) return;
    onBulkAssign(selectedDebtorIds);
    setSelectedDebtorIds([]);
    setShowAssignModal(false);
  };

  return (
    <div className="rounded-md border h-full flex flex-col" style={{ backgroundColor: "var(--card-secondary-bg)", borderColor: "var(--border-color)" }}>
      <div className="p-3 border-b flex justify-between items-center" style={{ borderColor: "var(--border-color)" }}>
        <h3 className="font-semibold" style={{ color: "var(--sidebar-text)" }}>
          Members: {groupName}
        </h3>
        <button
          onClick={() => setShowAssignModal(true)}
          className="px-2 py-1 rounded-md bg-[var(--primary-color)] text-white text-sm flex items-center gap-1"
        >
          <UserPlus className="w-4 h-4" /> Assign
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-center py-4 text-[var(--text-tertiary)]">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-tertiary)]">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No debtors in this group.</p>
            <p className="text-sm">Click "Assign" to add debtors.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {members.map((member) => (
              <li key={member.id} className="flex justify-between items-center p-2 rounded border" style={{ borderColor: "var(--border-color)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary-color)]/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-[var(--primary-color)]" />
                  </div>
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">{member.email || member.contact || "No contact"}</div>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(member.id)}
                  className="p-1 rounded hover:bg-[var(--card-hover-bg)] text-red-500"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="rounded-lg w-full max-w-md mx-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
            <div className="p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
              <h3 className="text-lg font-semibold">Assign Debtors to {groupName}</h3>
            </div>
            <div className="p-4">
              <input
                type="text"
                placeholder="Search debtors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-md mb-3"
                style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--sidebar-text)" }}
              />
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredAvailable.map((debtor) => (
                  <div key={debtor.id} className="flex items-center gap-2 p-2 rounded hover:bg-[var(--card-hover-bg)]">
                    <button onClick={() => toggleDebtorSelection(debtor.id)}>
                      {selectedDebtorIds.includes(debtor.id) ? (
                        <CheckSquare className="w-5 h-5 text-[var(--primary-color)]" />
                      ) : (
                        <Square className="w-5 h-5 text-[var(--text-tertiary)]" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="font-medium">{debtor.name}</div>
                      <div className="text-xs text-[var(--text-tertiary)]">{debtor.email || debtor.contact}</div>
                    </div>
                  </div>
                ))}
                {filteredAvailable.length === 0 && (
                  <div className="text-center text-[var(--text-tertiary)] py-4">No unassigned debtors found.</div>
                )}
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2" style={{ borderColor: "var(--border-color)" }}>
              <button onClick={() => setShowAssignModal(false)} className="px-3 py-1 rounded border" style={{ borderColor: "var(--border-color)" }}>Cancel</button>
              <button onClick={handleBulkAssign} className="px-3 py-1 rounded bg-[var(--primary-color)] text-white">Assign Selected</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupMembers;