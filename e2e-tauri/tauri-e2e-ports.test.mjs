import { describe, expect, it, vi } from 'vitest';
import {
  assertDistinctTauriDriverPorts,
  parseTcpPort,
  readConfiguredTauriDriverPorts,
  resolveTauriDriverPorts,
} from './tauri-e2e-ports.mjs';

describe('Tauri E2E port helpers', () => {
  it('parses configured TCP ports', () => {
    expect(parseTcpPort(undefined, 'TEST_PORT')).toBeNull();
    expect(parseTcpPort('', 'TEST_PORT')).toBeNull();
    expect(parseTcpPort('4444', 'TEST_PORT')).toBe(4444);
  });

  it.each(['0', '65536', 'abc', '42.5'])('rejects invalid TCP port %s', (value) => {
    expect(() => parseTcpPort(value, 'TEST_PORT')).toThrow(
      'TEST_PORT must be an integer between 1 and 65535.',
    );
  });

  it('reads configured driver ports from an environment object', () => {
    expect(readConfiguredTauriDriverPorts({
      PROMPTDOCK_TAURI_DRIVER_PORT: '4444',
      PROMPTDOCK_TAURI_NATIVE_DRIVER_PORT: '5555',
    })).toEqual({
      configuredTauriDriverPort: 4444,
      configuredNativeDriverPort: 5555,
    });
  });

  it('rejects matching configured driver ports', () => {
    expect(() => readConfiguredTauriDriverPorts({
      PROMPTDOCK_TAURI_DRIVER_PORT: '4444',
      PROMPTDOCK_TAURI_NATIVE_DRIVER_PORT: '4444',
    })).toThrow('PROMPTDOCK_TAURI_DRIVER_PORT and PROMPTDOCK_TAURI_NATIVE_DRIVER_PORT must differ.');
  });

  it('allocates the native port outside the configured driver port', async () => {
    const findPort = vi.fn(async (_host, excludedPorts = new Set()) => {
      expect(excludedPorts.has(4444)).toBe(true);
      return 5555;
    });

    await expect(resolveTauriDriverPorts({
      configuredTauriDriverPort: 4444,
      findPort,
    })).resolves.toEqual({
      driverPort: 4444,
      nativeDriverPort: 5555,
    });
  });

  it('rejects matching resolved driver ports', async () => {
    await expect(resolveTauriDriverPorts({
      configuredTauriDriverPort: 4444,
      configuredNativeDriverPort: 4444,
    })).rejects.toThrow(
      'PROMPTDOCK_TAURI_DRIVER_PORT and PROMPTDOCK_TAURI_NATIVE_DRIVER_PORT must differ.',
    );
  });

  it('rejects matching ports through the shared assertion', () => {
    expect(() => assertDistinctTauriDriverPorts(4444, 4444)).toThrow(
      'PROMPTDOCK_TAURI_DRIVER_PORT and PROMPTDOCK_TAURI_NATIVE_DRIVER_PORT must differ.',
    );
  });
});
