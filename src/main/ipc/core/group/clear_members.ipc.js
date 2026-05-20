// src/main/ipc/group/clear_members.ipc.js
const groupService = require("../../../../services/Group");

module.exports = async (params, queryRunner) => {
  try {
    const { groupId, user } = params;
    if (!groupId) {
      return {
        status: false,
        message: "Group ID is required",
        data: null,
      };
    }
    await groupService.clearGroupMembers(groupId, user, queryRunner);
    return {
      status: true,
      message: "All members cleared from group successfully",
      data: null,
    };
  } catch (error) {
    console.error("Error in clearGroupMembers:", error);
    return {
      status: false,
      message: error.message || "Failed to clear group members",
      data: null,
    };
  }
};