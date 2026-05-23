const paymentTransactionService = require("../../../../../services/PaymentTransaction");

module.exports = async (params) => {
  const { fromDate, toDate, target } = params;
  const report = await paymentTransactionService.getCollectionReport(fromDate, toDate, target);
  return { status: true, message: "Collection report generated", data: report };
};