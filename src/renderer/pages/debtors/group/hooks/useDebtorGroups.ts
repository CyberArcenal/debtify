// src/renderer/pages/debtors/group/hooks/useDebtorGroups.ts
import { useState, useEffect, useCallback } from "react";
import { dialogs } from "../../../../utils/dialogs";
import borrowersAPI from "../../../../api/core/borrower";
import type { Borrower } from "../../../../api/core/borrower";
import type { DebtorGroup } from "../types";
import {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getDebtorIdsForGroup,
  assignDebtorToGroup,
  removeDebtorFromGroup,
  bulkAssignDebtorsToGroup,
  removeAllDebtorsFromGroup,
} from "../mockGroupService";

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

  const loadGroups = useCallback(() => {
    setLoadingGroups(true);
    try {
      const allGroups = getGroups();
      setGroups(allGroups);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  const loadGroupMembers = useCallback(async (groupId: number) => {
    setLoadingMembers(true);
    try {
      const debtorIds = getDebtorIdsForGroup(groupId);
      if (debtorIds.length === 0) {
        setGroupMembers([]);
        return;
      }
      // Fetch debtors one by one (or batch if API supports)
      const members: Borrower[] = [];
      for (const id of debtorIds) {
        try {
          const res = await borrowersAPI.getById(id);
          if (res.status) members.push(res.data);
        } catch (e) { console.error(e); }
      }
      setGroupMembers(members);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  const loadAvailableDebtors = useCallback(async () => {
    setLoadingDebtors(true);
    try {
      const res = await borrowersAPI.getAll({ includeDeleted: false, limit: 1000 });
      if (res.status) setAvailableDebtors(res.data);
      else setAvailableDebtors([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDebtors(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
    loadAvailableDebtors();
  }, [loadGroups, loadAvailableDebtors]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupMembers(selectedGroup.id);
    } else {
      setGroupMembers([]);
    }
  }, [selectedGroup, loadGroupMembers]);

  const handleCreateGroup = async (data: { name: string; description: string; color: string }) => {
    try {
      createGroup(data);
      loadGroups();
      dialogs.success("Group created successfully");
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  const handleUpdateGroup = async (id: number, data: Partial<DebtorGroup>) => {
    try {
      updateGroup(id, data);
      loadGroups();
      if (selectedGroup?.id === id) {
        const updated = getGroups().find(g => g.id === id);
        setSelectedGroup(updated || null);
      }
      dialogs.success("Group updated");
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
      deleteGroup(id);
      if (selectedGroup?.id === id) setSelectedGroup(null);
      loadGroups();
      dialogs.success("Group deleted");
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  const assignDebtor = async (debtorId: number) => {
    if (!selectedGroup) return;
    try {
      assignDebtorToGroup(debtorId, selectedGroup.id);
      await loadGroupMembers(selectedGroup.id);
      dialogs.success("Debtor assigned");
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  const removeDebtor = async (debtorId: number) => {
    if (!selectedGroup) return;
    try {
      removeDebtorFromGroup(debtorId, selectedGroup.id);
      await loadGroupMembers(selectedGroup.id);
      dialogs.success("Debtor removed from group");
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  const bulkAssign = async (debtorIds: number[]) => {
    if (!selectedGroup || debtorIds.length === 0) return;
    try {
      bulkAssignDebtorsToGroup(debtorIds, selectedGroup.id);
      await loadGroupMembers(selectedGroup.id);
      dialogs.success(`${debtorIds.length} debtor(s) assigned to group`);
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