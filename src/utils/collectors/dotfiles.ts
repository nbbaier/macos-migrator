import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";
import type { DotfilesSettings, CollectionResult } from "../types";
import { COMMON_DOTFILES, EXCLUDED_DOTFILES } from "../types";

/**
 * Check if a file should be excluded (contains sensitive data)
 */
function isExcluded(filepath: string): boolean {
  return EXCLUDED_DOTFILES.some((excluded) => filepath.includes(excluded));
}

/**
 * Read a single dotfile
 */
async function readDotfile(filepath: string): Promise<string | null> {
  try {
    const fullPath = filepath.startsWith("~") ? filepath.replace("~", os.homedir()) : filepath;

    // Skip if excluded
    if (isExcluded(fullPath)) {
      return null;
    }

    // Check if file exists
    await fs.access(fullPath);

    // Read file content
    const content = await fs.readFile(fullPath, "utf-8");
    return content;
  } catch {
    return null;
  }
}

/**
 * Collect common dotfiles from home directory
 */
export async function collectDotfiles(customDotfiles?: string): Promise<CollectionResult<DotfilesSettings>> {
  const dotfiles: DotfilesSettings = {};
  const errors: string[] = [];
  const homeDir = os.homedir();

  // Collect common dotfiles
  const filesToCollect = [...COMMON_DOTFILES];

  // Add custom dotfiles if provided
  if (customDotfiles) {
    const custom = customDotfiles
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
    filesToCollect.push(...custom);
  }

  for (const dotfile of filesToCollect) {
    const filepath = path.join(homeDir, dotfile);
    try {
      const content = await readDotfile(filepath);
      if (content !== null) {
        dotfiles[dotfile] = content;
      }
    } catch (error) {
      errors.push(`Failed to read ${dotfile}: ${(error as Error).message}`);
    }
  }

  return {
    success: Object.keys(dotfiles).length > 0,
    data: dotfiles,
    error: errors.length > 0 ? errors.join("\n") : undefined,
  };
}

/**
 * Get the home directory path
 */
export function getHomeDirectory(): string {
  return os.homedir();
}

/**
 * Check if a dotfile exists
 */
export async function dotfileExists(filename: string): Promise<boolean> {
  try {
    const homeDir = os.homedir();
    const filepath = path.join(homeDir, filename);
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}
