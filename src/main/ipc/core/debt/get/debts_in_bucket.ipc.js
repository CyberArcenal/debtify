// src/main/ipc/debt/get/debts_in_bucket.ipc.js
const debtService = require("../../../../../services/Debt");
const onlineClient = require("../../../../../utils/onlineClient");
const { serverUrl, syncMode } = require("../../../../../utils/system");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get('/api/v1/debts/bucket', { params });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Debts in bucket retrieved from server", data: result };
  } else {
    const { bucketRange, asOfDate, page = 1, limit = 10 } = params;
    const result = await debtService.getDebtsInBucket(bucketRange, asOfDate, page, limit);
    return { status: true, message: "Debts in bucket retrieved locally", data: result };
  }
};