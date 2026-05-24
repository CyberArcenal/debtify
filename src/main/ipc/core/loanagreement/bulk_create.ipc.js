// src/main/ipc/core/loanagreement/bulk_create.ipc.js
const loanAgreementService = require("../../../../services/LoanAgreement");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { agreementsArray, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.post('/api/v1/loan-agreements/bulk', { agreementsArray, user });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Bulk create completed on server", data: result };
  } else {
    const result = await loanAgreementService.bulkCreate(agreementsArray, user, queryRunner);
    return { status: true, message: "Bulk create completed locally", data: result };
  }
};