// src/main/ipc/group/get/members.ipc.js
const groupService = require("../../../../../services/Group");

module.exports = async (params) => {
  try {
    const { groupId } = params;
    if (!groupId) {
      return {
        status: false,
        message: "Group ID is required",
        data: null,
      };
    }
    const members = await groupService.getGroupMembers(groupId);
    return {
      status: true,
      message: "Group members retrieved successfully",
      data: members,
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