import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

const SESSION_COOKIE_PREFIX = "better-auth.session_token";

describe("E2E: POST /v1/auth/change-password", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  function extractSessionCookie(cookies?: string | string[]) {
    const cookieArray = Array.isArray(cookies)
      ? cookies
      : cookies
        ? [cookies]
        : [];
    return cookieArray.find((cookie) => cookie.includes(SESSION_COOKIE_PREFIX));
  }

  it("updates the password, revokes the session, and allows login with the new password", async () => {
    const email = "changepass@example.com";
    const currentPassword = "OriginalPass123!";
    const newPassword = "UpdatedPass456!";

    await request(baseUrl).post("/v1/auth/register").send({
      email,
      password: currentPassword,
      name: "Change Password User",
      birthdate: "1992-05-10",
    });

    const loginResponse = await request(baseUrl).post("/v1/auth/login").send({
      email,
      password: currentPassword,
    });

    expect(loginResponse.status).toBe(200);
    const sessionCookie = extractSessionCookie(
      loginResponse.headers["set-cookie"],
    );
    expect(sessionCookie).toBeDefined();

    const changeResponse = await request(baseUrl)
      .post("/v1/auth/change-password")
      .set("Cookie", sessionCookie ?? "")
      .send({
        currentPassword,
        newPassword,
      });

    expect(changeResponse.status).toBe(204);
    const cookieAfterChange = extractSessionCookie(
      changeResponse.headers["set-cookie"],
    );
    expect(cookieAfterChange).toBeDefined();

    const meResponse = await request(baseUrl)
      .get("/v1/auth/me")
      .set("Cookie", sessionCookie ?? "");
    expect(meResponse.status).toBe(401);

    const oldLogin = await request(baseUrl).post("/v1/auth/login").send({
      email,
      password: currentPassword,
    });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(baseUrl).post("/v1/auth/login").send({
      email,
      password: newPassword,
    });
    expect(newLogin.status).toBe(200);
  });

  it("rejects invalid current passwords and leaves credentials unchanged", async () => {
    const email = "changepass-invalid@example.com";
    const currentPassword = "OriginalPass123!";
    const attemptedPassword = "WrongCurrent999!";
    const newPassword = "UpdatedPass456!";

    await request(baseUrl).post("/v1/auth/register").send({
      email,
      password: currentPassword,
      name: "Change Password User",
      birthdate: "1992-05-10",
    });

    const loginResponse = await request(baseUrl).post("/v1/auth/login").send({
      email,
      password: currentPassword,
    });

    const sessionCookie = extractSessionCookie(
      loginResponse.headers["set-cookie"],
    );
    expect(sessionCookie).toBeDefined();

    const changeResponse = await request(baseUrl)
      .post("/v1/auth/change-password")
      .set("Cookie", sessionCookie ?? "")
      .send({
        currentPassword: attemptedPassword,
        newPassword,
      });

    expect(changeResponse.status).toBe(401);
    expect(changeResponse.body.error).toBeDefined();

    const loginStillWorks = await request(baseUrl).post("/v1/auth/login").send({
      email,
      password: currentPassword,
    });
    expect(loginStillWorks.status).toBe(200);
  });
});
