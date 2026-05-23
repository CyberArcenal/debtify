// src/main/ipc/group/get/all.ipc.js
//@ts-check

const groupService = require("../../../../../services/Group");

module.exports = async (params) => {
  try {
    const { page, limit } = params;
    const result = await groupService.getAllGroups(page, limit);
    return {
      status: true,
      message: "Groups retrieved successfully",
      data: result,
    };
  } catch (error) {
    console.error("Error in getAllGroups:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve groups",
      data: null,
    };
  }
};