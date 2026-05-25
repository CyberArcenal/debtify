// src/main/ipc/borrower/get/statistics.ipc.js
const borrowerService = require("../../../../../services/Borrower");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async () => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get('/api/v1/borrowers/statistics');
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Statistics retrieved from server", data: result };
  } else {
    const stats = await borrowerService.getStatistics();
    return { status: true, message: "Statistics retrieved locally", data: stats };
  }
};