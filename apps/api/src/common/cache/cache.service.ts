import { Injectable } from "@nestjs/common";

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

@Injectable()
export class CacheService {
  private readonly store = new Map<string, CacheEntry>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Periodically purge expired entries every 60s
    this.cleanupInterval = setInterval(() => this.purgeExpired(), 60_000);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  onModuleDestroy(): void {
    clearInterval(this.cleanupInterval);
  }
}
