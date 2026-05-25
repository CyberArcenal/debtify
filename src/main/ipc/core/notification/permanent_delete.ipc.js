// src/main/ipc/core/notification/permanent_delete.ipc.js
const notificationService = require("../../../../services/Notification");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { id, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.delete(`/api/v1/notifications/permanent/${id}`, { data: { user } });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    return { status: true, message: "Notification permanently deleted on server", data: null };
  } else {
    await notificationService.permanentlyDelete(id, user, queryRunner);
    return { status: true, message: "Notification permanently deleted locally", data: null };
  }
};