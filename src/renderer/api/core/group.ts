// src/renderer/api/core/group.ts
import type { PaginatedResult } from "./common";

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface DebtorGroup {
  id: number;
  name: string;
  description: string | null;
  color: string;          // hex color code
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  groupId: number;
  debtorId: number;
  assignedAt: string;
}

export interface GroupMemberWithDebtor extends GroupMember {
  debtor: {
    id: number;
    name: string;
    contact: string | null;
    email: string | null;
  };
}

export interface GroupCreateData {
  name: string;
  description?: string | null;
  color?: string;         // defaults to "#3b82f6"
}

export interface GroupUpdateData {
  name?: string;
  description?: string | null;
  color?: string;
}

export interface BulkAssignData {
  debtorIds: number[];
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface GroupResponse {
  status: boolean;
  message: string;
  data: DebtorGroup;
}

// ✅ Now returns paginated result for groups
export interface GroupsResponse {
  status: boolean;
  message: string;
  data: PaginatedResult<DebtorGroup>;
}

// ✅ Now returns paginated result for members
export interface GroupMembersResponse {
  status: boolean;
  message: string;
  data: PaginatedResult<GroupMemberWithDebtor>;
}

export interface BulkAssignResponse {
  status: boolean;
  message: string;
  data: { assignedCount: number };
}

export interface DeleteResponse {
  status: boolean;
  message: string;
}

// ----------------------------------------------------------------------
// 🧠 GroupsAPI Class
// ----------------------------------------------------------------------

class GroupsAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all debtor groups with pagination
   * @param page - Page number (default 1)
   * @param limit - Items per page (default 10)
   */
  async getAll(page?: number, limit?: number): Promise<GroupsResponse> {
    if (!window.backendAPI?.group) {
      throw new Error("Electron API (group) not available");
    }
    const response = await window.backendAPI.group({
      method: "getAllGroups",
      params: { page, limit },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch groups");
  }

  /**
   * Get a single group by ID
   */
  async getById(id: number): Promise<GroupResponse> {
    if (!window.backendAPI?.group) {
      throw new Error("Electron API (group) not available");
    }
    const response = await window.backendAPI.group({
      method: "getGroupById",
      params: { id },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch group");
  }

  /**
   * Get all members of a group (with debtor details) with pagination
   * @param groupId - Group ID
   * @param page - Page number (default 1)
   * @param limit - Items per page (default 20)
   */
  async getMembers(groupId: number, page?: number, limit?: number): Promise<GroupMembersResponse> {
    if (!window.backendAPI?.group) {
      throw new Error("Electron API (group) not available");
    }
    const response = await window.backendAPI.group({
      method: "getGroupMembers",
      params: { groupId, page, limit },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch group members");
  }

  /**
   * Get groups for a specific debtor with pagination
   * @param debtorId - Debtor ID
   * @param page - Page number (default 1)
   * @param limit - Items per page (default 10)
   */
  async getGroupsForDebtor(debtorId: number, page?: number, limit?: number): Promise<GroupsResponse> {
    if (!window.backendAPI?.group) {
      throw new Error("Electron API (group) not available");
    }
    const response = await window.backendAPI.group({
      method: "getGroupsForDebtor",
      params: { debtorId, page, limit },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to fetch groups for debtor");
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS (unchanged)
  // --------------------------------------------------------------------

  async create(data: GroupCreateData, user = "system"): Promise<GroupResponse> {
    if (!window.backendAPI?.group) {
      throw new Error("Electron API (group) not available");
    }
    const response = await window.backendAPI.group({
      method: "createGroup",
      params: { data, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to create group");
  }

  async update(id: number, data: GroupUpdateData, user = "system"): Promise<GroupResponse> {
    if (!window.backendAPI?.group) {
      throw new Error("Electron API (group) not available");
    }
    const response = await window.backendAPI.group({
      method: "updateGroup",
      params: { id, data, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to update group");
  }

  async delete(id: number, user = "system"): Promise<DeleteResponse> {
    if (!window.backendAPI?.group) {
      throw new Error("Electron API (group) not available");
    }
    const response = await window.backendAPI.group({
      method: "deleteGroup",
      params: { id, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to delete group");
  }

  async assignDebtor(groupId: number, debtorId: number, user = "system"): Promise<DeleteResponse> {
    if (!window.backendAPI?.group) {
      throw new Error("Electron API (group) not available");
    }
    const response = await window.backendAPI.group({
      method: "assignDebtorToGroup",
      params: { groupId, debtorId, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to assign debtor to group");
  }

  async bulkAssign(groupId: number, debtorIds: number[], user = "system"): Promise<BulkAssignResponse> {
    if (!window.backendAPI?.group) {
      throw new Error("Electron API (group) not available");
    }
    const response = await window.backendAPI.group({
      method: "bulkAssignDebtors",
      params: { groupId, debtorIds, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to bulk assign debtors");
  }

  async removeDebtor(groupId: number, debtorId: number, user = "system"): Promise<DeleteResponse> {
    if (!window.backendAPI?.group) {
      throw new Error("Electron API (group) not available");
    }
    const response = await window.backendAPI.group({
      method: "removeDebtorFromGroup",
      params: { groupId, debtorId, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to remove debtor from group");
  }

  async clearMembers(groupId: number, user = "system"): Promise<DeleteResponse> {
    if (!window.backendAPI?.group) {
      throw new Error("Electron API (group) not available");
    }
    const response = await window.backendAPI.group({
      method: "clearGroupMembers",
      params: { groupId, user },
    });
    if (response.status) return response;
    throw new Error(response.message || "Failed to clear group members");
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if a debtor is already in a group
   * (Note: this method now uses pagination but defaults to first page only)
   */
  async isDebtorInGroup(groupId: number, debtorId: number): Promise<boolean> {
    try {
      const members = await this.getMembers(groupId, 1, 100); // fetch up to 100 members
      return members.data.data.some(m => m.debtorId === debtorId);
    } catch (error) {
      console.error("Error checking debtor in group:", error);
      return false;
    }
  }

  /**
   * Validate if the backend API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.group);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const groupsAPI = new GroupsAPI();
export default groupsAPI;