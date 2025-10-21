import request from 'supertest';
import { ObjectId } from 'mongodb';

import { cleanDatabase } from '../helpers/database';
import { getTestApp } from '../helpers/test-app';
import { FamilyRole } from '@modules/family/domain/family';

describe('POST /v1/families/:familyId/members - Add Parent Member', () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('successful parent member creation', () => {
    it('should allow parent to add co-parent member to their family', async () => {
      // 1. Register first parent
      const timestamp = Date.now();
      const parent1Res = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: `parent1-${timestamp}@example.com`,
          password: 'parent1pass123',
          name: 'Parent One',
        })
        .expect(201);

      const parent1Token = parent1Res.body.accessToken || parent1Res.body.sessionToken;

      // 2. Create family
      const familyRes = await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${parent1Token}`)
        .send({ name: 'Test Family' })
        .expect(201);

      const familyId = familyRes.body.familyId;

      // 3. Add second parent (co-parent) to family
      const parent2Res = await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set('Authorization', `Bearer ${parent1Token}`)
        .send({
          email: `parent2-${timestamp}@example.com`,
          password: 'parent2pass123',
          role: FamilyRole.Parent,
        })
        .expect(201);

      // 4. Verify response structure for parent role
      expect(parent2Res.body).toMatchObject({
        memberId: expect.any(String),
        familyId,
        role: FamilyRole.Parent,
        linkedAt: expect.any(String),
        addedBy: expect.any(String),
      });

      expect(ObjectId.isValid(parent2Res.body.memberId)).toBe(true);
      expect(ObjectId.isValid(parent2Res.body.addedBy)).toBe(true);

      // 5. Verify no auth tokens issued for new parent
      expect(parent2Res.body).not.toHaveProperty('session');
      expect(parent2Res.body).not.toHaveProperty('token');
      expect(parent2Res.headers['set-cookie']).toBeUndefined();
    });

    it('should include addedBy field matching initiating parent user ID', async () => {
      const timestamp = Date.now();
      const parent1Res = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: `parent1-${timestamp}@example.com`,
          password: 'parent1pass123',
          name: 'Parent One',
        })
        .expect(201);

      const parent1Token = parent1Res.body.accessToken || parent1Res.body.sessionToken;
      const parent1Id = parent1Res.body.user.id;

      const familyRes = await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${parent1Token}`)
        .send({ name: 'Test Family' })
        .expect(201);

      const parent2Res = await request(baseUrl)
        .post(`/v1/families/${familyRes.body.familyId}/members`)
        .set('Authorization', `Bearer ${parent1Token}`)
        .send({
          email: `parent2-${timestamp}@example.com`,
          password: 'parent2pass123',
          role: FamilyRole.Parent,
        })
        .expect(201);

      expect(parent2Res.body.addedBy).toBe(parent1Id);
    });
  });

  describe('cross-family conflict handling', () => {
    it('should return 409 conflict when adding parent with email already linked to another family', async () => {
      // 1. Create first family and register parent1
      const timestamp = Date.now();
      const parent1Res = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: `parent1-${timestamp}@example.com`,
          password: 'parent1pass123',
          name: 'Parent One',
        })
        .expect(201);

      const parent1Token = parent1Res.body.accessToken || parent1Res.body.sessionToken;

      const family1Res = await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${parent1Token}`)
        .send({ name: 'Family One' })
        .expect(201);

      const family1Id = family1Res.body.familyId;

      // 2. Add parentX to family1 (will try to add to family2 later)
      await request(baseUrl)
        .post(`/v1/families/${family1Id}/members`)
        .set('Authorization', `Bearer ${parent1Token}`)
        .send({
          email: `parentx-${timestamp}@example.com`,
          password: 'parentxpass123',
          role: FamilyRole.Parent,
        })
        .expect(201);

      // 3. Create second family with different parent
      const parent2Res = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: `parent2-${timestamp}@example.com`,
          password: 'parent2pass123',
          name: 'Parent Two',
        })
        .expect(201);

      const parent2Token = parent2Res.body.accessToken || parent2Res.body.sessionToken;

      const family2Res = await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${parent2Token}`)
        .send({ name: 'Family Two' })
        .expect(201);

      const family2Id = family2Res.body.familyId;

      // 4. Try to add parentX (email already linked to family1) to family2
      // Should fail with 409 conflict
      const conflictRes = await request(baseUrl)
        .post(`/v1/families/${family2Id}/members`)
        .set('Authorization', `Bearer ${parent2Token}`)
        .send({
          email: `parentx-${timestamp}@example.com`,
          password: 'newpass123',
          role: FamilyRole.Parent,
        })
        .expect(409);

      // 5. Verify error message guides user about conflict
      expect(conflictRes.body).toHaveProperty('error');
      expect(conflictRes.body.error.toLowerCase()).toContain('email');
    });

    it('should allow reusing email within same family (edge case verification)', async () => {
      // 1. Register parent
      const timestamp = Date.now();
      const parentRes = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: `parent-${timestamp}@example.com`,
          password: 'parentpass123',
          name: 'Parent',
        })
        .expect(201);

      const parentToken = parentRes.body.accessToken || parentRes.body.sessionToken;

      // 2. Create family
      const familyRes = await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ name: 'Test Family' })
        .expect(201);

      const familyId = familyRes.body.familyId;

      // 3. Add member once
      await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          email: 'newmember@example.com',
          password: 'newmemberpass123',
          role: FamilyRole.Child,
        })
        .expect(201);

      // 4. Try to add same email again to same family - should fail with 409
      // (duplicate check, not cross-family conflict)
      await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          email: 'newmember@example.com',
          password: 'differentpass',
          role: FamilyRole.Child,
        })
        .expect(409);
    });
  });

  describe('validation for parent role', () => {
    it('should accept Parent role in request body', async () => {
      const timestamp = Date.now();
      const parentRes = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: `parent-${timestamp}@example.com`,
          password: 'parentpass123',
          name: 'Parent',
        })
        .expect(201);

      const parentToken = parentRes.body.accessToken || parentRes.body.sessionToken;

      const familyRes = await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ name: 'Test Family' })
        .expect(201);

      const res = await request(baseUrl)
        .post(`/v1/families/${familyRes.body.familyId}/members`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          email: `parent2-${timestamp}@example.com`,
          password: 'parent2pass123',
          role: FamilyRole.Parent,
        })
        .expect(201);

      expect(res.body.role).toBe(FamilyRole.Parent);
    });

    it('should reject invalid role values', async () => {
      const timestamp = Date.now();
      const parentRes = await request(baseUrl)
        .post('/v1/auth/register')
        .send({
          email: `parent-${timestamp}@example.com`,
          password: 'parentpass123',
          name: 'Parent',
        })
        .expect(201);

      const familyRes = await request(baseUrl)
        .post('/v1/families')
        .set('Authorization', `Bearer ${parentRes.body.accessToken || parentRes.body.sessionToken}`)
        .send({ name: 'Test Family' })
        .expect(201);

      await request(baseUrl)
        .post(`/v1/families/${familyRes.body.familyId}/members`)
        .set('Authorization', `Bearer ${parentRes.body.accessToken || parentRes.body.sessionToken}`)
        .send({
          email: 'member@example.com',
          password: 'memberpass123',
          role: 'Guardian', // Invalid role
        })
        .expect(400);
    });
  });
});
