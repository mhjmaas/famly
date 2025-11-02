import request from "supertest";

/**
 * Constants for test user creation and authentication
 */
export const AUTH_CONSTANTS = {
  SESSION_COOKIE_PREFIX: "better-auth.session_token",
  DEFAULT_PASSWORD: "SecurePassword123!",
  DEFAULT_BIRTHDATE: "1990-01-15",
  CHILD_BIRTHDATE: "2010-01-15",
  CHILD_PASSWORD: "ChildPassword123!",
};

/**
 * Extracts the session cookie from response headers
 */
export function extractSessionCookie(headers: any): string | undefined {
  const cookies = headers["set-cookie"];
  const cookieArray = Array.isArray(cookies)
    ? cookies
    : cookies
      ? [cookies]
      : [];
  const sessionCookie = cookieArray.find((c: string) =>
    c.includes(AUTH_CONSTANTS.SESSION_COOKIE_PREFIX),
  );
  return sessionCookie;
}

/**
 * Extracts auth token from response body
 * Tries accessToken first, falls back to sessionToken
 */
export function extractAuthToken(body: any): string {
  const token = body.accessToken || body.sessionToken;
  if (!token) {
    throw new Error("No auth token found in response body");
  }
  return token;
}

/**
 * Generates a unique email address for test users
 */
export function generateUniqueEmail(prefix: string, id: number): string {
  return `${prefix}${id}@example.com`;
}

/**
 * Registers a new test user
 *
 * @param baseUrl - The test server base URL
 * @param uniqueId - A unique identifier (usually a counter) for generating email
 * @param prefix - Email prefix (default: "testuser")
 * @param options - Optional overrides for user data
 * @returns Object containing token, userId, email, and password
 */
export async function registerTestUser(
  baseUrl: string,
  uniqueId: number,
  prefix: string = "testuser",
  options?: {
    name?: string;
    birthdate?: string;
    password?: string;
  },
) {
  const email = generateUniqueEmail(prefix, uniqueId);
  const password = options?.password || AUTH_CONSTANTS.DEFAULT_PASSWORD;
  const name = options?.name || "Test User";
  const birthdate = options?.birthdate || AUTH_CONSTANTS.DEFAULT_BIRTHDATE;

  const response = await request(baseUrl).post("/v1/auth/register").send({
    email,
    password,
    name,
    birthdate,
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
    password,
    user: response.body.user,
  };
}

/**
 * Logs in an existing test user
 *
 * @param baseUrl - The test server base URL
 * @param email - User email
 * @param password - User password
 * @returns Object containing token and user data
 */
export async function loginTestUser(
  baseUrl: string,
  email: string,
  password: string,
) {
  const response = await request(baseUrl).post("/v1/auth/login").send({
    email,
    password,
  });

  if (response.status !== 200) {
    throw new Error(
      `Failed to login user: ${response.status} ${response.body.error}`,
    );
  }

  const token = extractAuthToken(response.body);

  return {
    token,
    user: response.body.user,
  };
}

/**
 * Sets up a test user and creates a family
 *
 * @param baseUrl - The test server base URL
 * @param uniqueId - A unique identifier for generating email
 * @param options - Optional configuration
 * @returns Object containing token, userId, familyId, and family data
 */
export async function setupTestFamily(
  baseUrl: string,
  uniqueId: number,
  options?: {
    userName?: string;
    familyName?: string;
    prefix?: string;
    userBirthdate?: string;
  },
) {
  // Register user
  const user = await registerTestUser(
    baseUrl,
    uniqueId,
    options?.prefix || "familyuser",
    {
      name: options?.userName || "Family User",
      birthdate: options?.userBirthdate,
    },
  );

  // Create family
  const familyResponse = await request(baseUrl)
    .post("/v1/families")
    .set("Authorization", `Bearer ${user.token}`)
    .send({
      name: options?.familyName || "Test Family",
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

  return {
    token: user.token,
    parentToken: user.token, // Alias for clarity in family context
    userId: user.userId, // From registerTestUser (better-auth user.id, already ObjectId format)
    email: user.email,
    familyId,
    family: familyResponse.body,
  };
}

/**
 * Adds a child member to a family
 *
 * @param baseUrl - The test server base URL
 * @param familyId - The family ID
 * @param parentToken - The parent's auth token
 * @param uniqueId - A unique identifier for generating email
 * @param options - Optional configuration
 * @returns Object containing childToken, childEmail, childUserId
 */
export async function addChildMember(
  baseUrl: string,
  familyId: string,
  parentToken: string,
  uniqueId: number,
  options?: {
    name?: string;
    password?: string;
    prefix?: string;
  },
) {
  const childEmail = generateUniqueEmail(options?.prefix || "child", uniqueId);
  const childPassword = options?.password || AUTH_CONSTANTS.CHILD_PASSWORD;
  const childName = options?.name || "Child User";

  // Add child to family
  const addMemberResponse = await request(baseUrl)
    .post(`/v1/families/${familyId}/members`)
    .set("Authorization", `Bearer ${parentToken}`)
    .send({
      email: childEmail,
      password: childPassword,
      name: childName,
      birthdate: AUTH_CONSTANTS.CHILD_BIRTHDATE,
      role: "Child",
    });

  if (addMemberResponse.status !== 201) {
    throw new Error(
      `Failed to add child member: ${addMemberResponse.status} ${addMemberResponse.body.error}`,
    );
  }

  // Login as child to get token
  const childLoginResponse = await loginTestUser(
    baseUrl,
    childEmail,
    childPassword,
  );

  return {
    childToken: childLoginResponse.token,
    childEmail,
    childUserId: addMemberResponse.body.memberId, // Use memberId from add-member response (ObjectId)
    child: childLoginResponse.user,
  };
}

/**
 * Sets up a family with a parent and child member
 *
 * @param baseUrl - The test server base URL
 * @param uniqueId - A unique identifier for generating emails
 * @param options - Optional configuration
 * @returns Object with parent and child data, familyId
 */
export async function setupFamilyWithMembers(
  baseUrl: string,
  uniqueId: number,
  options?: {
    parentName?: string;
    childName?: string;
    familyName?: string;
  },
) {
  // Create family with parent
  const family = await setupTestFamily(baseUrl, uniqueId, {
    userName: options?.parentName || "Parent User",
    familyName: options?.familyName || "Test Family",
  });

  // Add child member
  const child = await addChildMember(
    baseUrl,
    family.familyId,
    family.token,
    uniqueId,
    {
      name: options?.childName || "Child User",
    },
  );

  return {
    parentToken: family.token,
    parentUserId: family.userId,
    parentEmail: family.email,
    childToken: child.childToken,
    childUserId: child.childUserId,
    childEmail: child.childEmail,
    familyId: family.familyId,
  };
}

/**
 * Sets up multiple test users
 *
 * @param baseUrl - The test server base URL
 * @param count - Number of users to create
 * @param prefix - Email prefix
 * @returns Array of user objects with token, userId, email
 */
export async function setupTestUsers(
  baseUrl: string,
  count: number,
  prefix: string = "user",
) {
  const users = [];

  for (let i = 1; i <= count; i++) {
    const user = await registerTestUser(baseUrl, i, `${prefix}${i}`);
    users.push(user);
  }

  return users;
}
