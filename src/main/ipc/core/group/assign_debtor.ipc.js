// src/main/ipc/group/assign_debtor.ipc.js
const groupService = require("../../../../services/Group");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { groupId, debtorId, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.post(`/api/v1/groups/${groupId}/assign`, { debtorId, user });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Debtor assigned on server", data: result };
  } else {
    const result = await groupService.assignDebtorToGroup(groupId, debtorId, user, queryRunner);
    return { status: true, message: "Debtor assigned locally", data: result };
  }
};