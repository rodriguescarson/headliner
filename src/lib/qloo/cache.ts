import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/** Persistent read-through cache for Qloo responses. Qloo allows server-side caching with no time limit. */
export interface CacheStore {
  get(key: string): Promise<unknown | undefined>;
  set(key: string, value: unknown): Promise<void>;
}

export class MemoryCache implements CacheStore {
  private map = new Map<string, unknown>();
  async get(key: string) {
    return this.map.get(key);
  }
  async set(key: string, value: unknown) {
    this.map.set(key, value);
  }
}

/** File cache for local development. The directory is git-ignored; Qloo data must never be committed. */
export class FileCache implements CacheStore {
  constructor(private dir: string) {}
  private file(key: string) {
    return path.join(this.dir, `${key}.json`);
  }
  async get(key: string) {
    try {
      return JSON.parse(await readFile(this.file(key), "utf8"));
    } catch {
      return undefined;
    }
  }
  async set(key: string, value: unknown) {
    await mkdir(this.dir, { recursive: true });
    await writeFile(this.file(key), JSON.stringify(value));
  }
}

export function cacheKey(pathname: string, params: Record<string, string>) {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(`${pathname}?${sorted}`).digest("hex");
}

let defaultStore: CacheStore | undefined;
export function defaultCache(): CacheStore {
  if (!defaultStore) {
    const dir = process.env.HEADLINER_CACHE_DIR;
    defaultStore =
      dir && process.env.VERCEL !== "1"
        ? new FileCache(dir)
        : new MemoryCache();
  }
  return defaultStore;
}
