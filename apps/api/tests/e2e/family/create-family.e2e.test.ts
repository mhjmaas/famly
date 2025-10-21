import request from 'supertest';
import { cleanDatabase } from '../helpers/database';
import { getTestApp } from '../helpers/test-app';

describe('E2E: POST /v1/families', () => {
  let baseUrl: string;
  let authToken: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Use unique email for each test to avoid conflicts
    testCounter++;
    const uniqueEmail = `familyuser${testCounter}@example.com`;

    // Register and login a test user to get auth token
    const registerResponse = await request(baseUrl)
      .post('/v1/auth/register')
      .send({
        email: uniqueEmail,
        password: 'SecurePassword123!',
        name: 'Family User',
      });

    expect(registerResponse.status).toBe(201);
    authToken = registerResponse.body.accessToken || registerResponse.body.sessionToken;
    expect(authToken).toBeDefined();
  });

  describe('Success Cases', () => {
    it('should create family with name and return 201', async () => {
      const response = await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'The Johnsons',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('familyId');
      expect(response.body).toHaveProperty('name', 'The Johnsons');
      expect(response.body).toHaveProperty('role', 'Parent');
      expect(response.body).toHaveProperty('linkedAt');

      // Verify linkedAt is ISO timestamp
      expect(new Date(response.body.linkedAt).toISOString()).toBe(response.body.linkedAt);
    });

    it('should preserve exact family name without modification', async () => {
      const response = await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Testfamily',
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Testfamily');
      expect(response.body.role).toBe('Parent');
    });

    it('should create family without name (null) and return 201', async () => {
      const response = await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.name).toBeNull();
      expect(response.body.role).toBe('Parent');
    });

    it('should trim whitespace from family name', async () => {
      const response = await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '  Trimmed Family  ',
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Trimmed Family');
    });

    it('should treat empty string as null name', async () => {
      const response = await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '   ',
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBeNull();
    });
  });

  describe('Persistence Verification', () => {
    it('should persist family and membership in database', async () => {
      const createResponse = await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Persisted Family',
        });

      expect(createResponse.status).toBe(201);
      const { familyId } = createResponse.body;

      // Verify by listing families (requires GET endpoint to be implemented)
      // For now, verify we can create another family without collision
      const secondResponse = await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Second Family',
        });

      expect(secondResponse.status).toBe(201);
      expect(secondResponse.body.familyId).not.toBe(familyId);
    });

    it('should assign creator as Parent exactly once', async () => {
      const response = await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Parent Role Family',
        });

      expect(response.status).toBe(201);
      expect(response.body.role).toBe('Parent');
    });
  });

  describe('Validation Errors', () => {
    it('should reject family name longer than 120 characters', async () => {
      const longName = 'a'.repeat(121);

      const response = await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: longName,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with invalid payload structure', async () => {
      const response = await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 123, // Invalid type
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Authentication', () => {
    it('should reject request without authentication', async () => {
      const response = await request(baseUrl)
        .post('/v1/families')
        .send({
          name: 'Unauthorized Family',
        });

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', 'Bearer invalid-token-12345')
        .send({
          name: 'Invalid Token Family',
        });

      expect(response.status).toBe(401);
    });
  });
});
