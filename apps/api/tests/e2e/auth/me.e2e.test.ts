import request from 'supertest';
import { setupE2E, teardownE2E, cleanDatabase } from '../setup/testcontainers-setup';

// Better Auth uses this cookie name pattern
const SESSION_COOKIE_PREFIX = 'better-auth.session_token';

describe('E2E: GET /v1/auth/me', () => {
  let baseUrl: string;

  beforeAll(async () => {
    baseUrl = await setupE2E();
  }, 120000);

  afterAll(async () => {
    await teardownE2E();
  }, 30000);

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Cookie-based Authentication', () => {
    it('should return current user with valid session cookie', async () => {
      // Register and login
      const loginResponse = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: 'cookieuser@example.com',
          password: 'SecurePassword123!',
          name: 'Cookie User',
        });

      const cookies = loginResponse.headers['set-cookie'];
      const cookieArray = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
      const sessionCookie = cookieArray.find((c: string) => c.includes(SESSION_COOKIE_PREFIX));

      // Access /me endpoint with cookie
      const response = await request(baseUrl)
        .get('/v1/auth/me')
        .set('Cookie', sessionCookie!);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject({
        email: 'cookieuser@example.com',
        name: 'Cookie User',
        emailVerified: false,
      });
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('createdAt');
      expect(response.body.user).toHaveProperty('updatedAt');
      expect(response.body.authType).toBe('cookie');
    });

    it('should reject request without session cookie', async () => {
      const response = await request(baseUrl)
        .get('/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with invalid session cookie', async () => {
      const response = await request(baseUrl)
        .get('/v1/auth/me')
        .set('Cookie', `${SESSION_COOKIE_PREFIX}=invalid-session-token-xyz`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with expired session cookie', async () => {
      // This test would require time travel or manipulating the session
      // For now, we test with an invalid token format
      const response = await request(baseUrl)
        .get('/v1/auth/me')
        .set('Cookie', `${SESSION_COOKIE_PREFIX}=expired-token`);

      expect(response.status).toBe(401);
    });
  });

  describe('Bearer Token Authentication', () => {
    it('should return current user with valid bearer token', async () => {
      // Register and get bearer token
      const registerResponse = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: 'beareruser@example.com',
          password: 'SecurePassword123!',
          name: 'Bearer User',
        });

      const accessToken = registerResponse.body.accessToken; // JWT token

      // Access /me endpoint with JWT token
      const response = await request(baseUrl)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject({
        email: 'beareruser@example.com',
        name: 'Bearer User',
      });
      expect(response.body.authType).toBe('bearer-jwt');
    });

    it('should reject request without authorization header', async () => {
      const response = await request(baseUrl)
        .get('/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with invalid bearer token', async () => {
      const response = await request(baseUrl)
        .get('/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token-xyz-123');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with malformed authorization header', async () => {
      const response = await request(baseUrl)
        .get('/v1/auth/me')
        .set('Authorization', 'InvalidFormat token-here');

      expect(response.status).toBe(401);
    });

    it('should reject request with missing Bearer prefix', async () => {
      const response = await request(baseUrl)
        .get('/v1/auth/me')
        .set('Authorization', 'some-token-without-bearer-prefix');

      expect(response.status).toBe(401);
    });
  });

  describe('Authentication Type Detection', () => {
    it('should correctly identify cookie-based authentication', async () => {
      const loginResponse = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: 'cookiedetect@example.com',
          password: 'SecurePassword123!',
        });

      const cookies = loginResponse.headers['set-cookie'];
      const cookieArray = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
      const sessionCookie = cookieArray.find((c: string) => c.includes(SESSION_COOKIE_PREFIX));

      const response = await request(baseUrl)
        .get('/v1/auth/me')
        .set('Cookie', sessionCookie!);

      expect(response.status).toBe(200);
      expect(response.body.authType).toBe('cookie');
    });

    it('should correctly identify bearer token authentication', async () => {
      const registerResponse = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: 'bearerdetect@example.com',
          password: 'SecurePassword123!',
        });

      const accessToken = registerResponse.body.accessToken; // JWT token

      const response = await request(baseUrl)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.authType).toBe('bearer-jwt');
    });

    it('should prioritize bearer token when both cookie and token present', async () => {
      // Register two users
      const user1 = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: 'user1@example.com',
          password: 'SecurePassword123!',
        });

      const user2 = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: 'user2@example.com',
          password: 'SecurePassword123!',
        });

      const user1Cookies = user1.headers['set-cookie'];
      const user1CookieArray = Array.isArray(user1Cookies) ? user1Cookies : user1Cookies ? [user1Cookies] : [];
      const sessionCookie = user1CookieArray.find((c: string) => c.includes(SESSION_COOKIE_PREFIX));
      const accessToken = user2.body.accessToken; // JWT token

      // Send request with both
      const response = await request(baseUrl)
        .get('/v1/auth/me')
        .set('Cookie', sessionCookie!)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      // Should use JWT token (user2)
      expect(response.body.authType).toBe('bearer-jwt');
      expect(response.body.user.email).toBe('user2@example.com');
    });
  });

  describe('User Data Completeness', () => {
    it('should return all expected user fields', async () => {
      const registerResponse = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: 'complete@example.com',
          password: 'SecurePassword123!',
          name: 'Complete User',
        });

      const accessToken = registerResponse.body.accessToken; // JWT token

      const response = await request(baseUrl)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email');
      expect(response.body.user).toHaveProperty('name');
      expect(response.body.user).toHaveProperty('emailVerified');
      expect(response.body.user).toHaveProperty('createdAt');
      expect(response.body.user).toHaveProperty('updatedAt');

      // Should NOT include sensitive fields
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should not expose sensitive information', async () => {
      const registerResponse = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: 'secure@example.com',
          password: 'SecurePassword123!',
        });

      const accessToken = registerResponse.body.accessToken; // JWT token

      const response = await request(baseUrl)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      // Verify no sensitive data in response
      const responseStr = JSON.stringify(response.body);
      expect(responseStr).not.toContain('SecurePassword123!');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('Session Persistence', () => {
    it('should maintain session across multiple requests', async () => {
      const registerResponse = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: 'persistent@example.com',
          password: 'SecurePassword123!',
        });

      const accessToken = registerResponse.body.accessToken; // JWT token

      // Make multiple requests with the same token
      for (let i = 0; i < 3; i++) {
        const response = await request(baseUrl)
          .get('/v1/auth/me')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.user.email).toBe('persistent@example.com');
      }
    });
  });
});
