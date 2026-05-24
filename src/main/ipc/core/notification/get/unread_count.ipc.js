// src/main/ipc/core/notification/get/unread_count.ipc.js
const notificationService = require("../../../../../services/Notification");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const { debtId, type, includeDeleted = false } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get("/api/v1/notifications/unread-count", { params: { debtId, type, includeDeleted } });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Unread count retrieved from server", data: result };
  } else {
    const count = await notificationService.getUnreadCount({ debtId, type }, includeDeleted);
    return { status: true, message: "Unread count retrieved locally", data: { count } };
  }
};