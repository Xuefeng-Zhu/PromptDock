import net from 'node:net';

export function waitForTcpPort(port, host = '127.0.0.1', timeoutMs = 10_000) {
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

export function parseTcpPort(value, envName) {
  if (value === undefined || value === '') return null;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`${envName} must be an integer between 1 and 65535.`);
  }
  return port;
}

export function listenOnRandomPort(host = '127.0.0.1') {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once('error', reject);
    server.listen(0, host, () => {
      resolve(server);
    });
  });
}

export function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export async function findAvailableTcpPort(host = '127.0.0.1', excludedPorts = new Set()) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const server = await listenOnRandomPort(host);
    const address = server.address();
    await closeServer(server);

    if (!address || typeof address === 'string') {
      throw new Error(`Could not allocate a TCP port on ${host}.`);
    }
    if (!excludedPorts.has(address.port)) {
      return address.port;
    }
  }
  throw new Error(`Could not allocate a TCP port on ${host} outside the excluded set.`);
}

export function assertDistinctTauriDriverPorts(driverPort, nativeDriverPort) {
  if (driverPort !== null && driverPort === nativeDriverPort) {
    throw new Error('PROMPTDOCK_TAURI_DRIVER_PORT and PROMPTDOCK_TAURI_NATIVE_DRIVER_PORT must differ.');
  }
}

export function readConfiguredTauriDriverPorts(env = process.env) {
  const configuredTauriDriverPort = parseTcpPort(
    env.PROMPTDOCK_TAURI_DRIVER_PORT,
    'PROMPTDOCK_TAURI_DRIVER_PORT',
  );
  const configuredNativeDriverPort = parseTcpPort(
    env.PROMPTDOCK_TAURI_NATIVE_DRIVER_PORT,
    'PROMPTDOCK_TAURI_NATIVE_DRIVER_PORT',
  );

  assertDistinctTauriDriverPorts(configuredTauriDriverPort, configuredNativeDriverPort);

  return { configuredTauriDriverPort, configuredNativeDriverPort };
}

export async function resolveTauriDriverPorts({
  configuredTauriDriverPort = null,
  configuredNativeDriverPort = null,
  findPort = findAvailableTcpPort,
  host = '127.0.0.1',
} = {}) {
  const driverPort = configuredTauriDriverPort ?? await findPort(host);
  const nativeDriverPort = configuredNativeDriverPort
    ?? await findPort(host, new Set([driverPort]));

  assertDistinctTauriDriverPorts(driverPort, nativeDriverPort);

  return { driverPort, nativeDriverPort };
}
