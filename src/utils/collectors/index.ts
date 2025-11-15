import { getHostname, getOSVersion } from "../exec";
import type { SettingsManifest, Preferences } from "../types";
import { collectDefaults } from "./defaults";
import { collectDotfiles } from "./dotfiles";
import { collectPackages } from "./packages";

/**
 * Collect all settings and create a complete manifest
 */
export async function collectAllSettings(preferences: Preferences): Promise<SettingsManifest> {
  // Get system information
  const [hostname, osVersion] = await Promise.all([getHostname(), getOSVersion()]);

  // Collect settings based on preferences
  const defaultsResult = await collectDefaults();
  const dotfilesResult = preferences.includeDotfiles
    ? await collectDotfiles(preferences.customDotfiles)
    : { success: true, data: {} };
  const packagesResult = preferences.includePackages ? await collectPackages() : { success: true, data: {} };

  // Create manifest
  const manifest: SettingsManifest = {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    hostname,
    osVersion,
    settings: {
      defaults: defaultsResult.data || {},
      dotfiles: dotfilesResult.data || {},
      packages: packagesResult.data || {},
    },
  };

  return manifest;
}

export { collectDefaults } from "./defaults";
export { collectDotfiles } from "./dotfiles";
export { collectPackages } from "./packages";
