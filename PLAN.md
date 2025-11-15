# macOS Migrator Extension Implementation Plan

## Overview
A Raycast extension that helps users save their macOS settings and reapply them when setting up a new machine. The extension will capture system defaults, dotfiles, and package manager configurations.

---

## Phase 1: Project Structure & Types

### 1.1 Create Core Utilities (`src/utils/`)
- **`types.ts`** - TypeScript interfaces for settings manifest
  - `SettingsManifest` interface
  - `DefaultsSettings`, `DotfilesSettings`, `PackageSettings` types
  - Export/import types

- **`storage.ts`** - File system helpers
  - Read/write settings to `environment.supportPath`
  - Export settings to user-specified location
  - Create backups

- **`exec.ts`** - Shell command execution wrappers
  - Wrapper around `useExec` from @raycast/utils
  - Error handling and timeout management
  - Stdout/stderr parsing utilities

### 1.2 Create Collectors Directory (`src/utils/collectors/`)
- **`defaults.ts`** - Collect macOS defaults
  - Dock settings (size, position, autohide, show-recents)
  - Finder preferences (show hidden files, default view)
  - Trackpad/Mouse settings
  - Keyboard settings (key repeat, delay)
  - Mission Control preferences
  - NSGlobalDomain settings

- **`dotfiles.ts`** - Read common dotfiles
  - `.zshrc`, `.bashrc`
  - `.gitconfig`
  - `.vimrc`, `.vim/`
  - `.ssh/config` (reference only, not actual keys)
  - Custom user-specified files

- **`packages.ts`** - List installed packages
  - Homebrew formulae (`brew list --formula`)
  - Homebrew casks (`brew list --cask`)
  - npm global packages (`npm list -g --depth=0`)
  - yarn global packages (if installed)

- **`index.ts`** - Orchestrate all collectors
  - Run collectors in parallel where possible
  - Combine results into unified manifest
  - Handle errors gracefully

### 1.3 Create Appliers Directory (`src/utils/appliers/`)
- **`defaults.ts`** - Apply macOS defaults
  - Execute `defaults write` commands
  - Validate domain names before writing
  - Restart affected applications (Dock, Finder)

- **`dotfiles.ts`** - Write dotfiles to home directory
  - Create backups of existing files
  - Write new dotfile contents
  - Set proper permissions

- **`packages.ts`** - Install packages
  - Check if Homebrew is installed
  - Install formulae and casks
  - Install npm/yarn global packages
  - Show progress for long operations

- **`index.ts`** - Orchestrate all appliers
  - Run appliers in sequence with proper dependencies
  - Handle errors and rollback if needed
  - Provide detailed progress feedback

---

## Phase 2: Save Settings Command

### Implementation: `src/save-settings.ts`
1. Show toast with "Collecting settings..." message
2. Run all collectors to gather settings:
   - macOS defaults
   - Dotfiles content
   - Package lists
3. Create JSON manifest with:
   - Version number
   - Timestamp
   - Hostname
   - All collected settings
4. Save to `${environment.supportPath}/settings.json`
5. Optionally export to user-specified directory (from preferences)
6. Show success HUD: "Settings saved successfully!"

**Key Features:**
- Progress indicators for each collection step
- Error handling with specific messages
- Option to exclude certain categories (via preferences)
- Compressed JSON output for efficiency

---

## Phase 3: Apply Settings Command

### Implementation: `src/apply-settings.ts`
1. Check if settings file exists
   - If not found, show error and offer to browse for file
2. Parse and validate settings manifest
3. Show confirmation alert:
   - Preview of what will be applied
   - Warning about system changes
   - Option to cancel
4. Create backup of current settings (call save-settings internally)
5. Show toast with "Applying settings..." message
6. Run all appliers in sequence:
   - Apply macOS defaults
   - Copy dotfiles
   - Optionally install packages
7. Show success HUD with:
   - "Settings applied successfully!"
   - Reminder to restart applications/system if needed

**Key Features:**
- Dry-run mode to preview changes
- Selective application (checkboxes for categories)
- Automatic backup before applying
- Detailed error messages with rollback capability
- Post-application instructions

---

## Phase 4: Add Preferences

