import fs from "node:fs";
import path from "node:path";

const maxBackupsPerFile = 100;

function backupTimestamp() {
  return new Date().toISOString().replace(/[-:.]/g, "");
}

function backupPrefix(filePath) {
  return `${path.basename(filePath)}.`;
}

function pruneOldBackups(backupDir, filePath) {
  const prefix = backupPrefix(filePath);
  const backups = fs.readdirSync(backupDir)
    .filter((name) => name.startsWith(prefix) && name.endsWith(".bak"))
    .map((name) => {
      const fullPath = path.join(backupDir, name);
      return { name, fullPath, mtimeMs: fs.statSync(fullPath).mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  for (const backup of backups.slice(maxBackupsPerFile)) {
    fs.unlinkSync(backup.fullPath);
  }
}

export function backupFileBeforeWrite(filePath) {
  if (!fs.existsSync(filePath)) return null;

  const backupDir = path.join(path.dirname(filePath), "auto-backups");
  fs.mkdirSync(backupDir, { recursive: true });

  const suffix = `${backupTimestamp()}-${Math.random().toString(16).slice(2, 8)}`;
  const backupPath = path.join(backupDir, `${path.basename(filePath)}.${suffix}.bak`);
  fs.copyFileSync(filePath, backupPath);
  pruneOldBackups(backupDir, filePath);

  return backupPath;
}

export function writeJsonFileWithBackup(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  backupFileBeforeWrite(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
