// src/main/ipc/group/assign_debtor.ipc.js
//@ts-check

const groupService = require("../../../../services/Group");

module.exports = async (params, queryRunner) => {
  try {
    const { groupId, debtorId, user } = params;
    if (!groupId || !debtorId) {
      return {
        status: false,
        message: "Group ID and Debtor ID are required",
        data: null,
      };
    }
    const result = await groupService.assignDebtorToGroup(groupId, debtorId, user, queryRunner);
    return {
      status: true,
      message: "Debtor assigned to group successfully",
      data: result,
    };
  } catch (error) {
    console.error("Error in assignDebtorToGroup:", error);
    return {
      status: false,
      message: error.message || "Failed to assign debtor to group",
      data: null,
    };
  }
};