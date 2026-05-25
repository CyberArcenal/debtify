const loanAgreementService = require("../../../../services/LoanAgreement");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");

module.exports = async (params, queryRunner) => {
  const { id, user = "system", allowDeleteSigned = false } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.delete(`/api/v1/loan-agreements/permanent/${id}?allowDeleteSigned=${allowDeleteSigned}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    return { status: true, message: "Loan agreement permanently deleted on server", data: null };
  } else {
    await loanAgreementService.permanentlyDelete(id, user, queryRunner, allowDeleteSigned);
    return { status: true, message: "Loan agreement permanently deleted locally", data: null };
  }
};