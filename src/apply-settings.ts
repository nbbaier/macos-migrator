import { showHUD, showToast, Toast, confirmAlert, Alert, getPreferenceValues } from "@raycast/api";
import { loadSettings, settingsExist, createBackup } from "./utils/storage";
import { applyAllSettings } from "./utils/appliers";
import type { Preferences } from "./utils/types";

export default async function Command() {
  const preferences = getPreferenceValues<Preferences>();

  try {
    // Check if settings file exists
    const exists = await settingsExist();
    if (!exists) {
      await showHUD(" No saved settings found. Run 'Save Settings' first.");
      return;
    }

    // Load settings
    const manifest = await loadSettings();
    if (!manifest) {
      await showHUD(" Failed to load settings");
      return;
    }

    // Count what will be applied
    const defaultsCount = Object.keys(manifest.settings.defaults).length;
    const dotfilesCount = preferences.includeDotfiles ? Object.keys(manifest.settings.dotfiles).length : 0;
    const packagesCount = preferences.includePackages
      ? (manifest.settings.packages.homebrew?.formulae.length || 0) +
        (manifest.settings.packages.homebrew?.casks.length || 0) +
        (manifest.settings.packages.npm?.length || 0) +
        (manifest.settings.packages.yarn?.length || 0)
      : 0;

    // Show confirmation dialog
    const confirmed = await confirmAlert({
      title: "Apply Settings?",
      message: `This will apply:\n" ${defaultsCount} macOS defaults\n" ${dotfilesCount} dotfiles\n" ${packagesCount} packages\n\nFrom: ${manifest.hostname} (${manifest.timestamp.split("T")[0]})`,
      primaryAction: {
        title: "Apply Settings",
        style: Alert.ActionStyle.Default,
      },
      dismissAction: {
        title: "Cancel",
        style: Alert.ActionStyle.Cancel,
      },
    });

    if (!confirmed) {
      return;
    }

    // Show progress toast
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Applying settings...",
    });

    // Create backup if enabled
    if (preferences.autoBackup) {
      toast.message = "Creating backup...";
      try {
        await createBackup();
      } catch (error) {
        console.error("Failed to create backup:", error);
        // Continue even if backup fails
      }
    }

    // Apply settings
    toast.message = "Applying macOS defaults...";
    const result = await applyAllSettings(manifest, preferences);

    // Show results
    if (result.success) {
      toast.style = Toast.Style.Success;
      toast.title = "Settings applied successfully!";
      toast.message = `Applied ${result.applied} settings`;

      if (result.failed > 0) {
        toast.message += ` (${result.failed} failed)`;
        console.error("Failed to apply some settings:", result.errors);
      }

      await showHUD(
        ` Settings applied (${result.applied} successful${result.failed > 0 ? `, ${result.failed} failed` : ""})\n\n` +
          "Note: Some changes may require restarting applications or logging out."
      );
    } else {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed to apply settings";
      toast.message = result.errors[0] || "Unknown error";

      await showHUD(" Failed to apply settings");
    }
  } catch (error) {
    console.error("Error applying settings:", error);
    await showHUD(` Error: ${(error as Error).message}`);
  }
}
