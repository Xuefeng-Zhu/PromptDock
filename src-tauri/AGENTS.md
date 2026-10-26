# AGENTS.md — `src-tauri/`

Rust backend. Tauri 2 + 5 standard plugins + the non-standard `enigo` crate for synthetic keyboard input. **The Rust layer is a thin command dispatcher** — no domain data lives here; every prompt/folder/settings/workspace mutation is handled in TypeScript.

## STRUCTURE

```
src-tauri/
├── src/
│   ├── main.rs            # Binary entry point; calls prompt_dock_lib::run()
│   ├── lib.rs             # Tauri builder, plugin registration, tray icon, window-close interceptor
│   └── commands.rs        # All 7 #[tauri::command]s + platform-specific helpers
├── build.rs               # tauri_build::build()
├── tauri.conf.json        # Tauri 2 config: 2 windows, 2 capability sets, CSP
├── gen/                   # Auto-generated Tauri capability/ACL JSON schemas (DO NOT EDIT)
├── icons/                 # Cross-platform app icons + android/ and ios/ subdirs
└── Cargo.toml             # prompt-dock v0.4.1, lib name prompt_dock_lib, AGPL-3.0
```

## TAURI COMMANDS (`commands.rs`)

| Command | Args | What it does |
|---|---|---|
| `copy_to_clipboard` | `text: String` | Writes `text` to OS clipboard via `tauri-plugin-clipboard-manager` |
| `paste_to_active_app` | (uses `State<LastActiveApp>`) | Captures frontmost app PID/HWND, hides PromptDock, activates the prior app, sleeps 350 ms, then sends `Cmd+V` (macOS, raw keycode 9) or `Ctrl+V` via `enigo` |
| `register_hotkey` | `shortcut: String` (uses `State<CurrentHotkey>`) | Registers a global shortcut via `tauri-plugin-global-shortcut`; idempotent on the same shortcut; empty string delegates to `unregister_hotkey` |
| `unregister_hotkey` | (uses `State<CurrentHotkey>`) | Unregisters the tracked shortcut (or `unregister_all` if none tracked) and clears state |
| `toggle_quick_launcher` | (uses `State<LastActiveApp>`) | If quick-launcher is visible, hides it; otherwise remembers the frontmost app, shows the launcher, centers, shows, and focuses it |
| `show_main_window` | — | `show_promptdock` (no-op on non-macOS) + `.show()` + `.set_focus()` on the main window. **Not invoked from the frontend** — only fired by the tray's left-click handler in `lib.rs:42-61` |
| `hide_main_window` | — | `.hide()` on the main window. Called from `src/utils/window.ts:9` |

## CAPABILITIES (`tauri.conf.json`, inline — no `capabilities/` directory)

**`main` window** (`main-capability`):
- `core:default`
- `global-shortcut:default`, `global-shortcut:allow-register`, `global-shortcut:allow-unregister`
- `clipboard-manager:default`, `clipboard-manager:allow-write-text`, `clipboard-manager:allow-read-text`
- `dialog:default`, `dialog:allow-save`
- `fs:default`, `fs:allow-write-text-file`
- `store:default`

**`quick-launcher` window** (`quick-launcher-capability`):
- `core:default`
- `clipboard-manager:default`, `clipboard-manager:allow-write-text`, `clipboard-manager:allow-read-text`
- `store:default`

The launcher is intentionally restricted — no global-shortcut, dialog, or fs permissions because it only needs clipboard + store reads.

**CSP** (`tauri.conf.json`): strict allowlist. `connect-src` allows Firebase endpoints (`*.googleapis.com`, `*.firebaseio.com`, `*.firebase.com`, `securetoken.googleapis.com`, `identitytoolkit.googleapis.com`, `accounts.google.com`, `*.google-analytics.com`, `googletagmanager.com`, `wss://*.firebaseio.com`) plus `ipc:` and the Vite dev server origins for local dev. **Do not loosen the CSP.**

## STATE (MINIMAL — NO DOMAIN DATA)

