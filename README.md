# macOS Migrator

A Raycast extension that helps you seamlessly migrate your macOS settings to a new machine. Save all your system preferences, configuration files, and installed packages, then restore them with a single command.

## Features

- **Save Settings**: Capture your current macOS configuration in a single command
  - macOS defaults (Dock, Finder, Trackpad, Keyboard, Mission Control, etc.)
  - Dotfiles (.zshrc, .gitconfig, .vimrc, .ssh/config, and custom files)
  - Package lists (Homebrew formulae, casks, npm, yarn)

- **Apply Settings**: Restore saved settings to any macOS machine
  - Confirmation dialog showing what will be applied
  - Automatic backup before applying changes
  - Selective application of settings categories
  - Clear feedback on what was applied

- **Flexible Configuration**: Customize which settings to save and apply
  - Choose whether to include dotfiles
  - Optionally save and install package lists
  - Add custom dotfiles to your migration
  - Set a default export directory

## Installation

Install via the Raycast Store or clone this repository and run `npm install && npm run build`.

## Usage

### Saving Settings

1. Press Cmd+K (or your Raycast hotkey) and type "Save Settings"
2. The extension will collect:
   - macOS system defaults
   - Your configuration files
   - Installed packages (if enabled)
3. Settings are saved locally and optionally exported to your specified directory

### Applying Settings

1. Press Cmd+K and type "Apply Settings"
2. Review the confirmation dialog showing what will be applied
3. Choose "Apply Settings" to proceed
   - A backup will be created first (if enabled)
   - Settings will be applied to your system
4. Some changes may require restarting applications or logging out

## Configuration

Configure the extension via Raycast preferences:

- **Export Directory**: Optional default location for settings backups
- **Include Dotfiles**: Include configuration files in save (enabled by default)
- **Include Package Lists**: Save and install package lists (disabled by default)
- **Auto-backup Before Apply**: Create a backup before applying settings (enabled by default)
- **Custom Dotfiles**: Comma-separated list of additional dotfiles to include (e.g., `.tmux.conf,.config/nvim/init.vim`)

## What Gets Saved

### macOS Defaults
- Dock (size, position, autohide, magnification)
- Finder (show hidden files, default view, file extensions)
- Trackpad (tap to click, tracking speed, natural scrolling)
- Keyboard (key repeat, delay)
- Mission Control (hot corners, spaces)
- Screenshots (location, format)

### Dotfiles
- `.zshrc` and `.bashrc` (shell configuration)
- `.gitconfig` (Git configuration)
- `.vimrc` (Vim configuration)
- `.ssh/config` (SSH hosts, not keys)
- `.tmux.conf` (Tmux configuration)
- Any custom files you specify

### Packages
- Homebrew formulae and casks
- npm and yarn global packages

## Safety Features

- **No Sensitive Data**: Passwords, SSH keys, and access tokens are never saved
- **Automatic Backups**: Creates a backup of current settings before applying
- **Confirmation Dialogs**: Shows exactly what will be applied before making changes
- **Error Handling**: Detailed feedback when issues occur

## Data Format

Settings are stored in a JSON manifest with the following structure:

```json
{
  "version": "1.0.0",
  "timestamp": "2025-11-15T10:30:00Z",
  "hostname": "MacBook-Pro.local",
  "osVersion": "14.6.0",
  "settings": {
    "defaults": {
      "com.apple.dock": { "tilesize": 48, "autohide": true },
      "com.apple.finder": { "AppleShowAllFiles": true }
    },
    "dotfiles": {
      ".zshrc": "# Shell configuration content"
    },
    "packages": {
      "homebrew": {
        "formulae": ["git", "node"],
        "casks": ["visual-studio-code"]
      },
      "npm": ["typescript", "eslint"]
    }
  }
}
```

## Troubleshooting

### No saved settings found
Run "Save Settings" first to create your initial settings backup.

### Some settings failed to apply
Check the console output for specific errors. Some settings may require elevated permissions or depend on other software being installed.

### Changes require restart
After applying settings, you may need to restart applications or log out for some changes to take effect.

## Requirements

- macOS 12.0 or later
- Raycast 1.50.0 or later
- Homebrew (optional, only if including packages)

## Development

Build and run the extension in development mode:

```bash
npm run dev
```

Build for distribution:

```bash
npm run build
```

Lint and fix code style:

```bash
npm run lint
npm run fix-lint
```

## License

MIT
