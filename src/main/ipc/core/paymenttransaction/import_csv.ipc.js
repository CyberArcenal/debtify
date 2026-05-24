// src/main/ipc/core/paymenttransaction/import_csv.ipc.js
const paymentTransactionService = require("../../../../services/PaymentTransaction");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const FormData = require("form-data");
const fs = require("fs");

module.exports = async (params, queryRunner) => {
  const { filePath, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));
    formData.append("user", user);
    const response = await onlineClient.post("/api/v1/payment-transactions/import-csv", formData, {
      headers: formData.getHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "CSV import completed on server", data: result };
  } else {
    const result = await paymentTransactionService.importFromCSV(filePath, user, queryRunner);
    return { status: true, message: "CSV import completed locally", data: result };
  }
};