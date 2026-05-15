import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const supportedPlatforms = new Set(['linux', 'win32']);

function executableNames(command) {
  if (process.platform !== 'win32') return [command];
  if (path.extname(command)) return [command];

  const extensions = (process.env.PATHEXT ?? '.EXE;.CMD;.BAT')
    .split(';')
    .filter(Boolean);
  return extensions.map((extension) => `${command}${extension.toLowerCase()}`);
}

function findOnPath(command) {
  const pathEntries = (process.env.PATH ?? '').split(path.delimiter).filter(Boolean);
  for (const entry of pathEntries) {
    for (const executable of executableNames(command)) {
      const candidate = path.join(entry, executable);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

function resolveTauriDriver() {
  if (process.env.TAURI_DRIVER) {
    if (existsSync(process.env.TAURI_DRIVER)) return process.env.TAURI_DRIVER;
    return findOnPath(process.env.TAURI_DRIVER);
  }

  const defaultName = process.platform === 'win32' ? 'tauri-driver.exe' : 'tauri-driver';
  const defaultPath = path.join(os.homedir(), '.cargo', 'bin', defaultName);
  return existsSync(defaultPath) ? defaultPath : findOnPath('tauri-driver');
}

if (!supportedPlatforms.has(process.platform)) {
  console.warn(
    '[tauri:e2e] Skipping Tauri desktop E2E: official tauri-driver desktop WebDriver support is limited to Windows and Linux.',
  );
  console.warn('[tauri:e2e] macOS currently has no WKWebView WebDriver tool available.');
  process.exit(0);
}

const tauriDriverPath = resolveTauriDriver();
if (!tauriDriverPath) {
  console.error('[tauri:e2e] Missing tauri-driver. Install it with: cargo install tauri-driver --locked');
  if (process.platform === 'linux') {
    console.error('[tauri:e2e] Linux also needs WebKitWebDriver, for example: sudo apt-get install webkit2gtk-driver');
  }
  process.exit(1);
}

const wdioPath = path.join(
  rootDir,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'wdio.cmd' : 'wdio',
);

if (!existsSync(wdioPath)) {
  console.error('[tauri:e2e] Missing WebdriverIO binary. Run npm install first.');
  process.exit(1);
}

const result = spawnSync(wdioPath, ['run', path.join(rootDir, 'e2e-tauri', 'wdio.conf.mjs')], {
  cwd: rootDir,
  env: {
    ...process.env,
    TAURI_DRIVER: tauriDriverPath,
  },
  stdio: 'inherit',
});

if (result.error) {
  console.error(`[tauri:e2e] Failed to start WebdriverIO: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
