// src/main/ipc/group/get/all.ipc.js
//@ts-check

const groupService = require("../../../../../services/Group");

module.exports = async (params) => {
  try {
    const groups = await groupService.getAllGroups();
    return {
      status: true,
      message: "Groups retrieved successfully",
      data: groups,
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