/**
 * Centralized Weather Data Architecture — In-Memory Cache & Deduplication
 * Harmausam Meteorological Intelligence Platform
 *
 * Implements:
 * - Time-To-Live (TTL) expiration with automatic pruning
 * - In-flight promise pooling (concurrent request deduplication)
 * - AbortController signal listening for safe request cancellation
 * - Cache key hashing and hit/miss telemetry for pipeline observability
 */

interface CacheEntry<T> {
  data: T;
  cachedAt: number; // Date.now() timestamp
  expiresAt: number; // Date.now() timestamp
}

export interface CacheOptions {
  ttlMs?: number; // Time-to-live in milliseconds
  signal?: AbortSignal;
}

export interface CacheStats {
  hits: number;
  misses: number;
  inFlightDeduplications: number;
  size: number;
  evictions: number;
}

export class WeatherCache {
  private cache = new Map<string, CacheEntry<any>>();
  private inFlight = new Map<string, Promise<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    inFlightDeduplications: 0,
    size: 0,
    evictions: 0,
  };

  /** Default TTL: 10 minutes */
  private readonly defaultTtlMs: number;

  constructor(defaultTtlMs: number = 10 * 60 * 1000) {
    this.defaultTtlMs = defaultTtlMs;
  }

  /**
   * Generates a deterministic cache key from arbitrary objects/primitives.
   */
  public static generateKey(namespace: string, params: Record<string, any>): string {
    const sortedKeys = Object.keys(params).sort();
    const serialized = sortedKeys
      .map((k) => {
        const val = params[k];
        if (val === undefined || val === null) return `${k}:null`;
        if (Array.isArray(val)) return `${k}:[${val.slice().sort().join(',')}]`;
        if (typeof val === 'object') return `${k}:${JSON.stringify(val)}`;
        return `${k}:${val}`;
      })
      .join('|');
    return `${namespace}::${serialized}`;
  }

  /**
   * Retrieve from cache or compute via fetcher function with automatic deduplication.
   */
  public async getOrFetch<T>(
    key: string,
    fetcher: (signal?: AbortSignal) => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const now = Date.now();
    const ttl = options?.ttlMs ?? this.defaultTtlMs;
    const signal = options?.signal;

    // Check if signal is already aborted
    if (signal?.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }

    // 1. Check existing unexpired cache entry
    const existing = this.cache.get(key);
    if (existing) {
      if (now < existing.expiresAt) {
        this.stats.hits++;
        return existing.data as T;
      } else {
        // Expired entry
        this.cache.delete(key);
        this.stats.evictions++;
      }
    }

    // 2. Check if a request for this exact key is already in-flight (deduplication)
    const pending = this.inFlight.get(key);
    if (pending) {
      this.stats.inFlightDeduplications++;
      return pending as Promise<T>;
    }

    // 3. Initiate fetcher and register in-flight promise
    this.stats.misses++;

    const promise = (async () => {
      try {
        const data = await fetcher(signal);

        // Store into cache upon successful resolution
        this.cache.set(key, {
          data,
          cachedAt: Date.now(),
          expiresAt: Date.now() + ttl,
        });
        this.stats.size = this.cache.size;

        return data;
      } finally {
        // Always clean up in-flight promise pool
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Direct manual set into cache.
   */
  public set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTtlMs;
    this.cache.set(key, {
      data,
      cachedAt: Date.now(),
      expiresAt: Date.now() + ttl,
    });
    this.stats.size = this.cache.size;
  }

  /**
   * Direct manual get from cache.
   */
  public get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.evictions++;
      this.stats.size = this.cache.size;
      return undefined;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Check if an unexpired key exists.
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Invalidate specific key or namespace pattern.
   */
  public invalidate(keyOrPrefix: string): number {
    let count = 0;
    for (const k of this.cache.keys()) {
      if (k === keyOrPrefix || k.startsWith(keyOrPrefix)) {
        this.cache.delete(k);
        count++;
      }
    }
    this.stats.size = this.cache.size;
    return count;
  }

  /**
   * Clear entire cache and pending requests.
   */
  public clear(): void {
    this.cache.clear();
    this.inFlight.clear();
    this.stats.size = 0;
  }

  /**
   * Return telemetry stats.
   */
  public getStats(): Readonly<CacheStats> {
    return { ...this.stats, size: this.cache.size };
  }
}
