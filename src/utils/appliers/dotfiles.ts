import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { DotfilesSettings, ApplyResult } from "../types";

/**
 * Create a backup of an existing dotfile
 */
async function backupDotfile(filepath: string): Promise<void> {
  try {
    const backupPath = `${filepath}.backup-${Date.now()}`;
    await fs.copyFile(filepath, backupPath);
  } catch {
    // Ignore if file doesn't exist
  }
}

/**
 * Apply dotfiles to home directory
 */
export async function applyDotfiles(dotfiles: DotfilesSettings): Promise<ApplyResult> {
  let applied = 0;
  let failed = 0;
  const errors: string[] = [];
  const homeDir = os.homedir();

  for (const [filename, content] of Object.entries(dotfiles)) {
    const filepath = path.join(homeDir, filename);

    try {
      // Create parent directory if it doesn't exist (for nested paths like .ssh/config)
      const dirname = path.dirname(filepath);
      await fs.mkdir(dirname, { recursive: true });

      // Backup existing file
      await backupDotfile(filepath);

      // Write new content
      await fs.writeFile(filepath, content, "utf-8");

      // Set appropriate permissions for sensitive files
      if (filename.includes(".ssh/")) {
        await fs.chmod(filepath, 0o600);
      }

      applied++;
    } catch (error) {
      failed++;
      errors.push(`Failed to apply ${filename}: ${(error as Error).message}`);
    }
  }

  return {
    success: applied > 0,
    applied,
    failed,
    errors,
  };
}

/**
 * Get a preview of dotfiles that will be applied
 */
export function getDotfilesPreview(dotfiles: DotfilesSettings): string {
  const lines: string[] = ["Dotfiles to be applied:", ""];

  for (const filename of Object.keys(dotfiles)) {
    lines.push(`  ${filename}`);
  }

  return lines.join("\n");
}
