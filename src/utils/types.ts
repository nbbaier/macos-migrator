/**
 * Represents a macOS defaults domain with key-value pairs
 */
export interface DefaultsDomain {
  [key: string]: string | number | boolean | null;
}

/**
 * Collection of macOS defaults organized by domain
 */
export interface DefaultsSettings {
  [domain: string]: DefaultsDomain;
}

/**
 * Collection of dotfiles with their contents
 */
export interface DotfilesSettings {
  [filename: string]: string;
}

/**
 * Package manager configurations
 */
export interface PackageSettings {
  homebrew?: {
    formulae: string[];
    casks: string[];
  };
  npm?: string[];
  yarn?: string[];
}

/**
 * Complete settings manifest
 */
export interface SettingsManifest {
  version: string;
  timestamp: string;
  hostname: string;
  osVersion: string;
  settings: {
    defaults: DefaultsSettings;
    dotfiles: DotfilesSettings;
    packages: PackageSettings;
  };
}

/**
 * Result of a collection operation
 */
export interface CollectionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Result of an apply operation
 */
export interface ApplyResult {
  success: boolean;
  applied: number;
  failed: number;
  errors: string[];
}

/**
 * User preferences from package.json
 */
export interface Preferences {
  exportPath?: string;
  includeDotfiles: boolean;
  includePackages: boolean;
  autoBackup: boolean;
  customDotfiles?: string;
}

/**
 * Common macOS defaults domains to collect
 */
export const COMMON_DEFAULTS_DOMAINS = [
  "com.apple.dock",
  "com.apple.finder",
  "com.apple.desktopservices",
  "com.apple.screensaver",
  "com.apple.screencapture",
  "com.apple.menuextra.clock",
  "com.apple.print.PrintingPrefs",
  "com.apple.driver.AppleBluetoothMultitouch.trackpad",
  "com.apple.AppleMultitouchTrackpad",
  "NSGlobalDomain",
] as const;

/**
 * Common dotfiles to collect
 */
export const COMMON_DOTFILES = [
  ".zshrc",
  ".bashrc",
  ".bash_profile",
  ".gitconfig",
  ".gitignore_global",
  ".vimrc",
  ".tmux.conf",
  ".ssh/config",
] as const;

/**
 * Dotfiles to exclude (sensitive data)
 */
export const EXCLUDED_DOTFILES = [
  ".ssh/id_rsa",
  ".ssh/id_ed25519",
  ".ssh/id_ecdsa",
  ".ssh/id_dsa",
  ".aws/credentials",
  ".gnupg/private-keys-v1.d",
] as const;
