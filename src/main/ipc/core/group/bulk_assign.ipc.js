// src/main/ipc/group/bulk_assign.ipc.js
const groupService = require("../../../../services/Group");

module.exports = async (params, queryRunner) => {
  try {
    const { groupId, debtorIds, user } = params;
    if (!groupId || !debtorIds || !Array.isArray(debtorIds) || debtorIds.length === 0) {
      return {
        status: false,
        message: "Group ID and a non-empty array of debtor IDs are required",
        data: null,
      };
    }
    const result = await groupService.bulkAssignDebtors(groupId, debtorIds, user, queryRunner);
    return {
      status: true,
      message: `${result.assignedCount} debtors assigned to group successfully`,
      data: result,
    };
  } catch (error) {
    console.error("Error in bulkAssignDebtors:", error);
    return {
      status: false,
      message: error.message || "Failed to bulk assign debtors",
      data: null,
    };
  }
};