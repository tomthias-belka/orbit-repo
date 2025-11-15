/**
 * LRU Cache Implementation
 * Used to cache variable lookups and reduce API calls
 */

interface CacheNode<K, V> {
  key: K;
  value: V;
  prev: CacheNode<K, V> | null;
  next: CacheNode<K, V> | null;
}

export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, CacheNode<K, V>>;
  private head: CacheNode<K, V> | null;
  private tail: CacheNode<K, V> | null;
  private hitCount: number;
  private missCount: number;

  constructor(capacity: number = 1000) {
    this.capacity = capacity;
    this.cache = new Map();
    this.head = null;
    this.tail = null;
    this.hitCount = 0;
    this.missCount = 0;
  }

  get(key: K): V | undefined {
    const node = this.cache.get(key);

    if (!node) {
      this.missCount++;
      return undefined;
    }

    this.hitCount++;
    this.moveToFront(node);
    return node.value;
  }

  set(key: K, value: V): void {
    const existingNode = this.cache.get(key);

    if (existingNode) {
      existingNode.value = value;
      this.moveToFront(existingNode);
      return;
    }

    const newNode: CacheNode<K, V> = {
      key,
      value,
      prev: null,
      next: null
    };

    this.cache.set(key, newNode);
    this.addToFront(newNode);

    if (this.cache.size > this.capacity) {
      this.removeLRU();
    }
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.hitCount = 0;
    this.missCount = 0;
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): { hits: number; misses: number; hitRate: number; size: number } {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? (this.hitCount / total) * 100 : 0;

    return {
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: Math.round(hitRate * 100) / 100,
      size: this.cache.size
    };
  }

  private moveToFront(node: CacheNode<K, V>): void {
    if (node === this.head) return;

    this.removeNode(node);
    this.addToFront(node);
  }

  private addToFront(node: CacheNode<K, V>): void {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: CacheNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private removeLRU(): void {
    if (!this.tail) return;

    this.cache.delete(this.tail.key);
    this.removeNode(this.tail);
  }
}

/**
 * Specialized Variable Cache
 * Caches Figma Variable objects by ID
 */
export class VariableCache {
  private cache: LRUCache<string, Variable>;

  constructor(capacity: number = 1000) {
    this.cache = new LRUCache(capacity);
  }

  get(id: string): Variable | undefined {
    return this.cache.get(id);
  }

  set(id: string, variable: Variable): void {
    this.cache.set(id, variable);
  }

  has(id: string): boolean {
    return this.cache.has(id);
  }

  bulkSet(variables: Variable[]): void {
    for (const variable of variables) {
      this.cache.set(variable.id, variable);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { hits: number; misses: number; hitRate: number; size: number } {
    return this.cache.getStats();
  }
}

/**
 * Specialized Collection Cache
 * Caches Figma VariableCollection objects by ID
 */
export class CollectionCache {
  private cache: LRUCache<string, VariableCollection>;

  constructor(capacity: number = 100) {
    this.cache = new LRUCache(capacity);
  }

  get(id: string): VariableCollection | undefined {
    return this.cache.get(id);
  }

  set(id: string, collection: VariableCollection): void {
    this.cache.set(id, collection);
  }

  has(id: string): boolean {
    return this.cache.has(id);
  }

  bulkSet(collections: VariableCollection[]): void {
    for (const collection of collections) {
      this.cache.set(collection.id, collection);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { hits: number; misses: number; hitRate: number; size: number } {
    return this.cache.getStats();
  }
}
