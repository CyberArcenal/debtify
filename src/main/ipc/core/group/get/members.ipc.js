// src/main/ipc/group/get/members.ipc.js
const groupService = require("../../../../../services/Group");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const { groupId, page, limit } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get(`/api/v1/groups/${groupId}/members`, { params: { page, limit } });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Group members retrieved from server", data: result };
  } else {
    const result = await groupService.getGroupMembers(groupId, page, limit);
    return { status: true, message: "Group members retrieved locally", data: result };
  }
};