/**
 * Unified Token Management
 * Centralized token handling for test users with caching and renewal
 */

import request from "supertest";
import {
  AUTH_CONSTANTS,
  extractAuthToken,
  generateUniqueEmail,
} from "./auth-setup";

/**
 * Represents a test user with cached token
 */
export interface TestUserToken {
  userId: string;
  email: string;
  token: string;
  expiresAt?: number;
  name?: string;
  birthdate?: string;
}

/**
 * Token cache for test users
 * Prevents re-registering the same test user multiple times
 */
export class TokenManager {
  private baseUrl: string;
  private tokenCache: Map<string, TestUserToken> = new Map();
  private uniqueIdCounter: number;

  constructor(baseUrl: string, uniqueIdStart: number = 1) {
    this.baseUrl = baseUrl;
    this.uniqueIdCounter = uniqueIdStart;
  }

  /**
   * Create and cache a new user token
   */
  async createUser(
    prefix: string = "testuser",
    options?: {
      name?: string;
      birthdate?: string;
      password?: string;
      email?: string;
    },
  ): Promise<TestUserToken> {
    const uniqueId = this.uniqueIdCounter++;
    const email = options?.email || generateUniqueEmail(prefix, uniqueId);
    const cacheKey = `${prefix}-${uniqueId}`;

    // Return cached token if exists
    if (this.tokenCache.has(cacheKey)) {
      return this.tokenCache.get(cacheKey)!;
    }

    const password = options?.password || AUTH_CONSTANTS.DEFAULT_PASSWORD;
    const name = options?.name || "Test User";
    const birthdate = options?.birthdate || AUTH_CONSTANTS.DEFAULT_BIRTHDATE;

    const response = await request(this.baseUrl)
      .post("/v1/auth/register")
      .send({
        email,
        password,
        name,
        birthdate,
      });

    if (response.status !== 201) {
      throw new Error(
        `Failed to create user: ${response.status} ${response.body.error}`,
      );
    }

    const token = extractAuthToken(response.body);
    const userId = response.body.user?.id;

    if (!userId) {
      throw new Error("No user ID returned from registration");
    }

    const userToken: TestUserToken = {
      userId,
      email,
      token,
      name,
      birthdate,
    };

    this.tokenCache.set(cacheKey, userToken);
    return userToken;
  }

  /**
   * Get a cached user token
   */
  getUser(prefix: string, uniqueId: number): TestUserToken | undefined {
    const cacheKey = `${prefix}-${uniqueId}`;
    return this.tokenCache.get(cacheKey);
  }

  /**
   * Create multiple users at once
   */
  async createUsers(
    count: number,
    prefix: string = "user",
    options?: {
      nameTemplate?: (index: number) => string;
      passwordTemplate?: (index: number) => string;
    },
  ): Promise<TestUserToken[]> {
    const users: TestUserToken[] = [];

    for (let i = 1; i <= count; i++) {
      const name = options?.nameTemplate
        ? options.nameTemplate(i)
        : `User ${i}`;
      const password = options?.passwordTemplate
        ? options.passwordTemplate(i)
        : undefined;

      const user = await this.createUser(`${prefix}${i}`, { name, password });
      users.push(user);
    }

    return users;
  }

  /**
   * Get token for a user (create if doesn't exist)
   */
  async getOrCreateUser(
    prefix: string = "testuser",
    options?: any,
  ): Promise<TestUserToken> {
    // Try to get from cache first
    const cached = Array.from(this.tokenCache.values()).find(
      (u) => u.email && u.email.startsWith(prefix),
    );

    if (cached) {
      return cached;
    }

    return this.createUser(prefix, options);
  }

  /**
   * Clear token cache
   */
  clear(): void {
    this.tokenCache.clear();
  }

  /**
   * Get all cached tokens
   */
  getAllTokens(): TestUserToken[] {
    return Array.from(this.tokenCache.values());
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.tokenCache.size;
  }

  /**
   * Check if token is valid (simple check)
   */
  isTokenValid(token: TestUserToken): boolean {
    if (!token.token) {
      return false;
    }

    // Check expiration if present
    if (token.expiresAt && token.expiresAt < Date.now()) {
      return false;
    }

    return true;
  }
}

/**
 * Global token manager instance
 */
let globalTokenManager: TokenManager | null = null;

/**
 * Initialize global token manager
 */
export function initializeTokenManager(
  baseUrl: string,
  uniqueIdStart?: number,
): TokenManager {
  globalTokenManager = new TokenManager(baseUrl, uniqueIdStart);
  return globalTokenManager;
}

/**
 * Get global token manager
 */
export function getTokenManager(): TokenManager {
  if (!globalTokenManager) {
    throw new Error(
      "TokenManager not initialized. Call initializeTokenManager() first.",
    );
  }
  return globalTokenManager;
}

/**
 * Reset global token manager
 */
export function resetTokenManager(): void {
  if (globalTokenManager) {
    globalTokenManager.clear();
  }
  globalTokenManager = null;
}

/**
 * Quick helper to create a user with token manager
 */
export async function createTestUserWithTokenManager(
  baseUrl: string,
  prefix: string = "testuser",
  options?: any,
): Promise<TestUserToken> {
  const manager = globalTokenManager || initializeTokenManager(baseUrl);
  return manager.createUser(prefix, options);
}

/**
 * Token pool for managing multiple tokens in a test
 */
export class TokenPool {
  private manager: TokenManager;
  private tokens: Map<string, TestUserToken> = new Map();

  constructor(baseUrl: string, initialUniqueId?: number) {
    this.manager = new TokenManager(baseUrl, initialUniqueId);
  }

  /**
   * Add a named token to the pool
   */
  async add(
    name: string,
    prefix: string = "testuser",
    options?: any,
  ): Promise<TestUserToken> {
    const token = await this.manager.createUser(prefix, options);
    this.tokens.set(name, token);
    return token;
  }

  /**
   * Get a token from the pool
   */
  get(name: string): TestUserToken | undefined {
    return this.tokens.get(name);
  }

  /**
   * Get token string from the pool
   */
  getTokenString(name: string): string | undefined {
    return this.tokens.get(name)?.token;
  }

  /**
   * Get all tokens in the pool
   */
  getAll(): Map<string, TestUserToken> {
    return this.tokens;
  }

  /**
   * Create multiple named tokens at once
   */
  async addMultiple(
    names: string[],
    prefixTemplate?: (index: number, name: string) => string,
  ): Promise<Map<string, TestUserToken>> {
    for (let i = 0; i < names.length; i++) {
      const prefix = prefixTemplate
        ? prefixTemplate(i, names[i])
        : `${names[i]}`;
      await this.add(names[i], prefix);
    }
    return this.tokens;
  }

  /**
   * Clear all tokens from pool
   */
  clear(): void {
    this.tokens.clear();
    this.manager.clear();
  }

  /**
   * Get pool size
   */
  size(): number {
    return this.tokens.size;
  }
}
