// src/main/ipc/group/delete.ipc.js
const groupService = require("../../../../services/Group");

module.exports = async (params, queryRunner) => {
  try {
    const { id, user } = params;
    if (!id) {
      return {
        status: false,
        message: "Group ID is required",
        data: null,
      };
    }
    await groupService.deleteGroup(id, user, queryRunner);
    return {
      status: true,
      message: "Group deleted successfully",
      data: null,
    };
  } catch (error) {
    console.error("Error in deleteGroup:", error);
    return {
      status: false,
      message: error.message || "Failed to delete group",
      data: null,
    };
  }
};