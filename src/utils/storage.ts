import { environment } from "@raycast/api";
import { promises as fs } from "fs";
import * as path from "path";
import type { SettingsManifest } from "./types";

/**
 * Get the path to the settings file in the extension's support directory
 */
export function getSettingsPath(): string {
  return path.join(environment.supportPath, "settings.json");
}

/**
 * Get the path to the backup directory
 */
export function getBackupPath(): string {
  return path.join(environment.supportPath, "backups");
}

/**
 * Ensure the support directory exists
 */
export async function ensureSupportDirectory(): Promise<void> {
  await fs.mkdir(environment.supportPath, { recursive: true });
}

/**
 * Ensure the backup directory exists
 */
export async function ensureBackupDirectory(): Promise<void> {
  const backupPath = getBackupPath();
  await fs.mkdir(backupPath, { recursive: true });
}

/**
 * Save settings manifest to the default location
 */
export async function saveSettings(manifest: SettingsManifest): Promise<string> {
  await ensureSupportDirectory();
  const settingsPath = getSettingsPath();
  const jsonContent = JSON.stringify(manifest, null, 2);
  await fs.writeFile(settingsPath, jsonContent, "utf-8");
  return settingsPath;
}

/**
 * Load settings manifest from the default location
 */
export async function loadSettings(): Promise<SettingsManifest | null> {
  try {
    const settingsPath = getSettingsPath();
    const content = await fs.readFile(settingsPath, "utf-8");
    return JSON.parse(content) as SettingsManifest;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

/**
 * Check if settings file exists
 */
export async function settingsExist(): Promise<boolean> {
  try {
    await fs.access(getSettingsPath());
    return true;
  } catch {
    return false;
  }
}

/**
 * Export settings to a custom location
 */
export async function exportSettings(manifest: SettingsManifest, exportPath: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `macos-settings-${timestamp}.json`;
  const fullPath = path.join(exportPath, filename);

  const jsonContent = JSON.stringify(manifest, null, 2);
  await fs.writeFile(fullPath, jsonContent, "utf-8");
  return fullPath;
}

/**
 * Create a backup of current settings
 */
export async function createBackup(): Promise<string | null> {
  const currentSettings = await loadSettings();
  if (!currentSettings) {
    return null;
  }

  await ensureBackupDirectory();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFilename = `backup-${timestamp}.json`;
  const backupPath = path.join(getBackupPath(), backupFilename);

  const jsonContent = JSON.stringify(currentSettings, null, 2);
  await fs.writeFile(backupPath, jsonContent, "utf-8");
  return backupPath;
}

/**
 * Import settings from a custom file
 */
export async function importSettings(filePath: string): Promise<SettingsManifest> {
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content) as SettingsManifest;
}

/**
 * List all backups
 */
export async function listBackups(): Promise<string[]> {
  try {
    const backupPath = getBackupPath();
    const files = await fs.readdir(backupPath);
    return files
      .filter((file) => file.startsWith("backup-") && file.endsWith(".json"))
      .sort()
      .reverse();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

/**
 * Delete old backups, keeping only the most recent N backups
 */
export async function cleanupOldBackups(keepCount: number = 5): Promise<void> {
  const backups = await listBackups();
  if (backups.length <= keepCount) {
    return;
  }

  const backupPath = getBackupPath();
  const toDelete = backups.slice(keepCount);

  for (const backup of toDelete) {
    const fullPath = path.join(backupPath, backup);
    await fs.unlink(fullPath);
  }
}
