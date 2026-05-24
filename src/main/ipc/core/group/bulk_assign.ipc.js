// src/main/ipc/group/bulk_assign.ipc.js
const groupService = require("../../../../services/Group");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { groupId, debtorIds, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.post(`/api/v1/groups/${groupId}/bulk-assign`, { debtorIds, user });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Bulk assign completed on server", data: result };
  } else {
    const result = await groupService.bulkAssignDebtors(groupId, debtorIds, user, queryRunner);
    return { status: true, message: "Bulk assign completed locally", data: result };
  }
};