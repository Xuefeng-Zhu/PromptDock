# PromptDock

A local-first desktop prompt recipe manager built with Tauri 2, React, TypeScript, and Tailwind CSS. Create, edit, search, and use AI prompt templates with variable substitution — no account required.

## Features

- **Local-first**: Fully functional without an account. All data stored on disk.
- **Variable templates**: Use `{{variable_name}}` placeholders in prompts, fill them at use time.
- **Quick Launcher**: Global hotkey (Cmd+Shift+P / Ctrl+Shift+P) opens a search overlay for instant prompt access.
- **Clipboard & Paste**: Copy rendered prompts to clipboard or paste directly into the active app.
- **Import/Export**: Back up and share prompts as JSON files.
- **Optional sync**: Sign in with Firebase Auth to sync prompts across devices via Cloud Firestore.
- **Conflict resolution**: Side-by-side diff view for resolving sync conflicts.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Tauri CLI prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

## Development

```bash
# Run the Tauri desktop app in dev mode
npm run tauri dev

# Run just the frontend (without Tauri shell)
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_USE_EMULATOR` | Connect to Firebase emulators | `false` |
| `VITE_FIREBASE_API_KEY` | Firebase API key | — |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | — |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | — |
| `VITE_EMULATOR_AUTH_HOST` | Auth emulator URL | `http://localhost:9099` |
| `VITE_EMULATOR_FIRESTORE_HOST` | Firestore emulator URL | `http://localhost:8080` |

Firebase variables are only needed if you enable sync. The app works fully in Local Mode without them.

## Firebase Emulator

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Start emulators
firebase emulators:start

# Set VITE_USE_EMULATOR=true in .env to connect
```

## Build

```bash
npm run tauri build
```

## Project Structure

```
src/
├── types/              # TypeScript interfaces and types
├── repositories/       # Data access layer (local storage + Firestore)
├── services/           # Business logic (parser, renderer, search, sync)
├── stores/             # Zustand state management
├── components/         # Reusable React components
├── screens/            # Full-screen views
├── contexts/           # React context providers
└── firebase/           # Firebase configuration

src-tauri/
├── src/
│   ├── main.rs         # Tauri entry point
│   ├── lib.rs          # Plugin setup, tray icon, command registration
│   └── commands.rs     # Rust commands (clipboard, paste, window management)
├── Cargo.toml          # Rust dependencies
└── tauri.conf.json     # Tauri app configuration
```

## Testing

45 tests covering core services and repositories with both unit tests and property-based tests (fast-check):

- **VariableParser**: Extraction, deduplication, case sensitivity, round-trip
- **PromptRenderer**: Substitution, missing variables, identity, no-placeholder
- **SearchEngine**: Ranking, case insensitivity, archived exclusion, recall
- **ImportExportService**: Round-trip, schema validation, duplicate detection
- **PromptRepository**: CRUD, archive/restore, duplicate, favorite toggle

## License

ISC