```rust
CurrentHotkey(Mutex<Option<String>>)   // tracked shortcut string
LastActiveApp(Mutex<Option<isize>>)    // macOS PID or Windows HWND-as-isize
```

Both registered with `app.manage(...)` in `lib.rs:13-14` and accessed via `tauri::State<'_, T>`. There is **no** persistent Rust state — no database, no in-memory prompt/folder cache, no event bus. The Rust layer intentionally has no domain data; every persistent operation is handled in TypeScript repositories. Rust state exists only to coordinate cross-invocation side effects (which hotkey is registered, where to send paste).

## PLATFORM-SPECIFIC CODE

- **macOS** (`#[cfg(target_os = "macos")]`): `objc2-app-kit` 0.3.2 (features: `NSRunningApplication`, `NSWorkspace`, `libc`) — fetches the frontmost app's PID and re-activates it.
- **Windows** (`#[cfg(target_os = "windows")]`): `windows-sys` 0.61 (features: `Win32_Foundation`, `Win32_System_Threading`, `Win32_UI_WindowsAndMessaging`) — `GetForegroundWindow`, `SetForegroundWindow`, `ShowWindow`.
- **Cross-platform**: `enigo` 0.6 — synthetic keyboard input for the paste command. No special features enabled.

## RUST ↔ FRONTEND COMMUNICATION

**One-way only: `invoke()` (request/response). No events.**

- Rust: 0 `emit` / `listen` / `event::` calls in `src-tauri/src/`. Rust never emits events.
- Frontend: 0 `listen(` / `emit(` calls in `src/`. Frontend never subscribes to events.

Invoke call sites:
- `src/utils/clipboard.ts:70` → `copy_to_clipboard({ text })`
- `src/utils/clipboard.ts:89` → `paste_to_active_app()`
- `src/utils/hotkey.ts:37,41` → `unregister_hotkey()`, `register_hotkey({ shortcut })`
- `src/utils/window.ts:9` → `hide_main_window()`
- `src/screens/quick-launcher/useQuickLauncherController.ts:90` → `toggle_quick_launcher()`

`withGlobalTauri: false` — the frontend uses `@tauri-apps/api/core`'s explicit `invoke()` import.

## ANTI-PATTERNS

- **Do not put domain logic in Rust.** The Rust layer is a thin command dispatcher; any non-trivial operation belongs in TypeScript.
- **Do not emit events from Rust.** If you need to push state to the frontend, write to a Tauri Store JSON file and have the frontend re-read.
- **Do not add a new Tauri command without updating both `src/utils/` and the matching `IStorageBackend` or hook.** New commands funnel through `try { invoke(...) } catch { /* browser fallback */ }`.
- **Do not loosen the CSP.** The Firebase allowlist is the minimum needed; any widening should be reviewed.
- **Do not edit `src-tauri/gen/`.** These are auto-generated Tauri capability/ACL JSON schemas.
- **Do not regenerate `src-tauri/icons/` by hand.** Use `npx @tauri-apps/cli icon` if the logo changes.

## ADDING A NEW TAURI COMMAND

1. Write the `#[tauri::command]` in `src-tauri/src/commands.rs` (generic over `R: Runtime`).
2. Add the command to `invoke_handler!` in `src-tauri/src/lib.rs:15-23`.
3. Add a permission to the relevant capability in `src-tauri/tauri.conf.json` if it touches a plugin API.
4. Add a `try { invoke(...) } catch { /* browser fallback */ }` wrapper in the matching `src/utils/*.ts` module — never call `invoke` from a component.
5. Add a unit test in `src-tauri/src/commands.rs` (`#[cfg(test)] mod tests`).

## TESTING

- `cargo test --manifest-path src-tauri/Cargo.toml` — runs the 4 unit tests for hotkey state in `commands.rs`.
- `npm run test:e2e:tauri` — WebDriverIO + `tauri-driver` smoke tests (Linux/Windows only; see `e2e-tauri/AGENTS.md`).
