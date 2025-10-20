import request from 'supertest';
import { cleanDatabase, setupE2E, teardownE2E } from '../setup/testcontainers-setup';

// Better Auth uses this cookie name pattern
const SESSION_COOKIE_PREFIX = 'better-auth.session_token';

describe('E2E: POST /v1/auth/login', () => {
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

  describe('Web Flow (Cookie-based)', () => {
    it('should login with valid credentials and set session cookie', async () => {
      // Register a user first
      await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: 'logintest@example.com',
          password: 'SecurePassword123!',
          name: 'Login Test',
        });

      // Login with the same credentials
      const response = await request(baseUrl)
        .post('/v1/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'SecurePassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('logintest@example.com');
      expect(response.body).toHaveProperty('session');
      expect(response.body.session).toHaveProperty('expiresAt');

      // Verify session cookie was set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies).toEqual(
        expect.arrayContaining([
          expect.stringContaining(SESSION_COOKIE_PREFIX),
        ])
      );
    });

    it('should use session cookie to access protected endpoints', async () => {
      // Register
      await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: 'cookieauth@example.com',
          password: 'SecurePassword123!',
        });

      // Login
      const loginResponse = await request(baseUrl)
        .post('/v1/auth/login')
        .send({
          email: 'cookieauth@example.com',
          password: 'SecurePassword123!',
        });

      // Extract session cookie
      const cookies = loginResponse.headers['set-cookie'];
      const cookieArray = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
      const sessionCookie = cookieArray.find((c: string) => c.includes(SESSION_COOKIE_PREFIX));

      // Use cookie to access protected endpoint
      const meResponse = await request(baseUrl)
        .get('/v1/auth/me')
        .set('Cookie', sessionCookie!);

      expect(meResponse.status).toBe(200);
      expect(meResponse.body.user.email).toBe('cookieauth@example.com');
      expect(meResponse.body.authType).toBe('cookie');
    });

    it('should reject login with invalid password', async () => {
      // Register
      await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: 'wrongpass@example.com',
          password: 'SecurePassword123!',
        });

      // Try to login with wrong password
      const response = await request(baseUrl)
        .post('/v1/auth/login')
        .send({
          email: 'wrongpass@example.com',
          password: 'WrongPassword456!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(baseUrl)
        .post('/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle case-insensitive email login', async () => {
      // Register with lowercase
      await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: 'caselogin@example.com',
          password: 'SecurePassword123!',
        });

      // Login with uppercase
      const response = await request(baseUrl)
        .post('/v1/auth/login')
        .send({
          email: 'CASELOGIN@EXAMPLE.COM',
          password: 'SecurePassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('caselogin@example.com');
    });
  });

  describe('Mobile Flow (Bearer Token)', () => {
    it('should login and return bearer token', async () => {
      // Register
      await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: 'mobilelogin@example.com',
          password: 'SecurePassword123!',
        });

      // Login
      const response = await request(baseUrl)
        .post('/v1/auth/login')
        .send({
          email: 'mobilelogin@example.com',
          password: 'SecurePassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('mobilelogin@example.com');

      // Tokens should be in header and body
      const sessionToken = response.headers['set-auth-token'];
      
      expect(sessionToken).toBeDefined();
      
      // Access token (JWT) - short-lived, stateless, for API requests
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.accessToken).toBeDefined();
      
      // Session token - long-lived, database-backed, for token refresh
      expect(response.body).toHaveProperty('sessionToken');
      expect(response.body.sessionToken).toBe(sessionToken);
    });

    it('should use bearer token to access protected endpoints', async () => {
      // Register
      await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: 'bearerlogin@example.com',
          password: 'SecurePassword123!',
        });

      // Login and get token
      const loginResponse = await request(baseUrl)
        .post('/v1/auth/login')
        .send({
          email: 'bearerlogin@example.com',
          password: 'SecurePassword123!',
        });

      // Use access token (JWT) for API requests
      const accessToken = loginResponse.body.accessToken;
      expect(accessToken).toBeDefined();

      // Access protected endpoint with JWT access token
      const meResponse = await request(baseUrl)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(meResponse.status).toBe(200);
      expect(meResponse.body.user.email).toBe('bearerlogin@example.com');
      expect(meResponse.body.authType).toBe('bearer-jwt');
    });

    it('should allow switching between web and mobile flows', async () => {
      // Register
      await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: 'multiflow@example.com',
          password: 'SecurePassword123!',
        });

      // Login via web (cookie)
      const webLogin = await request(baseUrl)
        .post('/v1/auth/login')
        .send({
          email: 'multiflow@example.com',
          password: 'SecurePassword123!',
        });

      const webCookies = webLogin.headers['set-cookie'];
      const webCookieArray = Array.isArray(webCookies) ? webCookies : webCookies ? [webCookies] : [];
      const sessionCookie = webCookieArray.find((c: string) => c.includes(SESSION_COOKIE_PREFIX));

      // Login via mobile (bearer)
      const mobileLogin = await request(baseUrl)
        .post('/v1/auth/login')
        .send({
          email: 'multiflow@example.com',
          password: 'SecurePassword123!',
        });

      const accessToken = mobileLogin.body.accessToken;
      const sessionToken = mobileLogin.body.sessionToken;

      // All three auth methods should work
      const cookieResponse = await request(baseUrl)
        .get('/v1/auth/me')
        .set('Cookie', sessionCookie!);

      const jwtResponse = await request(baseUrl)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      const sessionResponse = await request(baseUrl)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${sessionToken}`);

      expect(cookieResponse.status).toBe(200);
      expect(jwtResponse.status).toBe(200);
      expect(sessionResponse.status).toBe(200);
      expect(cookieResponse.body.authType).toBe('cookie');
      expect(jwtResponse.body.authType).toBe('bearer-jwt');
      expect(sessionResponse.body.authType).toBe('bearer-session');
    });
  });

  describe('Remember Me Feature', () => {
    it('should extend session when rememberMe is true', async () => {
      // Register
      await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: 'remember@example.com',
          password: 'SecurePassword123!',
        });

      // Login with rememberMe
      const response = await request(baseUrl)
        .post('/v1/auth/login')
        .send({
          email: 'remember@example.com',
          password: 'SecurePassword123!',
          rememberMe: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.session).toHaveProperty('expiresAt');

      // Session expiry should be set (we can't easily test the exact duration without time travel)
      const expiresAt = new Date(response.body.session.expiresAt);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Error Handling', () => {
    it('should return consistent error format for invalid credentials', async () => {
      const response = await request(baseUrl)
        .post('/v1/auth/login')
        .send({
          email: 'notfound@example.com',
          password: 'password',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle malformed request body', async () => {
      const response = await request(baseUrl)
        .post('/v1/auth/login')
        .send({
          // Intentionally malformed - missing required fields
          email: 'test@example.com',
          // password is missing
        });

      // Better Auth returns 401 for missing credentials
      expect([400, 401]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });
  });
});
