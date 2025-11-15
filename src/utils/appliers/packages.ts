import { commandExists, tryExecuteCommand } from "../exec";
import type { PackageSettings, ApplyResult } from "../types";

/**
 * Install Homebrew packages
 */
async function installHomebrewPackages(formulae: string[], casks: string[]): Promise<{ applied: number; failed: number; errors: string[] }> {
  let applied = 0;
  let failed = 0;
  const errors: string[] = [];

  // Install formulae
  if (formulae.length > 0) {
    const result = await tryExecuteCommand(`brew install ${formulae.join(" ")}`, 300000); // 5 minute timeout
    if (result.success) {
      applied += formulae.length;
    } else {
      failed += formulae.length;
      errors.push(`Failed to install formulae: ${result.error}`);
    }
  }

  // Install casks
  if (casks.length > 0) {
    const result = await tryExecuteCommand(`brew install --cask ${casks.join(" ")}`, 600000); // 10 minute timeout
    if (result.success) {
      applied += casks.length;
    } else {
      failed += casks.length;
      errors.push(`Failed to install casks: ${result.error}`);
    }
  }

  return { applied, failed, errors };
}

/**
 * Install npm global packages
 */
async function installNpmPackages(packages: string[]): Promise<{ applied: number; failed: number; errors: string[] }> {
  let applied = 0;
  let failed = 0;
  const errors: string[] = [];

  if (packages.length > 0) {
    const result = await tryExecuteCommand(`npm install -g ${packages.join(" ")}`, 300000); // 5 minute timeout
    if (result.success) {
      applied += packages.length;
    } else {
      failed += packages.length;
      errors.push(`Failed to install npm packages: ${result.error}`);
    }
  }

  return { applied, failed, errors };
}

/**
 * Install yarn global packages
 */
async function installYarnPackages(packages: string[]): Promise<{ applied: number; failed: number; errors: string[] }> {
  let applied = 0;
  let failed = 0;
  const errors: string[] = [];

  if (packages.length > 0) {
    const result = await tryExecuteCommand(`yarn global add ${packages.join(" ")}`, 300000); // 5 minute timeout
    if (result.success) {
      applied += packages.length;
    } else {
      failed += packages.length;
      errors.push(`Failed to install yarn packages: ${result.error}`);
    }
  }

  return { applied, failed, errors };
}

/**
 * Apply package installations
 */
export async function applyPackages(packages: PackageSettings): Promise<ApplyResult> {
  let totalApplied = 0;
  let totalFailed = 0;
  const allErrors: string[] = [];

  // Check and install Homebrew packages
  if (packages.homebrew) {
    const hasHomebrew = await commandExists("brew");
    if (!hasHomebrew) {
      allErrors.push("Homebrew is not installed. Please install Homebrew first: https://brew.sh");
    } else {
      const { formulae = [], casks = [] } = packages.homebrew;
      const result = await installHomebrewPackages(formulae, casks);
      totalApplied += result.applied;
      totalFailed += result.failed;
      allErrors.push(...result.errors);
    }
  }

  // Check and install npm packages
  if (packages.npm && packages.npm.length > 0) {
    const hasNpm = await commandExists("npm");
    if (!hasNpm) {
      allErrors.push("npm is not installed. Please install Node.js first.");
    } else {
      const result = await installNpmPackages(packages.npm);
      totalApplied += result.applied;
      totalFailed += result.failed;
      allErrors.push(...result.errors);
    }
  }

  // Check and install yarn packages
  if (packages.yarn && packages.yarn.length > 0) {
    const hasYarn = await commandExists("yarn");
    if (!hasYarn) {
      allErrors.push("yarn is not installed. Skipping yarn packages.");
    } else {
      const result = await installYarnPackages(packages.yarn);
      totalApplied += result.applied;
      totalFailed += result.failed;
      allErrors.push(...result.errors);
    }
  }

  return {
    success: totalApplied > 0 || allErrors.length === 0,
    applied: totalApplied,
    failed: totalFailed,
    errors: allErrors,
  };
}

/**
 * Get a preview of packages that will be installed
 */
export function getPackagesPreview(packages: PackageSettings): string {
  const lines: string[] = ["Packages to be installed:", ""];

  if (packages.homebrew) {
    if (packages.homebrew.formulae.length > 0) {
      lines.push("Homebrew Formulae:");
      packages.homebrew.formulae.forEach((pkg) => lines.push(`  ${pkg}`));
      lines.push("");
    }
    if (packages.homebrew.casks.length > 0) {
      lines.push("Homebrew Casks:");
      packages.homebrew.casks.forEach((pkg) => lines.push(`  ${pkg}`));
      lines.push("");
    }
  }

  if (packages.npm && packages.npm.length > 0) {
    lines.push("npm Global Packages:");
    packages.npm.forEach((pkg) => lines.push(`  ${pkg}`));
    lines.push("");
  }

  if (packages.yarn && packages.yarn.length > 0) {
    lines.push("yarn Global Packages:");
    packages.yarn.forEach((pkg) => lines.push(`  ${pkg}`));
    lines.push("");
  }

  return lines.join("\n");
}
