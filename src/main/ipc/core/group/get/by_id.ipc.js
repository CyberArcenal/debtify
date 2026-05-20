// src/main/ipc/group/get/by_id.ipc.js
const groupService = require("../../../../../services/Group");

module.exports = async (params) => {
  try {
    const { id } = params;
    if (!id) {
      return {
        status: false,
        message: "Group ID is required",
        data: null,
      };
    }
    const group = await groupService.getGroupById(id);
    return {
      status: true,
      message: "Group retrieved successfully",
      data: group,
    };
  } catch (error) {
    console.error("Error in getGroupById:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve group",
      data: null,
    };
  }
};