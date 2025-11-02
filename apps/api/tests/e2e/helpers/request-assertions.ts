/**
 * Request Assertion Patterns
 * Common assertions for API requests to reduce duplication
 */

import type { Response } from "supertest";

/**
 * Asserts a successful response (2xx status)
 */
export function expectSuccess(
  response: Response,
  expectedStatus: number = 200,
): void {
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus} but got ${response.status}. Body: ${JSON.stringify(response.body)}`,
    );
  }
}

/**
 * Asserts an unauthorized response (401)
 */
export function expectUnauthorized(response: Response): void {
  if (response.status !== 401) {
    throw new Error(`Expected 401 Unauthorized but got ${response.status}`);
  }
  if (!response.body.error) {
    throw new Error("Expected error message in 401 response");
  }
}

/**
 * Asserts a forbidden response (403)
 */
export function expectForbidden(response: Response): void {
  if (response.status !== 403) {
    throw new Error(`Expected 403 Forbidden but got ${response.status}`);
  }
  if (!response.body.error) {
    throw new Error("Expected error message in 403 response");
  }
}

/**
 * Asserts a not found response (404)
 */
export function expectNotFound(response: Response): void {
  if (response.status !== 404) {
    throw new Error(`Expected 404 Not Found but got ${response.status}`);
  }
}

/**
 * Asserts a bad request response (400)
 */
export function expectBadRequest(response: Response): void {
  if (response.status !== 400) {
    throw new Error(`Expected 400 Bad Request but got ${response.status}`);
  }
  if (!response.body.error) {
    throw new Error("Expected error message in 400 response");
  }
}

/**
 * Asserts that response has required fields
 */
export function expectHasFields(obj: any, fields: string[]): void {
  for (const field of fields) {
    if (!(field in obj)) {
      throw new Error(
        `Expected field "${field}" in object: ${JSON.stringify(obj)}`,
      );
    }
  }
}

/**
 * Asserts that response status is one of the given statuses
 */
export function expectStatusIn(response: Response, statuses: number[]): void {
  if (!statuses.includes(response.status)) {
    throw new Error(
      `Expected status to be one of ${statuses.join(", ")} but got ${response.status}`,
    );
  }
}

/**
 * Asserts array response properties
 */
export function expectArray(response: Response, length?: number): void {
  if (!Array.isArray(response.body)) {
    throw new Error(`Expected array response but got ${typeof response.body}`);
  }
  if (length !== undefined && response.body.length !== length) {
    throw new Error(
      `Expected array of length ${length} but got ${response.body.length}`,
    );
  }
}

/**
 * Asserts that an object has a property with a specific value
 */
export function expectProperty(obj: any, property: string, value: any): void {
  if (obj[property] !== value) {
    throw new Error(
      `Expected ${property} to be ${value} but got ${obj[property]}`,
    );
  }
}

/**
 * Asserts ISO date format
 */
export function expectISODate(value: string): void {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.toISOString() !== value) {
    throw new Error(`Expected ISO date format but got "${value}"`);
  }
}

/**
 * Assertion builder for fluent API
 */
export class ResponseAssertions {
  constructor(private response: Response) {}

  isSuccess(expectedStatus: number = 200): this {
    expectSuccess(this.response, expectedStatus);
    return this;
  }

  isCreated(): this {
    expectSuccess(this.response, 201);
    return this;
  }

  isNoContent(): this {
    expectSuccess(this.response, 204);
    return this;
  }

  isUnauthorized(): this {
    expectUnauthorized(this.response);
    return this;
  }

  isForbidden(): this {
    expectForbidden(this.response);
    return this;
  }

  isNotFound(): this {
    expectNotFound(this.response);
    return this;
  }

  isBadRequest(): this {
    expectBadRequest(this.response);
    return this;
  }

  hasFields(fields: string[]): this {
    expectHasFields(this.response.body, fields);
    return this;
  }

  isArray(length?: number): this {
    expectArray(this.response, length);
    return this;
  }

  hasProperty(property: string, value: any): this {
    expectProperty(this.response.body, property, value);
    return this;
  }

  isEmpty(): this {
    if (this.response.status !== 204) {
      throw new Error("Expected 204 No Content");
    }
    if (Object.keys(this.response.body).length > 0) {
      throw new Error(
        `Expected empty body but got: ${JSON.stringify(this.response.body)}`,
      );
    }
    return this;
  }

  get body(): any {
    return this.response.body;
  }
}

/**
 * Helper to create assertion builder
 */
export function assertResponse(response: Response): ResponseAssertions {
  return new ResponseAssertions(response);
}
