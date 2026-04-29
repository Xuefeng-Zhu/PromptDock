import { load, type Store } from '@tauri-apps/plugin-store';

export class LocalStorageBackend {
  private stores = new Map<string, Store>();

  async getStore(name: string): Promise<Store> {
    let store = this.stores.get(name);
    if (!store) {
      store = await load(`${name}.json`, { autoSave: true });
      this.stores.set(name, store);
    }
    return store;
  }

  async read<T>(storeName: string, key: string): Promise<T | null> {
    try {
      const store = await this.getStore(storeName);
      const value = await store.get<T>(key);
      return value ?? null;
    } catch (e) {
      console.error(`Failed to read ${storeName}/${key}:`, e);
      return null;
    }
  }

  async write<T>(storeName: string, key: string, value: T): Promise<void> {
    const store = await this.getStore(storeName);
    await store.set(key, value);
    await store.save();
  }

  async readAll<T>(storeName: string): Promise<T[]> {
    return (await this.read<T[]>(storeName, 'items')) ?? [];
  }

  async writeAll<T>(storeName: string, items: T[]): Promise<void> {
    await this.write(storeName, 'items', items);
  }
}

export const localStorageBackend = new LocalStorageBackend();
