// src/main/ipc/borrower/import_csv.ipc.js
const borrowerService = require("../../../../services/Borrower");
const { syncMode, serverUrl } = require("../../../../utils/system");
const onlineClient = require("../../../../utils/onlineClient");
const fs = require("fs").promises;

module.exports = async (params, queryRunner) => {
  const { filePath, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    
    // Read file content to send to server
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const response = await onlineClient.post('/api/v1/borrowers/import', {
      fileContent,
      fileName: filePath.split(/[/\\]/).pop(),
      user,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "CSV import completed on server", data: result };
  } else {
    const result = await borrowerService.importFromCSV(filePath, user, queryRunner);
    return { status: true, message: "CSV import completed locally", data: result };
  }
};