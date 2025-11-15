import type { SettingsManifest, ApplyResult, Preferences } from "../types";
import { applyDefaults } from "./defaults";
import { applyDotfiles } from "./dotfiles";
import { applyPackages } from "./packages";

/**
 * Apply all settings from a manifest
 */
export async function applyAllSettings(manifest: SettingsManifest, preferences: Preferences): Promise<ApplyResult> {
  let totalApplied = 0;
  let totalFailed = 0;
  const allErrors: string[] = [];

  // Apply defaults
  if (manifest.settings.defaults && Object.keys(manifest.settings.defaults).length > 0) {
    const defaultsResult = await applyDefaults(manifest.settings.defaults);
    totalApplied += defaultsResult.applied;
    totalFailed += defaultsResult.failed;
    allErrors.push(...defaultsResult.errors);
  }

  // Apply dotfiles if enabled
  if (preferences.includeDotfiles && manifest.settings.dotfiles && Object.keys(manifest.settings.dotfiles).length > 0) {
    const dotfilesResult = await applyDotfiles(manifest.settings.dotfiles);
    totalApplied += dotfilesResult.applied;
    totalFailed += dotfilesResult.failed;
    allErrors.push(...dotfilesResult.errors);
  }

  // Apply packages if enabled
  if (preferences.includePackages && manifest.settings.packages) {
    const packagesResult = await applyPackages(manifest.settings.packages);
    totalApplied += packagesResult.applied;
    totalFailed += packagesResult.failed;
    allErrors.push(...packagesResult.errors);
  }

  return {
    success: totalApplied > 0,
    applied: totalApplied,
    failed: totalFailed,
    errors: allErrors,
  };
}

export { applyDefaults } from "./defaults";
export { applyDotfiles } from "./dotfiles";
export { applyPackages } from "./packages";
