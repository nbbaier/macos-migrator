import { showHUD, showToast, Toast, getPreferenceValues } from "@raycast/api";
import { collectAllSettings } from "./utils/collectors";
import { saveSettings, exportSettings } from "./utils/storage";
import type { Preferences } from "./utils/types";

export default async function Command() {
  const preferences = getPreferenceValues<Preferences>();

  // Show initial toast
  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Collecting settings...",
  });

  try {
    // Collect all settings
    toast.message = "Collecting macOS defaults...";
    const manifest = await collectAllSettings(preferences);

    // Save to default location
    toast.message = "Saving settings...";
    const settingsPath = await saveSettings(manifest);

    // Export to custom location if specified
    if (preferences.exportPath) {
      try {
        toast.message = "Exporting to custom location...";
        await exportSettings(manifest, preferences.exportPath);
      } catch (error) {
        console.error("Failed to export to custom location:", error);
        // Continue even if export fails
      }
    }

    // Count what was saved
    const defaultsCount = Object.keys(manifest.settings.defaults).length;
    const dotfilesCount = Object.keys(manifest.settings.dotfiles).length;
    const packagesCount =
      (manifest.settings.packages.homebrew?.formulae.length || 0) +
      (manifest.settings.packages.homebrew?.casks.length || 0) +
      (manifest.settings.packages.npm?.length || 0) +
      (manifest.settings.packages.yarn?.length || 0);

    // Show success message
    toast.style = Toast.Style.Success;
    toast.title = "Settings saved successfully!";
    toast.message = `${defaultsCount} defaults, ${dotfilesCount} dotfiles, ${packagesCount} packages`;

    // Show HUD for quick feedback
    await showHUD(` Settings saved (${defaultsCount} defaults, ${dotfilesCount} dotfiles, ${packagesCount} packages)`);
  } catch (error) {
    console.error("Error saving settings:", error);
    toast.style = Toast.Style.Failure;
    toast.title = "Failed to save settings";
    toast.message = (error as Error).message;

    await showHUD(" Failed to save settings");
  }
}
