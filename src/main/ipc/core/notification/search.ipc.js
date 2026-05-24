// src/main/ipc/core/notification/search.ipc.js
const notificationService = require("../../../../services/Notification");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params) => {
  const { searchTerm, page, limit, type, isRead, debtId } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get("/api/v1/notifications/search", {
      params: { searchTerm, page, limit, type, isRead, debtId },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Search completed on server", data: result };
  } else {
    const options = { search: searchTerm, page, limit, type, isRead, debtId };
    const notifications = await notificationService.findAll(options);
    return { status: true, message: "Search completed locally", data: notifications };
  }
};