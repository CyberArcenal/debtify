// src/utils/agreementFileStorage.js
//@ts-check
const fs = require("fs").promises;
const path = require("path");
const { app } = require("electron");
const { protocol } = require("electron");
const mime = require("mime-types");

const AGREEMENTS_DIR = path.join(app.getPath("userData"), "agreements");

async function ensureDirectory() {
  await fs.mkdir(AGREEMENTS_DIR, { recursive: true });
}

/**
 * Save an agreement file (PDF) from buffer.
 * @param {Buffer} fileBuffer - The file data
 * @param {string} originalName - Original filename (for extension)
 * @returns {Promise<string>} - Relative path (e.g., "agreements/1678901234567_abc123.pdf")
 */
async function saveAgreementFile(fileBuffer, originalName) {
  await ensureDirectory();
  const ext = path.extname(originalName) || ".pdf";
  const safeName = `${Date.now()}_${Math.random().toString(36).substr(2, 12)}${ext}`;
  const destPath = path.join(AGREEMENTS_DIR, safeName);
  await fs.writeFile(destPath, fileBuffer);
  return path.join("agreements", safeName); // store relative path
}

/**
 * Delete an agreement file by its stored relative path.
 * @param {string|null} relativePath
 */
async function deleteAgreementFile(relativePath) {
  if (!relativePath) return;
  const fullPath = path.isAbsolute(relativePath)
    ? relativePath
    : path.join(app.getPath("userData"), relativePath);
  try {
    await fs.unlink(fullPath);
  } catch (err) {
    // @ts-ignore
    console.warn(`Failed to delete agreement file: ${fullPath}`, err.message);
  }
}

/**
 * Get full filesystem path (for internal use, not exposed to client).
 * @param {string} relativePath
 */
function getAgreementFullPath(relativePath) {
  if (!relativePath) return null;
  return path.isAbsolute(relativePath)
    ? relativePath
    : path.join(app.getPath("userData"), relativePath);
}

function registerFileStorage() {
  // Register custom protocol for serving agreement files
  protocol.handle("agreement-file", async (request) => {
    const url = new URL(request.url);
    let relativePath = decodeURIComponent(url.pathname);
    if (relativePath.startsWith("/")) relativePath = relativePath.slice(1);
    const fullPath = path.join(app.getPath("userData"), relativePath);
    try {
      await fs.access(fullPath);
      const fileBuffer = await fs.readFile(fullPath);
      const mimeType = mime.lookup(fullPath) || "application/pdf";
      return new Response(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `inline; filename="${path.basename(fullPath)}"`,
        },
      });
    } catch (err) {
      return new Response("File not found", { status: 404 });
    }
  });
}

module.exports = {
  saveAgreementFile,
  deleteAgreementFile,
  getAgreementFullPath,
  registerFileStorage
};
