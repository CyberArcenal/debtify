// src/renderer/pages/debtors/group/hooks/useDebtorGroups.ts
import { useState, useEffect, useCallback } from "react";
import { dialogs } from "../../../../utils/dialogs";
import borrowersAPI from "../../../../api/core/borrower";
import groupsAPI from "../../../../api/core/group";
import type { Borrower } from "../../../../api/core/borrower";
import type { DebtorGroup } from "../../../../api/core/group";

interface UseDebtorGroupsReturn {
  groups: DebtorGroup[];
  loadingGroups: boolean;
  selectedGroup: DebtorGroup | null;
  setSelectedGroup: (group: DebtorGroup | null) => void;
  groupMembers: Borrower[];
  loadingMembers: boolean;
  availableDebtors: Borrower[];
  loadingDebtors: boolean;
  createGroupModalOpen: boolean;
  openCreateGroupModal: () => void;
  closeCreateGroupModal: () => void;
  editGroupModalOpen: boolean;
  editingGroup: DebtorGroup | null;
  openEditGroupModal: (group: DebtorGroup) => void;
  closeEditGroupModal: () => void;
  handleCreateGroup: (data: { name: string; description: string; color: string }) => Promise<void>;
  handleUpdateGroup: (id: number, data: Partial<DebtorGroup>) => Promise<void>;
  handleDeleteGroup: (id: number) => Promise<void>;
  assignDebtor: (debtorId: number) => Promise<void>;
  removeDebtor: (debtorId: number) => Promise<void>;
  bulkAssign: (debtorIds: number[]) => Promise<void>;
  refresh: () => void;
}

const useDebtorGroups = (): UseDebtorGroupsReturn => {
  const [groups, setGroups] = useState<DebtorGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<DebtorGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<Borrower[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [availableDebtors, setAvailableDebtors] = useState<Borrower[]>([]);
  const [loadingDebtors, setLoadingDebtors] = useState(false);

  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [editGroupModalOpen, setEditGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DebtorGroup | null>(null);

  // Load all groups from API
  const loadGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const response = await groupsAPI.getAll();
      if (response.status) {
        setGroups(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      console.error("Failed to load groups:", err);
      dialogs.error(err.message || "Failed to load groups");
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  // Load members of the selected group
  const loadGroupMembers = useCallback(async (groupId: number) => {
    setLoadingMembers(true);
    try {
      const response = await groupsAPI.getMembers(groupId);
      if (response.status) {
        const members = response.data.map(m => ({
          id: m.debtor.id,
          name: m.debtor.name,
          contact: m.debtor.contact,
          email: m.debtor.email,
          address: null,
          notes: null,
          createdAt: m.assignedAt,
          updatedAt: m.assignedAt,
          deletedAt: null,
        } as Borrower));
        setGroupMembers(members);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      console.error("Failed to load group members:", err);
      dialogs.error(err.message || "Failed to load group members");
      setGroupMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  // Load all active debtors for assignment dropdown
  const loadAvailableDebtors = useCallback(async () => {
    setLoadingDebtors(true);
    try {
      const res = await borrowersAPI.getAll({ includeDeleted: false, limit: 1000 });
      if (res.status) {
        setAvailableDebtors(res.data);
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      console.error("Failed to load debtors:", err);
      dialogs.error(err.message || "Failed to load debtors");
      setAvailableDebtors([]);
    } finally {
      setLoadingDebtors(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadGroups();
    loadAvailableDebtors();
  }, [loadGroups, loadAvailableDebtors]);

  // Reload members when selected group changes
  useEffect(() => {
    if (selectedGroup) {
      loadGroupMembers(selectedGroup.id);
    } else {
      setGroupMembers([]);
    }
  }, [selectedGroup, loadGroupMembers]);

  // --- CRUD operations ---
  const handleCreateGroup = async (data: { name: string; description: string; color: string }) => {
    try {
      const response = await groupsAPI.create({
        name: data.name,
        description: data.description || null,
        color: data.color,
      });
      if (response.status) {
        await loadGroups();
        dialogs.success("Group created successfully");
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  const handleUpdateGroup = async (id: number, data: Partial<DebtorGroup>) => {
    try {
      const response = await groupsAPI.update(id, {
        name: data.name,
        description: data.description ?? null,
        color: data.color,
      });
      if (response.status) {
        await loadGroups();
        if (selectedGroup?.id === id) {
          setSelectedGroup(response.data);
        }
        dialogs.success("Group updated");
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  const handleDeleteGroup = async (id: number) => {
    const confirmed = await dialogs.confirm({
      title: "Delete Group",
      message: "Are you sure? This will remove all debtor assignments from this group.",
    });
    if (!confirmed) return;
    try {
      const response = await groupsAPI.delete(id);
      if (response.status) {
        if (selectedGroup?.id === id) setSelectedGroup(null);
        await loadGroups();
        dialogs.success("Group deleted");
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  // --- Assignment operations ---
  const assignDebtor = async (debtorId: number) => {
    if (!selectedGroup) return;
    try {
      const response = await groupsAPI.assignDebtor(selectedGroup.id, debtorId);
      if (response.status) {
        await loadGroupMembers(selectedGroup.id);
        dialogs.success("Debtor assigned");
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  const removeDebtor = async (debtorId: number) => {
    if (!selectedGroup) return;
    try {
      const response = await groupsAPI.removeDebtor(selectedGroup.id, debtorId);
      if (response.status) {
        await loadGroupMembers(selectedGroup.id);
        dialogs.success("Debtor removed from group");
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  const bulkAssign = async (debtorIds: number[]) => {
    if (!selectedGroup || debtorIds.length === 0) return;
    try {
      const response = await groupsAPI.bulkAssign(selectedGroup.id, debtorIds);
      if (response.status) {
        await loadGroupMembers(selectedGroup.id);
        dialogs.success(`${debtorIds.length} debtor(s) assigned to group`);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  const refresh = () => {
    loadGroups();
    loadAvailableDebtors();
    if (selectedGroup) loadGroupMembers(selectedGroup.id);
  };

  return {
    groups,
    loadingGroups,
    selectedGroup,
    setSelectedGroup,
    groupMembers,
    loadingMembers,
    availableDebtors,
    loadingDebtors,
    createGroupModalOpen,
    openCreateGroupModal: () => setCreateGroupModalOpen(true),
    closeCreateGroupModal: () => setCreateGroupModalOpen(false),
    editGroupModalOpen,
    editingGroup,
    openEditGroupModal: (group) => {
      setEditingGroup(group);
      setEditGroupModalOpen(true);
    },
    closeEditGroupModal: () => {
      setEditGroupModalOpen(false);
      setEditingGroup(null);
    },
    handleCreateGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    assignDebtor,
    removeDebtor,
    bulkAssign,
    refresh,
  };
};

export default useDebtorGroups;