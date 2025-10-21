import request from 'supertest';

import { cleanDatabase } from '../helpers/database';
import { getTestApp } from '../helpers/test-app';

describe('E2E: GET /v1/families', () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Success Cases', () => {
    it('should return empty array when user has no families', async () => {
      // Register and login (use unique email)
      const uniqueEmail = `nofamilies${Date.now()}@example.com`;
      const registerResponse = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: uniqueEmail,
          password: 'SecurePassword123!',
        });

      const authToken = registerResponse.body.accessToken || registerResponse.body.sessionToken;

      const response = await request(baseUrl)
        .get('/v1/families')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toEqual([]);
    });

    it('should return family after creating one', async () => {
      // Register and login (use unique email)
      const uniqueEmail = `onefamily${Date.now()}@example.com`;
      const registerResponse = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: uniqueEmail,
          password: 'SecurePassword123!',
        });

      const authToken = registerResponse.body.accessToken || registerResponse.body.sessionToken;

      // Create a family
      const createResponse = await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Family',
        });

      expect(createResponse.status).toBe(201);

      // List families
      const listResponse = await request(baseUrl)
        .get('/v1/families')
        .set('Authorization', `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0]).toMatchObject({
        name: 'Test Family',
        role: 'Parent',
      });
      expect(listResponse.body[0]).toHaveProperty('familyId');
      expect(listResponse.body[0]).toHaveProperty('linkedAt');
    });

    it('should return multiple families in correct order (newest first)', async () => {
      // Register and login (use unique email)
      const uniqueEmail = `multifamily${Date.now()}@example.com`;
      const registerResponse = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: uniqueEmail,
          password: 'SecurePassword123!',
        });

      const authToken = registerResponse.body.accessToken || registerResponse.body.sessionToken;

      // Create three families with small delays to ensure ordering
      await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'First Family' });

      await new Promise((resolve) => setTimeout(resolve, 50));

      await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Second Family' });

      await new Promise((resolve) => setTimeout(resolve, 50));

      await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Third Family' });

      // List families
      const listResponse = await request(baseUrl)
        .get('/v1/families')
        .set('Authorization', `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(3);

      // Verify ordering (newest first)
      expect(listResponse.body[0].name).toBe('Third Family');
      expect(listResponse.body[1].name).toBe('Second Family');
      expect(listResponse.body[2].name).toBe('First Family');

      // All should be Parent role
      listResponse.body.forEach((family: any) => {
        expect(family.role).toBe('Parent');
      });
    });

    it('should handle families with null names', async () => {
      // Register and login (use unique email)
      const uniqueEmail = `nullname${Date.now()}@example.com`;
      const registerResponse = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: uniqueEmail,
          password: 'SecurePassword123!',
        });

      const authToken = registerResponse.body.accessToken || registerResponse.body.sessionToken;

      // Create family without name
      await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // List families
      const listResponse = await request(baseUrl)
        .get('/v1/families')
        .set('Authorization', `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0].name).toBeNull();
    });
  });

  describe('Payload Consistency', () => {
    it('should return consistent payload structure matching create response', async () => {
      // Register and login (use unique email)
      const uniqueEmail = `consistency${Date.now()}@example.com`;
      const registerResponse = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: uniqueEmail,
          password: 'SecurePassword123!',
        });

      const authToken = registerResponse.body.accessToken || registerResponse.body.sessionToken;

      // Create a family
      const createResponse = await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Consistency Family',
        });

      const createdFamily = createResponse.body;

      // List families
      const listResponse = await request(baseUrl)
        .get('/v1/families')
        .set('Authorization', `Bearer ${authToken}`);

      const listedFamily = listResponse.body[0];

      // Verify exact match
      expect(listedFamily).toEqual(createdFamily);
    });
  });

  describe('Authentication', () => {
    it('should reject request without authentication', async () => {
      const response = await request(baseUrl).get('/v1/families');

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(baseUrl)
        .get('/v1/families')
        .set('Authorization', 'Bearer invalid-token-12345');

      expect(response.status).toBe(401);
    });

    it('should isolate families by user', async () => {
      // Create two users (use unique emails)
      const timestamp = Date.now();
      const user1Response = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: `user1${timestamp}@example.com`,
          password: 'SecurePassword123!',
        });

      const user2Response = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: `user2${timestamp}@example.com`,
          password: 'SecurePassword123!',
        });

      const user1Token = user1Response.body.accessToken || user1Response.body.sessionToken;
      const user2Token = user2Response.body.accessToken || user2Response.body.sessionToken;

      // User 1 creates a family
      await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'User 1 Family' });

      // User 2 creates a family
      await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ name: 'User 2 Family' });

      // Verify User 1 only sees their family
      const user1List = await request(baseUrl)
        .get('/v1/families')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(user1List.body).toHaveLength(1);
      expect(user1List.body[0].name).toBe('User 1 Family');

      // Verify User 2 only sees their family
      const user2List = await request(baseUrl)
        .get('/v1/families')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(user2List.body).toHaveLength(1);
      expect(user2List.body[0].name).toBe('User 2 Family');
    });
  });
});
