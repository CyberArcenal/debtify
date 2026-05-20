// src/main/ipc/group/update.ipc.js
const groupService = require("../../../../services/Group");

module.exports = async (params, queryRunner) => {
  try {
    const { id, data, user } = params;
    if (!id) {
      return {
        status: false,
        message: "Group ID is required",
        data: null,
      };
    }
    const updated = await groupService.updateGroup(id, data, user, queryRunner);
    return {
      status: true,
      message: "Group updated successfully",
      data: updated,
    };
  } catch (error) {
    console.error("Error in updateGroup:", error);
    return {
      status: false,
      message: error.message || "Failed to update group",
      data: null,
    };
  }
};