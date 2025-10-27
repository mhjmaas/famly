/**
 * Authorization Test Matrix Generator
 * Generates comprehensive authorization tests for endpoints
 */

import request from "supertest";
import { TestDataFactory } from "./test-data-factory";

export interface AuthorizationScenario {
  name: string;
  actor: "owner" | "family-member" | "other-user" | "guest";
  expectedStatus: number;
  description?: string;
}

export interface EndpointAuthTestConfig {
  baseUrl: string;
  endpoint: string;
  method: "get" | "post" | "patch" | "delete";
  data?: any;
  scenarios: AuthorizationScenario[];
  uniqueId: number;
}

/**
 * Token manager for authorization tests
 */
export interface AuthorizationTestTokens {
  ownerToken?: string;
  memberToken?: string;
  otherUserToken?: string;
  familyId?: string;
  entityId?: string;
}

/**
 * Create test users for authorization matrix
 */
export async function createAuthorizationTestUsers(
  baseUrl: string,
  uniqueId: number,
): Promise<AuthorizationTestTokens> {
  // Owner: creates resource
  const owner = await TestDataFactory.user(baseUrl, uniqueId)
    .withName("Owner User")
    .withEmailPrefix("owner")
    .build();

  // Other user: has no access
  const otherUser = await TestDataFactory.user(baseUrl, uniqueId + 1)
    .withName("Other User")
    .withEmailPrefix("other")
    .build();

  return {
    ownerToken: owner.token,
    otherUserToken: otherUser.token,
  };
}

/**
 * Create test users with family for authorization matrix
 */
export async function createAuthorizationFamilyTestUsers(
  baseUrl: string,
  uniqueId: number,
): Promise<AuthorizationTestTokens> {
  // Owner/Parent: creates family
  const owner = await TestDataFactory.family(baseUrl, uniqueId)
    .withParentName("Parent User")
    .addChild("Child Member")
    .build();

  // Login as child member to get their token
  const childEmail = `child${uniqueId}@example.com`;
  const childLoginResponse = await request(baseUrl)
    .post("/v1/auth/login")
    .send({
      email: childEmail,
      password: "ChildPassword123!",
    });

  const memberToken =
    childLoginResponse.body.accessToken || childLoginResponse.body.sessionToken;

  // Other user: not in family
  const otherUser = await TestDataFactory.user(baseUrl, uniqueId + 10)
    .withName("Outside User")
    .withEmailPrefix("outside")
    .build();

  return {
    ownerToken: owner.parentToken,
    memberToken,
    otherUserToken: otherUser.token,
    familyId: owner.familyId,
  };
}

/**
 * Generate standard authorization test cases
 */
export function generateStandardAuthorizationScenarios(): AuthorizationScenario[] {
  return [
    {
      name: "Owner can access their own resource",
      actor: "owner",
      expectedStatus: 200,
      description: "Owner should have full access to their own resource",
    },
    {
      name: "Family member cannot access owner-only resource",
      actor: "family-member",
      expectedStatus: 403,
      description: "Non-owner family members should not access owner resources",
    },
    {
      name: "Other user cannot access resource",
      actor: "other-user",
      expectedStatus: 403,
      description: "Unrelated users should not access resource",
    },
    {
      name: "Guest cannot access resource",
      actor: "guest",
      expectedStatus: 401,
      description: "Unauthenticated requests should be rejected",
    },
  ];
}

/**
 * Generate read-only authorization scenarios
 */
export function generateReadOnlyAuthorizationScenarios(): AuthorizationScenario[] {
  return [
    {
      name: "Owner can read resource",
      actor: "owner",
      expectedStatus: 200,
    },
    {
      name: "Other user cannot read resource",
      actor: "other-user",
      expectedStatus: 403,
    },
    {
      name: "Guest cannot read resource",
      actor: "guest",
      expectedStatus: 401,
    },
  ];
}

/**
 * Generate family resource authorization scenarios
 */
