// src/main/ipc/group/get/members.ipc.js
const groupService = require("../../../../../services/Group");

module.exports = async (params) => {
  try {
    const { groupId, page, limit } = params;
    if (!groupId) {
      return {
        status: false,
        message: "Group ID is required",
        data: null,
      };
    }
    const result = await groupService.getGroupMembers(groupId, page, limit);
    return {
      status: true,
      message: "Group members retrieved successfully",
      data: result,
    };
  } catch (error) {
    console.error("Error in getGroupMembers:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve group members",
      data: null,
    };
  }
};