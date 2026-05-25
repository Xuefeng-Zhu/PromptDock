import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  readConfiguredTauriDriverPorts,
  resolveTauriDriverPorts,
  waitForTcpPort,
} from './tauri-e2e-ports.mjs';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const appBinary = process.platform === 'win32' ? 'prompt-dock.exe' : 'prompt-dock';
const appPath = path.join(rootDir, 'src-tauri', 'target', 'debug', appBinary);
const tauriDriverPath = process.env.TAURI_DRIVER;
const storePrefix =
  process.env.PROMPTDOCK_TAURI_E2E_STORE_PREFIX ?? `e2e-${Date.now()}-${process.pid}-`;

let tauriDriver = null;

function closeTauriDriver() {
  if (!tauriDriver || tauriDriver.killed) return;
  tauriDriver.kill();
  tauriDriver = null;
}

const {
  configuredTauriDriverPort,
  configuredNativeDriverPort,
} = readConfiguredTauriDriverPorts();

function buildTauriApp() {
  if (process.env.PROMPTDOCK_TAURI_E2E_SKIP_BUILD === '1') {
    if (!existsSync(appPath)) {
      throw new Error(`PROMPTDOCK_TAURI_E2E_SKIP_BUILD=1 was set, but ${appPath} does not exist.`);
    }
    return;
  }

  const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(
    npmExecutable,
    [
      'run',
      'tauri',
      'build',
      '--',
      '--debug',
      '--no-bundle',
      '--config',
      'e2e-tauri/tauri.e2e.conf.json',
      '--ci',
    ],
    {
      cwd: rootDir,
      env: {
        ...process.env,
        VITE_FIREBASE_ANALYTICS_ENABLED: 'false',
        VITE_PROMPTDOCK_TAURI_E2E: 'true',
        VITE_PROMPTDOCK_STORE_PREFIX: storePrefix,
      },
      stdio: 'inherit',
    },
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Tauri debug build failed with status ${result.status}.`);
  }
}

process.once('exit', closeTauriDriver);

export const config = {
  runner: 'local',
  host: '127.0.0.1',
  port: configuredTauriDriverPort ?? 0,
  specs: [path.join(rootDir, 'e2e-tauri', 'specs', '**', '*.e2e.mjs')],
  maxInstances: 1,
  capabilities: [
    {
      maxInstances: 1,
      'tauri:options': {
        application: appPath,
      },
    },
  ],
  logLevel: 'warn',
  bail: 0,
  waitforTimeout: 10_000,
  connectionRetryTimeout: 120_000,
  connectionRetryCount: 2,
  framework: 'jasmine',
  reporters: ['spec'],
  jasmineOpts: {
    defaultTimeoutInterval: 120_000,
  },
  onPrepare: buildTauriApp,
  beforeSession: async (wdioConfig) => {
    if (!tauriDriverPath) {
      throw new Error('TAURI_DRIVER must point to a tauri-driver executable.');
    }

    const { driverPort, nativeDriverPort } = await resolveTauriDriverPorts({
      configuredTauriDriverPort,
      configuredNativeDriverPort,
    });
    config.port = driverPort;
    wdioConfig.port = driverPort;

    tauriDriver = spawn(tauriDriverPath, [
      '--port',
      String(driverPort),
      '--native-port',
      String(nativeDriverPort),
    ], {
      env: {
        ...process.env,
        PROMPTDOCK_TAURI_E2E: 'true',
      },
      stdio: ['ignore', 'inherit', 'inherit'],
    });

    tauriDriver.once('error', (error) => {
      throw error;
    });

    await waitForTcpPort(driverPort);
  },
  afterSession: closeTauriDriver,
  onComplete: closeTauriDriver,
};
