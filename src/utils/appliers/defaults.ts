import { writeDefault, killProcess } from "../exec";
import type { DefaultsSettings, ApplyResult } from "../types";

/**
 * Apply macOS defaults settings
 */
export async function applyDefaults(defaults: DefaultsSettings): Promise<ApplyResult> {
  let applied = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const [domain, settings] of Object.entries(defaults)) {
    for (const [key, value] of Object.entries(settings)) {
      try {
        const success = await writeDefault(domain, key, value);
        if (success) {
          applied++;
        } else {
          failed++;
          errors.push(`Failed to write ${domain}.${key}`);
        }
      } catch (error) {
        failed++;
        errors.push(`Error writing ${domain}.${key}: ${(error as Error).message}`);
      }
    }
  }

  // Restart affected applications
  await restartAffectedApps(defaults);

  return {
    success: applied > 0,
    applied,
    failed,
    errors,
  };
}

/**
 * Restart applications affected by defaults changes
 */
async function restartAffectedApps(defaults: DefaultsSettings): Promise<void> {
  const appsToRestart = new Set<string>();

  // Map domains to apps that need restarting
  if (defaults["com.apple.dock"]) {
    appsToRestart.add("Dock");
  }
  if (defaults["com.apple.finder"]) {
    appsToRestart.add("Finder");
  }
  if (defaults["com.apple.menuextra.clock"]) {
    appsToRestart.add("SystemUIServer");
  }

  // Restart each app
  for (const app of appsToRestart) {
    try {
      await killProcess(app);
    } catch {
      // Ignore errors - the app might not be running
    }
  }
}

/**
 * Get a preview of what will be applied
 */
export function getDefaultsPreview(defaults: DefaultsSettings): string {
  const lines: string[] = ["macOS Defaults to be applied:", ""];

  for (const [domain, settings] of Object.entries(defaults)) {
    lines.push(`${domain}:`);
    for (const [key, value] of Object.entries(settings)) {
      lines.push(`  ${key} = ${value}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
