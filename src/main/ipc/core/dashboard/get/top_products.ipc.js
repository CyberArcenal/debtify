// src/main/ipc/dashboard/get/top_products.ipc.js
const Debt = require("../../../../../entities/Debt");
const { AppDataSource } = require("../../../../db/data-source");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const onlineClient = require("../../../../../utils/onlineClient");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);
    const response = await onlineClient.get('/api/v1/dashboard/top-products', { params });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return { status: true, message: "Top products retrieved from server", data: result.data };
  } else {
    const { limit = 5 } = params;
    const debtRepo = AppDataSource.getRepository(Debt);
    const topDebts = await debtRepo
      .createQueryBuilder("debt")
      .select("debt.name", "name")
      .addSelect("SUM(debt.totalAmount)", "totalValue")
      .where("debt.deletedAt IS NULL")
      .groupBy("debt.name")
      .orderBy("totalValue", "DESC")
      .limit(limit)
      .getRawMany();

    return {
      status: true,
      message: "Top products retrieved locally",
      data: topDebts.map(item => ({ name: item.name, totalValue: parseFloat(item.totalValue) })),
    };
  }
};