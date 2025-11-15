import { commandExists, executeCommand, tryExecuteCommand } from "../exec";
import type { PackageSettings, CollectionResult } from "../types";

/**
 * Collect Homebrew formulae
 */
async function collectHomebrewFormulae(): Promise<string[]> {
  const result = await tryExecuteCommand("brew list --formula -1");
  if (!result.success || !result.output) {
    return [];
  }
  return result.output.split("\n").filter((line) => line.trim().length > 0);
}

/**
 * Collect Homebrew casks
 */
async function collectHomebrewCasks(): Promise<string[]> {
  const result = await tryExecuteCommand("brew list --cask -1");
  if (!result.success || !result.output) {
    return [];
  }
  return result.output.split("\n").filter((line) => line.trim().length > 0);
}

/**
 * Collect npm global packages
 */
async function collectNpmPackages(): Promise<string[]> {
  const result = await tryExecuteCommand("npm list -g --depth=0 --json");
  if (!result.success || !result.output) {
    return [];
  }

  try {
    const data = JSON.parse(result.output);
    const dependencies = data.dependencies || {};
    return Object.keys(dependencies).filter((pkg) => pkg !== "npm");
  } catch {
    return [];
  }
}

/**
 * Collect yarn global packages
 */
async function collectYarnPackages(): Promise<string[]> {
  const result = await tryExecuteCommand("yarn global list --json");
  if (!result.success || !result.output) {
    return [];
  }

  try {
    // Yarn outputs one JSON object per line
    const lines = result.output.split("\n").filter((line) => line.trim().length > 0);
    const packages: string[] = [];

    for (const line of lines) {
      const data = JSON.parse(line);
      if (data.type === "tree" && data.data?.trees) {
        for (const tree of data.data.trees) {
          if (tree.name) {
            // Extract package name (before @version)
            const packageName = tree.name.split("@")[0];
            if (packageName) {
              packages.push(packageName);
            }
          }
        }
      }
    }

    return packages;
  } catch {
    return [];
  }
}

/**
 * Collect all package manager configurations
 */
export async function collectPackages(): Promise<CollectionResult<PackageSettings>> {
  const packages: PackageSettings = {};
  const errors: string[] = [];

  try {
    // Check if Homebrew is installed
    const hasHomebrew = await commandExists("brew");
    if (hasHomebrew) {
      const [formulae, casks] = await Promise.all([collectHomebrewFormulae(), collectHomebrewCasks()]);

      if (formulae.length > 0 || casks.length > 0) {
        packages.homebrew = {
          formulae,
          casks,
        };
      }
    }

    // Check if npm is installed
    const hasNpm = await commandExists("npm");
    if (hasNpm) {
      const npmPackages = await collectNpmPackages();
      if (npmPackages.length > 0) {
        packages.npm = npmPackages;
      }
    }

    // Check if yarn is installed
    const hasYarn = await commandExists("yarn");
    if (hasYarn) {
      const yarnPackages = await collectYarnPackages();
      if (yarnPackages.length > 0) {
        packages.yarn = yarnPackages;
      }
    }
  } catch (error) {
    errors.push(`Failed to collect packages: ${(error as Error).message}`);
  }

  const hasPackages =
    (packages.homebrew && (packages.homebrew.formulae.length > 0 || packages.homebrew.casks.length > 0)) ||
    (packages.npm && packages.npm.length > 0) ||
    (packages.yarn && packages.yarn.length > 0);

  return {
    success: hasPackages,
    data: packages,
    error: errors.length > 0 ? errors.join("\n") : undefined,
  };
}