export function generateFamilyAuthorizationScenarios(): AuthorizationScenario[] {
  return [
    {
      name: "Parent can manage family resource",
      actor: "owner",
      expectedStatus: 200,
    },
    {
      name: "Child cannot modify family resource",
      actor: "family-member",
      expectedStatus: 403,
    },
    {
      name: "Outside user cannot access family resource",
      actor: "other-user",
      expectedStatus: 403,
    },
    {
      name: "Unauthenticated user cannot access family resource",
      actor: "guest",
      expectedStatus: 401,
    },
  ];
}

/**
 * Execute authorization matrix test
 */
export async function executeAuthorizationTest(
  config: EndpointAuthTestConfig,
  tokens: AuthorizationTestTokens,
  scenario: AuthorizationScenario,
): Promise<void> {
  let req: any;

  // Build request based on method
  switch (config.method) {
    case "get":
      req = request(config.baseUrl).get(config.endpoint);
      break;
    case "post":
      req = request(config.baseUrl)
        .post(config.endpoint)
        .send(config.data || {});
      break;
    case "patch":
      req = request(config.baseUrl)
        .patch(config.endpoint)
        .send(config.data || {});
      break;
    case "delete":
      req = request(config.baseUrl).delete(config.endpoint);
      break;
  }

  // Add authorization header based on actor
  switch (scenario.actor) {
    case "owner":
      req = req.set("Authorization", `Bearer ${tokens.ownerToken}`);
      break;
    case "family-member":
      req = req.set("Authorization", `Bearer ${tokens.memberToken}`);
      break;
    case "other-user":
      req = req.set("Authorization", `Bearer ${tokens.otherUserToken}`);
      break;
    case "guest":
      // No token
      break;
  }

  const response = await req;

  if (response.status !== scenario.expectedStatus) {
    throw new Error(
      `${scenario.name}: Expected ${scenario.expectedStatus} but got ${response.status}. ` +
        `${scenario.description || ""} Actor: ${scenario.actor}`,
    );
  }
}

/**
 * Fluent builder for authorization matrix tests
 */
export class AuthorizationMatrixBuilder {
  private baseUrl: string;
  private uniqueId: number;
  private endpoint: string;
  private method: "get" | "post" | "patch" | "delete" = "get";
  private data?: any;
  private scenarios: AuthorizationScenario[] = [];

  constructor(baseUrl: string, uniqueId: number, endpoint: string) {
    this.baseUrl = baseUrl;
    this.uniqueId = uniqueId;
    this.endpoint = endpoint;
  }

  withMethod(method: "get" | "post" | "patch" | "delete"): this {
    this.method = method;
    return this;
  }

  withData(data: any): this {
    this.data = data;
    return this;
  }

  withScenarios(scenarios: AuthorizationScenario[]): this {
    this.scenarios = scenarios;
    return this;
  }

  addScenario(scenario: AuthorizationScenario): this {
    this.scenarios.push(scenario);
    return this;
  }

  async executeWithSimpleUsers(): Promise<void> {
    const tokens = await createAuthorizationTestUsers(
      this.baseUrl,
      this.uniqueId,
    );

    for (const scenario of this.scenarios) {
      const config: EndpointAuthTestConfig = {
        baseUrl: this.baseUrl,
        endpoint: this.endpoint,
        method: this.method,
        data: this.data,
        scenarios: [scenario],
        uniqueId: this.uniqueId,
      };

      await executeAuthorizationTest(config, tokens, scenario);
    }
  }

  async executeWithFamilyUsers(): Promise<void> {
    const tokens = await createAuthorizationFamilyTestUsers(
      this.baseUrl,
      this.uniqueId,
    );

    for (const scenario of this.scenarios) {
      const config: EndpointAuthTestConfig = {
        baseUrl: this.baseUrl,
        endpoint: this.endpoint,
        method: this.method,
        data: this.data,
        scenarios: [scenario],
        uniqueId: this.uniqueId,
      };

      await executeAuthorizationTest(config, tokens, scenario);
    }
  }
}

/**
 * Helper to create authorization matrix builder
 */
export function buildAuthorizationMatrix(
  baseUrl: string,
  uniqueId: number,
  endpoint: string,
): AuthorizationMatrixBuilder {
  return new AuthorizationMatrixBuilder(baseUrl, uniqueId, endpoint);
}
