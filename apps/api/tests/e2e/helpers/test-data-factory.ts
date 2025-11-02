/**
 * Test Data Factories & Builders
 * Provides fluent, composable factories for creating test data
 */

import request from "supertest";
import {
  AUTH_CONSTANTS,
  extractAuthToken,
  generateUniqueEmail,
  loginTestUser,
} from "./auth-setup";

/**
 * Fluent builder for creating test users with sensible defaults
 */
export class TestUserBuilder {
  private baseUrl: string;
  private uniqueId: number;
  private data: {
    email?: string;
    name: string;
    birthdate: string;
    password: string;
    prefix: string;
  };

  constructor(baseUrl: string, uniqueId: number) {
    this.baseUrl = baseUrl;
    this.uniqueId = uniqueId;
    this.data = {
      name: "Test User",
      birthdate: AUTH_CONSTANTS.DEFAULT_BIRTHDATE,
      password: AUTH_CONSTANTS.DEFAULT_PASSWORD,
      prefix: "testuser",
    };
  }

  withName(name: string): this {
    this.data.name = name;
    return this;
  }

  withBirthdate(birthdate: string): this {
    this.data.birthdate = birthdate;
    return this;
  }

  withPassword(password: string): this {
    this.data.password = password;
    return this;
  }

  withEmailPrefix(prefix: string): this {
    this.data.prefix = prefix;
    return this;
  }

  async build() {
    const email = generateUniqueEmail(this.data.prefix, this.uniqueId);

    const response = await request(this.baseUrl)
      .post("/v1/auth/register")
      .send({
        email,
        password: this.data.password,
        name: this.data.name,
        birthdate: this.data.birthdate,
      });

    if (response.status !== 201) {
      throw new Error(
        `Failed to register user: ${response.status} ${response.body.error}`,
      );
    }

    const token = extractAuthToken(response.body);
    const userId = response.body.user?.id;

    if (!userId) {
      throw new Error("No user ID returned from registration");
    }

    return {
      token,
      userId,
      email,
      password: this.data.password,
      name: this.data.name,
      birthdate: this.data.birthdate,
      user: response.body.user,
    };
  }
}

/**
 * Fluent builder for creating test families
 */
export class TestFamilyBuilder {
  private baseUrl: string;
  private uniqueId: number;
  private parentBuilder: TestUserBuilder;
  private data: {
    familyName: string;
    parentName: string;
    parentBirthdate?: string;
    members: Array<{
      name: string;
      birthdate: string;
      role: "Parent" | "Child";
    }>;
  };

  constructor(baseUrl: string, uniqueId: number) {
    this.baseUrl = baseUrl;
    this.uniqueId = uniqueId;
    this.parentBuilder = new TestUserBuilder(baseUrl, uniqueId).withEmailPrefix(
      "family",
    );
    this.data = {
      familyName: "Test Family",
      parentName: "Parent User",
      members: [],
    };
  }

  withName(familyName: string): this {
    this.data.familyName = familyName;
    return this;
  }

  withParentName(parentName: string): this {
    this.data.parentName = parentName;
    this.parentBuilder.withName(parentName);
    return this;
  }

  withParentBirthdate(birthdate: string): this {
    this.data.parentBirthdate = birthdate;
    this.parentBuilder.withBirthdate(birthdate);
    return this;
  }

  addChild(
    name: string,
    birthdate: string = AUTH_CONSTANTS.CHILD_BIRTHDATE,
  ): this {
    this.data.members.push({ name, birthdate, role: "Child" });
    return this;
  }

  addParent(
    name: string,
    birthdate: string = AUTH_CONSTANTS.DEFAULT_BIRTHDATE,
  ): this {
    this.data.members.push({ name, birthdate, role: "Parent" });
    return this;
  }

  async build() {
    // Create parent user
    const parent = await this.parentBuilder.build();

    // Create family
    const familyResponse = await request(this.baseUrl)
      .post("/v1/families")
      .set("Authorization", `Bearer ${parent.token}`)
      .send({
        name: this.data.familyName,
      });

    if (familyResponse.status !== 201) {
      throw new Error(
        `Failed to create family: ${familyResponse.status} ${familyResponse.body.error}`,
      );
    }

    const familyId = familyResponse.body.familyId || familyResponse.body._id;

    if (!familyId) {
      throw new Error("No family ID returned from creation");
    }

    // Add additional members
    const addedMembers = [];
    for (const member of this.data.members) {
      const memberEmail = generateUniqueEmail(
        `${member.role.toLowerCase()}`,
        this.uniqueId + addedMembers.length,
      );
      const memberPassword =
        member.role === "Child"
          ? AUTH_CONSTANTS.CHILD_PASSWORD
          : AUTH_CONSTANTS.DEFAULT_PASSWORD;

      const memberResponse = await request(this.baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          email: memberEmail,
          password: memberPassword,
          name: member.name,
          birthdate: member.birthdate,
          role: member.role,
        });

      if (memberResponse.status !== 201) {
        throw new Error(
          `Failed to add family member: ${memberResponse.status} ${memberResponse.body.error}`,
        );
      }

      // Login the member to get their token
      const loginResponse = await loginTestUser(
        this.baseUrl,
        memberEmail,
        memberPassword,
      );

      addedMembers.push({
        ...memberResponse.body,
        token: loginResponse.token,
        email: memberEmail,
      });
    }

    return {
      token: parent.token,
      parentToken: parent.token,
      userId: parent.userId,
      email: parent.email,
      familyId,
      family: familyResponse.body,
      members: addedMembers,
    };
  }
}

/**
 * Factory helper to create builders with less boilerplate
 */
export const TestDataFactory = {
  user: (baseUrl: string, uniqueId: number) =>
    new TestUserBuilder(baseUrl, uniqueId),
  family: (baseUrl: string, uniqueId: number) =>
    new TestFamilyBuilder(baseUrl, uniqueId),
};
