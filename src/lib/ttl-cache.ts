interface CacheEntry<Value> {
  expiresAt: number;
  value: Value;
}

export class TtlCache<Value> {
  private readonly entries = new Map<string, CacheEntry<Value>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): Value | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: Value): Value {
    this.entries.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
    return value;
  }

  delete(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }
}
