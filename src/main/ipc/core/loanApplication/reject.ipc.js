// src/main/ipc/core/loanApplication/reject.ipc.js
const loanApplicationService = require("../../../../services/LoanApplication");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { id, reason = null, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.post(`/api/v1/loan-applications/reject/${id}`, { reason, user });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Loan application rejected on server", data: result };
  } else {
    const result = await loanApplicationService.rejectApplication(id, reason, user, queryRunner);
    return { status: true, message: "Loan application rejected locally", data: result };
  }
};