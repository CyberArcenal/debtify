// src/main/ipc/group/get/by_debtor.ipc.js
const groupService = require("../../../../../services/Group");

module.exports = async (params) => {
  try {
    const { debtorId, page, limit } = params;
    if (!debtorId) {
      return {
        status: false,
        message: "Debtor ID is required",
        data: null,
      };
    }
    const result = await groupService.getGroupsForDebtor(debtorId, page, limit);
    return {
      status: true,
      message: "Groups for debtor retrieved successfully",
      data: result,
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