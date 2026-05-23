// src/main/ipc/borrower/search.ipc.js
const borrowerService = require("../../../../services/Borrower");

module.exports = async (params) => {
  const { searchTerm, page, limit } = params;
  const options = { search: searchTerm, page, limit };
  const result = await borrowerService.findAll(options);
  return { status: true, message: "Search completed", data: result };
};