# AGENTS.md

## Commands
- **Build**: `npm run build` or `ray build`
- **Dev**: `npm run dev` or `ray develop` (runs the extension in development mode)
- **Lint**: `npm run lint` or `ray lint`
- **Fix lint**: `npm run fix-lint` or `ray lint --fix`
- **Publish**: `npm run publish` (publishes to Raycast Store)
- **No test suite**: This project does not have tests configured

## Architecture
- **Type**: Raycast extension for macOS settings migration
- **Commands**: Two no-view commands (`save-settings.ts`, `apply-settings.ts`) that run in background
- **Structure**: `src/utils/` contains collectors (gather settings), appliers (apply settings), storage (save/load), exec (shell commands), and types
- **Data**: Settings stored in JSON manifest with defaults, dotfiles, and package lists

## Code Style
- **TypeScript**: Strict mode enabled, ES2023 target, CommonJS modules
- **Formatting**: Prettier with 120 char line width, double quotes
- **Linting**: Uses `@raycast/eslint-config`
- **Imports**: Raycast API imports first, then local utils, types imported with `type` keyword
- **Error handling**: Try-catch with Toast notifications and console.error logging
- **Naming**: camelCase for variables/functions, PascalCase for types/interfaces
