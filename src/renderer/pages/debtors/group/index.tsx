// src/renderer/pages/debtors/group/index.tsx
import React, { useState } from "react";
import { Users, Layers } from "lucide-react";
import useDebtorGroups from "./hooks/useDebtorGroups";
import GroupList from "./components/GroupList";
import GroupMembers from "./components/GroupMembers";
import GroupFormDialog from "./components/GroupFormDialog";
import Pagination from "../../../components/Shared/Pagination";
import { dialogs } from "../../../utils/dialogs";
import DebtorViewDialog from "../components/DebtorViewDialog";
import DebtorFormDialog from "../components/DebtorFormDialog";

const DebtorGroupsPage: React.FC = () => {
  const {
    groups,
    loadingGroups,
    selectedGroup,
    setSelectedGroup,
    groupMembers,
    loadingMembers,
    membersPagination,
    membersCurrentPage,
    setMembersCurrentPage,
    membersPageSize,
    setMembersPageSize,
    availableDebtors,
    loadingDebtors,
    createGroupModalOpen,
    openCreateGroupModal,
    closeCreateGroupModal,
    editGroupModalOpen,
    editingGroup,
    openEditGroupModal,
    closeEditGroupModal,
    handleCreateGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    assignDebtor,
    removeDebtor,
    bulkAssign,
    refresh,
  } = useDebtorGroups();

  const [viewOpen, setViewOpen] = useState(false);
  const [viewingDebtor, setViewingDebtor] = useState<any>(null);

  const openView = (debtor: any) => {
    console.log(debtor);
    setViewingDebtor(debtor);
    setViewOpen(true);
  };
  return (
    <div className="m-1 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-6 h-6 text-[var(--primary-color)]" />
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--sidebar-text)" }}
        >
          Debtor Groups / Segments
        </h1>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
        {/* Left: Group List */}
        <div className="md:col-span-1 min-h-0">
          <GroupList
            groups={groups}
            selectedGroup={selectedGroup}
            onSelectGroup={setSelectedGroup}
            onAddGroup={openCreateGroupModal}
            onEditGroup={openEditGroupModal}
            onDeleteGroup={handleDeleteGroup}
            loading={loadingGroups}
          />
        </div>

        {/* Right: Group Members */}
        <div className="md:col-span-2 min-h-0 flex flex-col">
          {selectedGroup ? (
            <>
              <div className="flex-1 overflow-auto">
                <GroupMembers
                  groupName={selectedGroup.name}
                  members={groupMembers}
                  loading={loadingMembers}
                  availableDebtors={availableDebtors}
                  onView={openView}
                  onAssign={assignDebtor}
                  onRemove={async (debtorId: number) => {
                    if (
                      await dialogs.confirm({
                        title: "Remove Member",
                        message:
                          "Are you sure do you want to remove this member?",
                      })
                    ) {
                      removeDebtor(debtorId);
                    }
                  }}
                  onBulkAssign={bulkAssign}
                />
              </div>
              {/* Pagination for members */}
              {membersPagination.totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={membersCurrentPage}
                    totalItems={membersPagination.totalItems}
                    pageSize={membersPageSize}
                    onPageChange={setMembersCurrentPage}
                    onPageSizeChange={setMembersPageSize}
                    pageSizeOptions={[10, 20, 50]}
                    showPageSize={true}
                  />
                </div>
              )}
            </>
          ) : (
            <div
              className="rounded-md border h-full flex items-center justify-center"
              style={{
                backgroundColor: "var(--card-secondary-bg)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="text-center text-[var(--text-tertiary)]">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Select a group to view its members</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <GroupFormDialog
        isOpen={createGroupModalOpen}
        mode="create"
        group={null}
        onClose={closeCreateGroupModal}
        onSubmit={handleCreateGroup}
      />
      <GroupFormDialog
        isOpen={editGroupModalOpen}
        mode="edit"
        group={editingGroup}
        onClose={closeEditGroupModal}
        onSubmit={(data) =>
          editingGroup && handleUpdateGroup(editingGroup.id, data)
        }
      />

      <DebtorViewDialog
        debtorId={viewingDebtor?.id}
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
      />
    </div>
  );
};

export default DebtorGroupsPage;
