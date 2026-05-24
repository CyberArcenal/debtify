// src/main/ipc/core/loanagreement/get/all.ipc.js
const loanAgreementService = require("../../../../../services/LoanAgreement");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get("/api/v1/loan-agreements", {
      params,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return {
      status: true,
      message: "Loan agreements retrieved from server",
      data: result,
    };
  } else {
    const {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      includeDeleted,
      debtId,
      borrowerId,
      lenderName,
      agreementDateFrom,
      agreementDateTo,
    } = params;
    const options = {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      includeDeleted,
      debtId,
      borrowerId,
      lenderName,
      agreementDateFrom,
      agreementDateTo,
    };
    const agreements = await loanAgreementService.findAll(options);
    return {
      status: true,
      message: "Loan agreements retrieved locally",
      data: agreements,
    };
  }
};
