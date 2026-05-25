// src/main/ipc/core/loanagreement/create.ipc.js
const loanAgreementService = require("../../../../services/LoanAgreement");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { data, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    // For file uploads, we would need multipart/form-data; for now assume JSON.
    // If files are involved, keep offline or implement separately.
    const response = await onlineClient.post('/api/v1/loan-agreements', data);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Loan agreement created on server", data: result };
  } else {
    const result = await loanAgreementService.create(data, user, queryRunner);
    return { status: true, message: "Loan agreement created locally", data: result };
  }
};