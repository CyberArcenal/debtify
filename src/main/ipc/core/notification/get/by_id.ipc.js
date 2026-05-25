// src/main/ipc/core/notification/get/by_id.ipc.js
const notificationService = require("../../../../../services/Notification");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const { id, includeDeleted = false } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get(`/api/v1/notifications/${id}`, { params: { includeDeleted } });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const notification = await response.json();
    return { status: true, message: "Notification retrieved from server", data: notification };
  } else {
    const notification = await notificationService.findById(id, includeDeleted);
    return { status: true, message: "Notification retrieved locally", data: notification };
  }
};