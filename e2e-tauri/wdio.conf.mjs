import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const appBinary = process.platform === 'win32' ? 'prompt-dock.exe' : 'prompt-dock';
const appPath = path.join(rootDir, 'src-tauri', 'target', 'debug', appBinary);
const tauriDriverPath = process.env.TAURI_DRIVER;
const tauriDriverPort = 4444;
const storePrefix =
  process.env.PROMPTDOCK_TAURI_E2E_STORE_PREFIX ?? `e2e-${Date.now()}-${process.pid}-`;

let tauriDriver = null;

function closeTauriDriver() {
  if (!tauriDriver || tauriDriver.killed) return;
  tauriDriver.kill();
  tauriDriver = null;
}

function waitForTcpPort(port, host = '127.0.0.1', timeoutMs = 10_000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.createConnection({ host, port }, () => {
        socket.end();
        resolve();
      });

      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for tauri-driver on ${host}:${port}`));
          return;
        }
        setTimeout(attempt, 100);
      });
    };

    attempt();
  });
}

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
  port: tauriDriverPort,
  specs: ['./e2e-tauri/specs/**/*.e2e.mjs'],
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
  beforeSession: async () => {
    if (!tauriDriverPath) {
      throw new Error('TAURI_DRIVER must point to a tauri-driver executable.');
    }

    tauriDriver = spawn(tauriDriverPath, [], {
      env: {
        ...process.env,
        PROMPTDOCK_TAURI_E2E: 'true',
      },
      stdio: ['ignore', 'inherit', 'inherit'],
    });

    tauriDriver.once('error', (error) => {
      throw error;
    });

    await waitForTcpPort(tauriDriverPort);
  },
  afterSession: closeTauriDriver,
  onComplete: closeTauriDriver,
};
