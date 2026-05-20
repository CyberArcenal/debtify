// src/main/ipc/core/group/index.ipc.js
//@ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../../utils/logger");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const { AppDataSource } = require("../../../db/data-source");

class GroupHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getAllGroups = this.importHandler("./get/all.ipc");
    this.getGroupById = this.importHandler("./get/by_id.ipc");
    this.getGroupMembers = this.importHandler("./get/members.ipc");
    this.getGroupsForDebtor = this.importHandler("./get/by_debtor.ipc");

    // ✏️ WRITE OPERATION HANDLERS
    this.createGroup = this.importHandler("./create.ipc");
    this.updateGroup = this.importHandler("./update.ipc");
    this.deleteGroup = this.importHandler("./delete.ipc");
    this.assignDebtorToGroup = this.importHandler("./assign_debtor.ipc");
    this.bulkAssignDebtors = this.importHandler("./bulk_assign.ipc");
    this.removeDebtorFromGroup = this.importHandler("./remove_debtor.ipc");
    this.clearGroupMembers = this.importHandler("./clear_members.ipc");
  }

  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      console.warn(`[GroupHandler] Failed to load handler: ${path}`, error.message);
      return async () => ({
        status: false,
        message: `Handler not implemented: ${path}`,
        data: null,
      });
    }
  }

  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};

      logger?.info(`GroupHandler: ${method}`, { params });

      switch (method) {
        // 📋 READ-ONLY
        case "getAllGroups":
          return await this.getAllGroups(params);
        case "getGroupById":
          return await this.getGroupById(params);
        case "getGroupMembers":
          return await this.getGroupMembers(params);
        case "getGroupsForDebtor":
          return await this.getGroupsForDebtor(params);

        // ✏️ WRITE (with transaction)
        case "createGroup":
          return await this.handleWithTransaction(this.createGroup, params);
        case "updateGroup":
          return await this.handleWithTransaction(this.updateGroup, params);
        case "deleteGroup":
          return await this.handleWithTransaction(this.deleteGroup, params);
        case "assignDebtorToGroup":
          return await this.handleWithTransaction(this.assignDebtorToGroup, params);
        case "bulkAssignDebtors":
          return await this.handleWithTransaction(this.bulkAssignDebtors, params);
        case "removeDebtorFromGroup":
          return await this.handleWithTransaction(this.removeDebtorFromGroup, params);
        case "clearGroupMembers":
          return await this.handleWithTransaction(this.clearGroupMembers, params);

        default:
          return {
            status: false,
            message: `Unknown group method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("GroupHandler error:", error);
      logger?.error("GroupHandler error:", error);
      return {
        status: false,
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  async handleWithTransaction(handler, params) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await handler(params, queryRunner);
      if (result.status) {
        await queryRunner.commitTransaction();
      } else {
        await queryRunner.rollbackTransaction();
      }
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

const groupHandler = new GroupHandler();
ipcMain.handle(
  "group",
  withErrorHandling(groupHandler.handleRequest.bind(groupHandler), "IPC:group"),
);

module.exports = { GroupHandler, groupHandler };