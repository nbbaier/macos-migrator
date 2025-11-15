# CLAUDE.md - macOS Migrator

This document helps Claude Code understand and work with the macOS Migrator Raycast extension.

## Project Overview

macOS Migrator is a Raycast extension that saves and restores macOS system settings, dotfiles, and package lists. It helps users migrate their configurations when setting up a new Mac.

**Key Features:**
- Save/restore macOS defaults (Dock, Finder, trackpad, etc.)
- Backup/restore dotfiles (.zshrc, .gitconfig, etc.)
- Export/import Homebrew and npm package lists
- Automatic backup before applying settings

## Architecture

### Core Components

The codebase follows a collector-applier pattern:

```
src/
├── save-settings.ts       # Main command to save settings
├── apply-settings.ts      # Main command to apply settings
└── utils/
    ├── collectors/        # Modules that collect settings
    │   ├── defaults.ts    # macOS defaults collector
    │   ├── dotfiles.ts    # Dotfiles collector
    │   └── packages.ts    # Package lists collector
    ├── appliers/          # Modules that apply settings
    │   ├── defaults.ts    # macOS defaults applier
    │   ├── dotfiles.ts    # Dotfiles applier
    │   └── packages.ts    # Package installer
    ├── storage.ts         # Settings persistence (JSON)
    ├── exec.ts            # Command execution helpers
    └── types.ts           # TypeScript types & constants
```

### Data Flow

1. **Save Settings Flow:**
   - User runs "Save Settings" command
   - Collectors gather data from system
   - Settings compiled into SettingsManifest
   - Manifest saved to JSON file
   - Optional export to custom directory

2. **Apply Settings Flow:**
   - User runs "Apply Settings" command
   - Load SettingsManifest from storage
   - Show confirmation dialog with preview
   - Create backup if autoBackup enabled
   - Appliers restore settings to system
   - Show results with success/failure counts

## Key Concepts

### SettingsManifest Structure

The manifest (`src/utils/types.ts:37-47`) contains:

```typescript
{
  version: "1.0.0",
  timestamp: "2025-01-15T...",
  hostname: "MacBook-Pro",
  osVersion: "14.2.1",
  settings: {
    defaults: {                    // macOS defaults by domain
      "com.apple.dock": {...},
      "NSGlobalDomain": {...}
    },
    dotfiles: {                    // Dotfile contents
      ".zshrc": "...",
      ".gitconfig": "..."
    },
    packages: {                    // Package lists
      homebrew: {
        formulae: ["git", "node"],
        casks: ["raycast"]
      },
      npm: ["typescript"],
      yarn: []
    }
  }
}
```

### Common Defaults Domains

The extension tracks settings from these macOS domains (`src/utils/types.ts:82-93`):
- `com.apple.dock` - Dock configuration
- `com.apple.finder` - Finder preferences
- `NSGlobalDomain` - System-wide settings
- Trackpad, screensaver, screenshots, etc.

### Dotfiles Handling

**Included by default** (`src/utils/types.ts:98-107`):
- Shell configs: `.zshrc`, `.bashrc`, `.bash_profile`
- Git configs: `.gitconfig`, `.gitignore_global`
- Editor: `.vimrc`, `.tmux.conf`
- SSH: `.ssh/config`

**Excluded for security** (`src/utils/types.ts:112-119`):
- Private SSH keys
- AWS credentials
- GPG private keys

## Development Workflow

### Running Locally

```bash
npm run dev        # Start development mode (hot reload)
npm run build      # Build extension for production
npm run lint       # Run ESLint
npm run fix-lint   # Auto-fix linting issues
```

### Testing Manually

1. Run `npm run dev`
2. Open Raycast
3. Search for "Save Settings" or "Apply Settings"
4. Check logs in terminal for errors
5. Verify settings at: `~/Library/Application Support/com.raycast.macos/extensions/`

### Debugging Tips

1. **Enable verbose logging:**
   - Check `console.error()` and `console.log()` outputs in terminal
   - Toast messages show user-facing errors

2. **Inspect saved settings:**
   - Settings stored in Raycast's support directory
   - Manifest is JSON - can inspect manually

3. **Test commands safely:**
   - Always test with autoBackup enabled
   - Start with small subsets of settings
   - Verify `defaults read` output before applying

## Common Tasks

### Adding a New Defaults Domain

1. Add domain to `COMMON_DEFAULTS_DOMAINS` in `src/utils/types.ts:82`
2. Collector will automatically include it
3. Test save/apply cycle

### Adding a New Dotfile

1. Add to `COMMON_DOTFILES` in `src/utils/types.ts:98`
2. Or let users specify via `customDotfiles` preference
3. Ensure not in `EXCLUDED_DOTFILES` list

### Adding a New Package Manager

1. Add type to `PackageSettings` in `src/utils/types.ts:25`
2. Implement collector in `src/utils/collectors/packages.ts`
3. Implement applier in `src/utils/appliers/packages.ts`
4. Update counts in commands

### Modifying Preferences

Preferences defined in `package.json:31-72`:
- `exportPath` - Custom export location
- `includeDotfiles` - Toggle dotfiles backup
- `includePackages` - Toggle package lists
- `autoBackup` - Auto-backup before apply
- `customDotfiles` - Additional dotfiles

## Important Files

### Type Definitions (`src/utils/types.ts`)
Central location for all TypeScript interfaces and constants. Review this file first to understand data structures.

### Exec Utilities (`src/utils/exec.ts`)
Helper functions for running shell commands safely. Use these instead of direct `exec` calls.

### Storage (`src/utils/storage.ts`)
Handles reading/writing settings manifest. Uses Raycast's support directory for persistence.

## Security Considerations

1. **Never collect sensitive files:**
   - Check `EXCLUDED_DOTFILES` before adding files
   - SSH private keys, AWS credentials are excluded

2. **Validate before applying:**
   - Show confirmation dialog with preview
   - Create backup before destructive operations
   - Handle errors gracefully

3. **Command injection prevention:**
   - Sanitize inputs in `exec.ts`
   - Use parameterized commands where possible

## Raycast-Specific Notes

### No-View Commands
Both commands use `"mode": "no-view"` - they run without UI and show toasts/HUDs for feedback.

### Toast vs HUD
- **Toast:** Detailed progress with multiple states (Animated → Success/Failure)
- **HUD:** Quick feedback overlay, auto-dismisses

### Preferences
Accessed via `getPreferenceValues<Preferences>()` from `@raycast/api`.

## Testing Checklist

When making changes, verify:

- [ ] Save settings collects expected data
- [ ] Apply settings restores correctly
- [ ] Preferences affect behavior as expected
- [ ] Error handling shows user-friendly messages
- [ ] Backup creation works
- [ ] Export to custom directory works
- [ ] No sensitive data in manifest
- [ ] TypeScript types are accurate
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)

## Common Issues

**"Failed to save settings"**
- Check file permissions in Raycast support directory
- Verify commands like `defaults read` are accessible
- Check console logs for specific error

**"No saved settings found"**
- Run "Save Settings" first
- Check if settings file exists in support directory

**"Failed to apply X settings"**
- Some defaults may be read-only
- Check ApplyResult errors array for details
- Some settings require logout/restart to take effect

## Resources

- [Raycast API Docs](https://developers.raycast.com/api-reference)
- [Raycast Extension Template](https://github.com/raycast/extensions)
- [macOS defaults Reference](https://macos-defaults.com/)
