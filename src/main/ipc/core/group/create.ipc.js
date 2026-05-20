// src/main/ipc/group/create.ipc.js
const groupService = require("../../../../services/Group");

module.exports = async (params, queryRunner) => {
  try {
    const { data, user } = params;
    const saved = await groupService.createGroup(data, user, queryRunner);
    return {
      status: true,
      message: "Group created successfully",
      data: saved,
    };
  } catch (error) {
    console.error("Error in createGroup:", error);
    return {
      status: false,
      message: error.message || "Failed to create group",
      data: null,
    };
  }
};