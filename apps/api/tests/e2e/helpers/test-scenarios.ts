/**
 * Common Test Scenarios
 * Composable steps for typical test workflows
 */

import request from "supertest";
import { TestUserBuilder, TestFamilyBuilder, TestDataFactory } from "./test-data-factory";
import { ResponseAssertions, assertResponse } from "./request-assertions";

/**
 * Scenario: Create diary entry
 * Composable step for creating a diary entry
 */
export async function scenarioCreateDiaryEntry(
  baseUrl: string,
  token: string,
  data: { date: string; entry: string },
) {
  const response = await request(baseUrl)
    .post("/v1/diary")
    .set("Authorization", `Bearer ${token}`)
    .send(data);

  return {
    response: assertResponse(response),
    entryId: response.body._id,
  };
}

/**
 * Scenario: Create and verify diary entry
 * Creates entry and returns entry ID with assertions
 */
export async function scenarioCreateDiaryEntryVerified(
  baseUrl: string,
  token: string,
  data: { date: string; entry: string },
) {
  const { response, entryId } = await scenarioCreateDiaryEntry(baseUrl, token, data);
  response.isCreated();
  return { entryId, response };
}

/**
 * Scenario: Get diary entry
 */
export async function scenarioGetDiaryEntry(
  baseUrl: string,
  token: string,
  entryId: string,
) {
  const response = await request(baseUrl)
    .get(`/v1/diary/${entryId}`)
    .set("Authorization", `Bearer ${token}`);

  return {
    response: assertResponse(response),
    entry: response.body,
  };
}

/**
 * Scenario: List diary entries
 */
export async function scenarioListDiaryEntries(
  baseUrl: string,
  token: string,
  query?: { startDate?: string; endDate?: string },
) {
  const req = request(baseUrl).get("/v1/diary").set("Authorization", `Bearer ${token}`);

  if (query) {
    if (query.startDate) req.query({ startDate: query.startDate });
    if (query.endDate) req.query({ endDate: query.endDate });
  }

  const response = await req;

  return {
    response: assertResponse(response),
    entries: response.body,
  };
}

/**
 * Scenario: Delete diary entry
 */
export async function scenarioDeleteDiaryEntry(
  baseUrl: string,
  token: string,
  entryId: string,
) {
  const response = await request(baseUrl)
    .delete(`/v1/diary/${entryId}`)
    .set("Authorization", `Bearer ${token}`);

  return {
    response: assertResponse(response),
  };
}

/**
 * Scenario: Update diary entry
 */
export async function scenarioUpdateDiaryEntry(
  baseUrl: string,
  token: string,
  entryId: string,
  data: { date?: string; entry?: string },
) {
  const response = await request(baseUrl)
    .patch(`/v1/diary/${entryId}`)
    .set("Authorization", `Bearer ${token}`)
    .send(data);

  return {
    response: assertResponse(response),
    entry: response.body,
  };
}

/**
 * Scenario: Create family
 */
export async function scenarioCreateFamily(
  baseUrl: string,
  token: string,
  familyName: string,
) {
  const response = await request(baseUrl)
    .post("/v1/families")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: familyName });

  return {
    response: assertResponse(response),
    familyId: response.body.familyId || response.body._id,
  };
}

/**
 * Scenario: List families
 */
export async function scenarioListFamilies(baseUrl: string, token: string) {
  const response = await request(baseUrl)
    .get("/v1/families")
    .set("Authorization", `Bearer ${token}`);

  return {
    response: assertResponse(response),
    families: response.body,
  };
}

/**
 * Scenario: Add family member
 */
export async function scenarioAddFamilyMember(
  baseUrl: string,
  token: string,
  familyId: string,
  data: {
    email: string;
    password: string;
    name: string;
    birthdate: string;
    role: "Parent" | "Child";
  },
) {
  const response = await request(baseUrl)
    .post(`/v1/families/${familyId}/members`)
    .set("Authorization", `Bearer ${token}`)
    .send(data);

  return {
    response: assertResponse(response),
    memberId: response.body.memberId,
  };
}

/**
 * Scenario: Remove family member
 */
export async function scenarioRemoveFamilyMember(
  baseUrl: string,
  token: string,
  familyId: string,
  memberId: string,
) {
  const response = await request(baseUrl)
    .delete(`/v1/families/${familyId}/members/${memberId}`)
    .set("Authorization", `Bearer ${token}`);

  return {
    response: assertResponse(response),
  };
}

/**
 * Scenario: Create shopping list
 */
export async function scenarioCreateShoppingList(
  baseUrl: string,
  token: string,
  familyId: string,
  name: string,
) {
  const response = await request(baseUrl)
    .post("/v1/shopping-lists")
    .set("Authorization", `Bearer ${token}`)
    .send({ familyId, name });

  return {
    response: assertResponse(response),
    listId: response.body._id || response.body.id,
  };
}

/**
 * Scenario: Add item to shopping list
 */
export async function scenarioAddShoppingListItem(
  baseUrl: string,
  token: string,
  listId: string,
  item: { name: string; quantity?: number; unit?: string },
) {
  const response = await request(baseUrl)
    .post(`/v1/shopping-lists/${listId}/items`)
    .set("Authorization", `Bearer ${token}`)
    .send(item);

  return {
    response: assertResponse(response),
    itemId: response.body._id || response.body.id,
  };
}

/**
 * Scenario: Test unauthorized access (common pattern)
 */
export async function scenarioTestUnauthorizedAccess(
  baseUrl: string,
  method: "get" | "post" | "patch" | "delete",
  endpoint: string,
  data?: any,
) {
  let req = request(baseUrl)[method](endpoint);

  if (data) {
    req = req.send(data);
  }

  const response = await req;

  return {
    response: assertResponse(response),
  };
}

/**
 * Scenario: Test forbidden access (common pattern)
 */
export async function scenarioTestForbiddenAccess(
  baseUrl: string,
  method: "get" | "post" | "patch" | "delete",
  endpoint: string,
  unauthorizedToken: string,
  data?: any,
) {
  let req = request(baseUrl)[method](endpoint).set("Authorization", `Bearer ${unauthorizedToken}`);

  if (data) {
    req = req.send(data);
  }

  const response = await req;

  return {
    response: assertResponse(response),
  };
}

/**
 * Scenario builder for complex multi-step scenarios
 */
export class ScenarioBuilder {
  private steps: Array<() => Promise<any>> = [];

  add(step: () => Promise<any>): this {
    this.steps.push(step);
    return this;
  }

  async execute(): Promise<any[]> {
    const results = [];
    for (const step of this.steps) {
      results.push(await step());
    }
    return results;
  }
}

/**
 * Helper to create scenario builder
 */
export function buildScenario(): ScenarioBuilder {
  return new ScenarioBuilder();
}
