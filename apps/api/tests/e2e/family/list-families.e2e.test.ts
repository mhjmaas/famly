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
          name: 'No Families User',
          birthdate: '1990-01-15',
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
          name: 'One Family User',
          birthdate: '1985-03-20',
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
      expect(Array.isArray(listResponse.body[0].members)).toBe(true);
      expect(listResponse.body[0].members).toHaveLength(1);
      expect(listResponse.body[0].members[0]).toMatchObject({
        memberId: expect.any(String),
        role: 'Parent',
        name: 'One Family User',
      });
      expect(listResponse.body[0].members[0]).toHaveProperty('birthdate');
      expect(listResponse.body[0].members[0]).toHaveProperty('linkedAt');
    });

    it('should return multiple families in correct order (newest first)', async () => {
      // Register and login (use unique email)
      const uniqueEmail = `multifamily${Date.now()}@example.com`;
      const registerResponse = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: uniqueEmail,
          password: 'SecurePassword123!',
          name: 'Multi Family User',
          birthdate: '1988-07-12',
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

      // All should be Parent role with member details including name and birthdate
      listResponse.body.forEach((family: any) => {
        expect(family.role).toBe('Parent');
        expect(Array.isArray(family.members)).toBe(true);
        expect(family.members.length).toBeGreaterThan(0);
        family.members.forEach((member: any) => {
          expect(member).toHaveProperty('name');
          expect(member).toHaveProperty('birthdate');
        });
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
          name: 'Null Name User',
          birthdate: '1982-11-05',
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
      expect(Array.isArray(listResponse.body[0].members)).toBe(true);
      expect(listResponse.body[0].members.length).toBeGreaterThan(0);
      expect(listResponse.body[0].members[0]).toHaveProperty('name');
      expect(listResponse.body[0].members[0]).toHaveProperty('birthdate');
    });
  });

  describe('Members Array', () => {
    it('should include all family members with correct details', async () => {
      const timestamp = Date.now();

      // 1. Register parent and create family
      const parentRes = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: `parent-${timestamp}@example.com`,
          password: 'parentpass123',
          name: 'Parent User',
          birthdate: '1980-01-15',
        });

      const parentToken = parentRes.body.accessToken || parentRes.body.sessionToken;
      const parentId = parentRes.body.user.id;

      const familyRes = await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ name: 'Test Family' });

      const familyId = familyRes.body.familyId;

      // 2. Add a child member
      const childRes = await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          email: `child-${timestamp}@example.com`,
          password: 'childpass123',
          name: 'Child User',
          birthdate: '2010-05-20',
          role: 'Child',
        });

      const childId = childRes.body.memberId;

      // 3. Add a co-parent
      const coParentRes = await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          email: `coparent-${timestamp}@example.com`,
          password: 'coparentpass123',
          name: 'Co-Parent User',
          birthdate: '1982-06-20',
          role: 'Parent',
        });

      const coParentId = coParentRes.body.memberId;

      // 4. List families and verify members array
      const listResponse = await request(baseUrl)
        .get('/v1/families')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(1);

      const family = listResponse.body[0];

      // Verify family structure
      expect(family).toMatchObject({
        familyId,
        name: 'Test Family',
        role: 'Parent',
        linkedAt: expect.any(String),
      });

      // Verify members array exists and has correct length
      expect(Array.isArray(family.members)).toBe(true);
      expect(family.members).toHaveLength(3);

      // Verify all members have required fields including name and birthdate
      family.members.forEach((member: any) => {
        expect(member).toMatchObject({
          memberId: expect.any(String),
          role: expect.stringMatching(/^(Parent|Child)$/),
          linkedAt: expect.any(String),
          name: expect.any(String),
        });
        expect(member).toHaveProperty('birthdate');
      });

      // Verify specific member details
      const parentMember = family.members.find((m: any) => m.memberId === parentId);
      const childMember = family.members.find((m: any) => m.memberId === childId);
      const coParentMember = family.members.find((m: any) => m.memberId === coParentId);

      expect(parentMember).toBeDefined();
      expect(parentMember.role).toBe('Parent');
      expect(parentMember.name).toBe('Parent User');
      expect(parentMember.birthdate).toBe('1980-01-15');
      expect(parentMember).not.toHaveProperty('addedBy'); // Original creator has no addedBy

      expect(childMember).toBeDefined();
      expect(childMember.role).toBe('Child');
      expect(childMember.name).toBe('Child User');
      expect(childMember.birthdate).toBe('2010-05-20');
      expect(childMember.addedBy).toBe(parentId);

      expect(coParentMember).toBeDefined();
      expect(coParentMember.role).toBe('Parent');
      expect(coParentMember.name).toBe('Co-Parent User');
      expect(coParentMember.birthdate).toBe('1982-06-20');
      expect(coParentMember.addedBy).toBe(parentId);

      // Verify ISO date format for linkedAt
      family.members.forEach((member: any) => {
        expect(new Date(member.linkedAt).toISOString()).toBe(member.linkedAt);
      });
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
          name: 'Consistency User',
          birthdate: '1986-04-10',
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

      // Verify base payload matches create response and members array is included
      const { members, ...familyWithoutMembers } = listedFamily;
      expect(familyWithoutMembers).toEqual(createdFamily);
      expect(Array.isArray(members)).toBe(true);
      expect(members.length).toBeGreaterThan(0);
      expect(members[0]).toHaveProperty('name');
      expect(members[0]).toHaveProperty('birthdate');
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
          name: 'User One',
          birthdate: '1975-08-22',
        });

      const user2Response = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: `user2${timestamp}@example.com`,
          password: 'SecurePassword123!',
          name: 'User Two',
          birthdate: '1978-12-14',
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
      expect(user1List.body[0].members[0]).toHaveProperty('name', 'User One');
      expect(user1List.body[0].members[0]).toHaveProperty('birthdate', '1975-08-22');

      // Verify User 2 only sees their family
      const user2List = await request(baseUrl)
        .get('/v1/families')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(user2List.body).toHaveLength(1);
      expect(user2List.body[0].name).toBe('User 2 Family');
      expect(user2List.body[0].members[0]).toHaveProperty('name', 'User Two');
      expect(user2List.body[0].members[0]).toHaveProperty('birthdate', '1978-12-14');
    });
  });
});
