// src/main/ipc/group/remove_debtor.ipc.js
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
    await groupService.removeDebtorFromGroup(groupId, debtorId, user, queryRunner);
    return {
      status: true,
      message: "Debtor removed from group successfully",
      data: null,
    };
  } catch (error) {
    console.error("Error in removeDebtorFromGroup:", error);
    return {
      status: false,
      message: error.message || "Failed to remove debtor from group",
      data: null,
    };
  }
};