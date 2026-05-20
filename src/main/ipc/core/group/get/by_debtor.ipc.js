// src/main/ipc/group/get/by_debtor.ipc.js
const groupService = require("../../../../../services/Group");

module.exports = async (params) => {
  try {
    const { debtorId } = params;
    if (!debtorId) {
      return {
        status: false,
        message: "Debtor ID is required",
        data: null,
      };
    }
    const groups = await groupService.getGroupsForDebtor(debtorId);
    return {
      status: true,
      message: "Groups for debtor retrieved successfully",
      data: groups,
    };
  } catch (error) {
    console.error("Error in getGroupsForDebtor:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve groups for debtor",
      data: null,
    };
  }
};