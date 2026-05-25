// src/utils/agreementFileStorage.js
const fs = require("fs").promises;
const path = require("path");
const mime = require("mime-types");

// ----------------------------------------------------------------------
//  Determine storage directory (works in both Electron and plain Node)
// ----------------------------------------------------------------------
let AGREEMENTS_DIR;
let app = null;
let protocol = null;

try {
  // Try to load Electron modules (only available in Electron main process)
  const electron = require("electron");
  app = electron.app;
  protocol = electron.protocol;
} catch (err) {
  // Not running inside Electron – CLI mode (TypeORM, seeding, etc.)
  console.log("[agreementFileStorage] Running outside Electron, using fallback storage.");
}

if (app && typeof app.getPath === "function") {
  // Electron main process: use secure userData folder
  AGREEMENTS_DIR = path.join(app.getPath("userData"), "agreements");
} else {
  // Fallback for CLI / development outside Electron
  AGREEMENTS_DIR = path.join(process.cwd(), "data", "agreements");
}

// ----------------------------------------------------------------------
//  Core file operations
// ----------------------------------------------------------------------
async function ensureDirectory() {
  await fs.mkdir(AGREEMENTS_DIR, { recursive: true });
}

/**
 * Save an agreement file from buffer.
 * @param {Buffer} fileBuffer
 * @param {string} originalName
 * @returns {Promise<string>} relative path (e.g., "agreements/123_abc.pdf")
 */
async function saveAgreementFile(fileBuffer, originalName) {
  await ensureDirectory();
  const ext = path.extname(originalName) || ".pdf";
  const safeName = `${Date.now()}_${Math.random().toString(36).substr(2, 12)}${ext}`;
  const destPath = path.join(AGREEMENTS_DIR, safeName);
  await fs.writeFile(destPath, fileBuffer);
  console.log("File saved to:", destPath);
  // store relative path (always relative to userData in Electron, or to cwd in fallback)
  const relativePath = path.join("agreements", safeName);
  return relativePath;
}

/**
 * Delete an agreement file by its stored relative path.
 * @param {string|null} relativePath
 */
async function deleteAgreementFile(relativePath) {
  if (!relativePath) return;
  let fullPath;
  if (path.isAbsolute(relativePath)) {
    fullPath = relativePath;
  } else {
    // In Electron, relativePath is relative to userData; in fallback, relative to cwd
    const baseDir = (app && app.getPath) ? app.getPath("userData") : process.cwd();
    fullPath = path.join(baseDir, relativePath);
  }
  try {
    await fs.unlink(fullPath);
  } catch (err) {
    console.warn(`Failed to delete agreement file: ${fullPath}`, err.message);
  }
}

/**
 * Get full filesystem path (for internal use).
 * @param {string} relativePath
 * @returns {string|null}
 */
function getAgreementFullPath(relativePath) {
  if (!relativePath) return null;
  if (path.isAbsolute(relativePath)) return relativePath;
  const baseDir = (app && app.getPath) ? app.getPath("userData") : process.cwd();
  return path.join(baseDir, relativePath);
}

// ----------------------------------------------------------------------
//  Custom protocol registration (only in Electron main process)
// ----------------------------------------------------------------------
function registerFileStorage() {
  // Only register if we are inside Electron and protocol is available
  if (!protocol || typeof protocol.handle !== "function") {
    console.warn("[agreementFileStorage] Protocol registration skipped – not in Electron main process.");
    return;
  }

  protocol.handle("agreement-file", async (request) => {
    try {
      const url = new URL(request.url);
      let relativePath = decodeURIComponent(url.pathname);
      if (relativePath.startsWith("/")) relativePath = relativePath.slice(1);

      let fullPath;
      const userData = (app && app.getPath) ? app.getPath("userData") : process.cwd();

      if (relativePath.startsWith("agreements/")) {
        fullPath = path.join(userData, relativePath);
      } else if (path.isAbsolute(relativePath)) {
        fullPath = relativePath;
      } else {
        fullPath = path.join(userData, "agreements", relativePath);
      }

      // Security: ensure resolved path stays inside the agreements directory
      const resolvedPath = path.resolve(fullPath);
      const agreementsDir = path.join(userData, "agreements");
      if (!resolvedPath.startsWith(agreementsDir)) {
        console.error(`Security: Attempt to access outside agreements dir: ${resolvedPath}`);
        return new Response("Forbidden", { status: 403 });
      }

      await fs.access(resolvedPath);
      const fileBuffer = await fs.readFile(resolvedPath);
      const mimeType = mime.lookup(resolvedPath) || "application/pdf";

      return new Response(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `inline; filename="${path.basename(resolvedPath)}"`,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    } catch (err) {
      console.error("Agreement file not found or error:", err);
      return new Response("File not found", { status: 404 });
    }
  });
}

/**
 * Returns a fully qualified agreement-file:// URL for the renderer.
 * @param {string|null} relativePath
 * @returns {string|null}
 */
function getAgreementFileUrl(relativePath) {
  if (!relativePath) return null;
  const cleanPath = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
  return `agreement-file:///${cleanPath}`;
}

module.exports = {
  saveAgreementFile,
  deleteAgreementFile,
  getAgreementFullPath,
  registerFileStorage,
  getAgreementFileUrl,
};