### Update `package.json` Preferences Section:
```json
{
  "preferences": [
    {
      "name": "exportPath",
      "type": "directory",
      "required": false,
      "title": "Export Directory",
      "description": "Default location to export settings backup"
    },
    {
      "name": "includeDotfiles",
      "type": "checkbox",
      "required": false,
      "default": true,
      "title": "Include Dotfiles",
      "description": "Save and apply dotfiles (.zshrc, .gitconfig, etc.)"
    },
    {
      "name": "includePackages",
      "type": "checkbox",
      "required": false,
      "default": false,
      "title": "Include Package Lists",
      "description": "Save Homebrew and npm package lists (applying will install packages)"
    },
    {
      "name": "autoBackup",
      "type": "checkbox",
      "required": false,
      "default": true,
      "title": "Auto-backup Before Apply",
      "description": "Automatically create a backup before applying settings"
    },
    {
      "name": "customDotfiles",
      "type": "textfield",
      "required": false,
      "title": "Custom Dotfiles",
      "description": "Comma-separated list of additional dotfiles to include (e.g., .tmux.conf,.config/nvim/init.vim)"
    }
  ]
}
```

---

## Phase 5: Testing & Polish

### Testing Checklist:
- [ ] Test save command with fresh macOS installation
- [ ] Test apply command on different machine
- [ ] Verify all defaults are correctly saved/restored
- [ ] Test dotfile backup and restoration
- [ ] Test package list generation and installation
- [ ] Test error handling (missing files, permission errors)
- [ ] Test with preferences enabled/disabled
- [ ] Test export to custom directory
- [ ] Verify no sensitive data is saved

### Polish Items:
- Add comprehensive error messages
- Add informative toast messages for each step
- Handle edge cases:
  - Missing Homebrew installation
  - Permission errors for dotfiles
  - Invalid settings file format
  - Corrupted manifest
- Add logging for debugging
- Consider adding a "View Settings" command to browse saved config
- Add README with usage instructions
- Add examples of settings manifest

---

## Data Structure

### Settings Manifest JSON:
```json
{
  "version": "1.0.0",
  "timestamp": "2025-11-15T10:30:00Z",
  "hostname": "MacBook-Pro.local",
  "osVersion": "14.6.0",
  "settings": {
    "defaults": {
      "com.apple.dock": {
        "tilesize": 48,
        "autohide": true,
        "show-recents": false
      },
      "com.apple.finder": {
        "AppleShowAllFiles": true,
        "FXPreferredViewStyle": "Nlsv"
      },
      "NSGlobalDomain": {
        "InitialKeyRepeat": 15,
        "KeyRepeat": 2
      }
    },
    "dotfiles": {
      ".zshrc": "# Content or base64 encoded",
      ".gitconfig": "# Content or base64 encoded"
    },
    "packages": {
      "homebrew": {
        "formulae": ["git", "node", "wget"],
        "casks": ["visual-studio-code", "raycast"]
      },
      "npm": ["typescript", "eslint", "prettier"]
    }
  }
}
```

---

## Key Settings to Migrate

### macOS Defaults (High Priority):
- **Dock**: size, position, autohide, magnification, show-recents
- **Finder**: show hidden files, default view, show extensions
- **Trackpad**: tap to click, tracking speed, natural scrolling
- **Keyboard**: key repeat rate, delay until repeat
- **Mission Control**: hot corners, spaces settings
- **Screenshots**: default location, format

### Dotfiles (Medium Priority):
- `.zshrc` / `.bashrc` - Shell configuration
- `.gitconfig` - Git configuration
- `.vimrc` - Vim configuration
- `.ssh/config` - SSH hosts (not keys!)
- `.tmux.conf` - Tmux configuration

### Packages (Optional):
- Homebrew formulae and casks
- npm/yarn global packages
- VS Code extensions list

---

## Technical Notes

### Storage:
- Primary storage: `${environment.supportPath}/settings.json`
- Backup storage: User-specified via preferences
- All file operations use `fs.promises` for async handling

### Shell Commands:
- Use `@raycast/utils` `useExec` for command execution
- Set appropriate timeouts for long-running commands
- Parse stdout/stderr carefully
- Handle command failures gracefully

### Safety:
- Never save sensitive data (passwords, SSH keys, tokens)
- Always create backups before applying settings
- Validate all user inputs
- Use confirmation dialogs for destructive operations
- Provide undo/rollback capability

### User Experience:
- Show progress toasts for operations > 2 seconds
- Use HUD for quick confirmations
- Provide clear error messages with solutions
- Include helpful tips in success messages
- Log all operations for troubleshooting

---

## Future Enhancements (v2)

1. **Cloud Sync**: Sync settings via iCloud/Dropbox
2. **Profiles**: Multiple setting profiles (Work, Personal, etc.)
3. **Scheduled Backups**: Auto-save settings periodically
4. **Diff View**: Compare current vs saved settings
5. **Selective Import**: Choose specific settings to apply
6. **Migration Wizard**: Step-by-step guided setup
7. **Application Settings**: Deeper integration with specific apps
8. **Version Control**: Track settings changes over time
