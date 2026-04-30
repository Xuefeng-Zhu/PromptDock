# PromptDock

A local-first, cross-platform desktop prompt recipe manager. Press a global hotkey, search your prompt library, fill template variables, and copy or paste the final prompt into any active application.

Built with **Tauri 2** (Rust) + **React 18** + **TypeScript** + **Vite** + **Tailwind CSS v4**.

## Features

- Create, edit, search, and organize reusable AI prompt templates
- Variable substitution with `{{variable_name}}` placeholders
- Global hotkey (Cmd+Shift+P / Ctrl+Shift+P) for a quick launcher overlay
- Copy to clipboard or paste directly into the active application
- Folder and tag organization with favorites
- Import/export prompts as JSON
- Optional cross-device sync via Firebase Auth + Cloud Firestore
- Offline-first — works fully without an account or network

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS
- (Optional) [Firebase CLI](https://firebase.google.com/docs/cli) for emulator support

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd prompt-dock

# Install frontend dependencies
npm install
```

## Environment Variables

Copy the example environment file and fill in values as needed:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `VITE_USE_EMULATOR` | Connect to Firebase Emulator Suite | `false` |
| `VITE_FIREBASE_API_KEY` | Firebase API key (required for sync) | — |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain (required for sync) | — |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID (required for sync) | — |
| `VITE_EMULATOR_AUTH_HOST` | Auth emulator host | `http://localhost:9099` |
| `VITE_EMULATOR_FIRESTORE_HOST` | Firestore emulator host | `localhost:8080` |

Firebase variables are only needed if you want to use the optional sync feature. The app is fully functional in Local Mode without them.

## Development

```bash
# Start the Tauri development server (frontend + Rust backend)
npm run tauri dev

# Start only the Vite frontend dev server (no Tauri shell)
npm run dev
```

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

### Firebase Emulator Suite

To develop and test sync features locally without affecting production data:

1. Install the Firebase CLI if you haven't already:

   ```bash
   npm install -g firebase-tools
   ```

2. Start the emulators:

   ```bash
   firebase emulators:start
   ```

   This starts the Auth emulator on port 9099, Firestore emulator on port 8080, and the Emulator UI on port 4000.

3. Set `VITE_USE_EMULATOR=true` in your `.env` file:

   ```
   VITE_USE_EMULATOR=true
   ```

4. Start the dev server — the app will automatically connect to the local emulators instead of production Firebase.

5. Open the Emulator UI at [http://localhost:4000](http://localhost:4000) to inspect Auth users and Firestore data.

## Build

```bash
# Build the production Tauri application
npm run tauri build

# Build only the frontend (outputs to dist/)
npm run build
```

The Tauri build produces platform-specific installers in `src-tauri/target/release/bundle/`.

## Project Structure

```
prompt-dock/
├── src/                          # React frontend source
│   ├── components/               # Reusable UI components
│   │   ├── PromptCard.tsx        # Prompt list item card
│   │   ├── SearchBar.tsx         # Search input component
│   │   ├── SyncStatusBar.tsx     # Sync status indicator
│   │   └── VariableFillModal.tsx # Variable input modal
│   ├── contexts/                 # React context providers
│   │   └── AppModeProvider.tsx   # Application mode context (local/synced)
│   ├── firebase/                 # Firebase configuration
│   │   └── config.ts            # Lazy Firebase initialization
│   ├── repositories/             # Data access layer
│   │   ├── interfaces.ts        # Repository interfaces
│   │   ├── local-storage-backend.ts  # Local JSON file storage
│   │   ├── firestore-backend.ts      # Firestore storage backend
│   │   ├── prompt-repository.ts      # Prompt CRUD operations
│   │   ├── workspace-repository.ts   # Workspace management
│   │   └── settings-repository.ts    # User settings
│   ├── screens/                  # Application screens
│   │   ├── PromptEditor.tsx      # Prompt create/edit form
│   │   ├── QuickLauncherWindow.tsx   # Global hotkey overlay
│   │   ├── SettingsScreen.tsx    # App settings and account
│   │   └── ConflictCenter.tsx    # Sync conflict resolution
│   ├── services/                 # Business logic
│   │   ├── interfaces.ts        # Service interfaces
│   │   ├── variable-parser.ts   # {{variable}} extraction
│   │   ├── prompt-renderer.ts   # Template rendering
│   │   ├── search-engine.ts     # Local prompt search
│   │   ├── import-export.ts     # JSON import/export
│   │   ├── auth-service.ts      # Firebase Auth operations
│   │   ├── sync-service.ts      # Real-time sync logic
│   │   ├── conflict-service.ts  # Conflict detection
│   │   └── seed-data.ts         # Sample prompts for first launch
│   ├── stores/                   # Zustand state management
│   │   ├── prompt-store.ts      # Prompt library state
│   │   ├── app-mode-store.ts    # App mode state machine
│   │   └── settings-store.ts    # Settings state
│   ├── types/                    # TypeScript type definitions
│   │   └── index.ts             # Core interfaces and types
│   ├── App.tsx                   # Root React component
│   ├── main.tsx                  # Application entry point
│   └── styles.css                # Tailwind CSS entry point
├── src-tauri/                    # Tauri 2 Rust backend
│   ├── src/
│   │   ├── main.rs              # Rust entry point
│   │   ├── lib.rs               # Tauri app builder and setup
│   │   └── commands.rs          # Clipboard, hotkey, window commands
│   ├── Cargo.toml               # Rust dependencies
│   └── tauri.conf.json          # Tauri configuration
├── firebase.json                 # Firebase Emulator Suite configuration
├── firestore.rules               # Firestore security rules
├── firestore.indexes.json        # Firestore composite indexes
├── .env.example                  # Environment variable template
├── vite.config.ts                # Vite build configuration
├── vitest.config.ts              # Vitest test configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Node.js dependencies and scripts
```

## Architecture

PromptDock follows a **repository pattern** with swappable storage backends:

- **Local Mode** (default): All data stored as JSON files on disk via the Tauri Store plugin. No account or network required.
- **Synced Mode** (opt-in): Sign in with email/password to sync prompts across devices via Cloud Firestore with offline persistence.

Firebase SDK is lazily loaded — it is never imported or initialized unless the user opts into sync, keeping the local-mode bundle lean.

## License

Private — all rights reserved.
