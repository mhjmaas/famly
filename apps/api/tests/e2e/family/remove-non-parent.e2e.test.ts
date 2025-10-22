import request from 'supertest';
import { cleanDatabase } from '../helpers/database';
import { getTestApp } from '../helpers/test-app';
import { FamilyRole } from '@modules/family/domain/family';

describe('DELETE /v1/families/:familyId/members/:memberId - Non-parent authorization', () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  it('returns 403 when a child attempts to remove a family member', async () => {
    const timestamp = Date.now();

    const parentRes = await request(baseUrl)
      .post('/v1/auth/register')
      .send({
        email: `parent-${timestamp}@example.com`,
        password: 'parentpass123',
        name: 'Parent User',
        birthdate: '1980-01-15',
      })
      .expect(201);

    const parentToken = parentRes.body.accessToken || parentRes.body.sessionToken;

    const familyRes = await request(baseUrl)
      .post('/v1/families')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ name: 'Authorization Family' })
      .expect(201);

    const familyId = familyRes.body.familyId;
    const childEmail = `child-${timestamp}@example.com`;

    const addChildRes = await request(baseUrl)
      .post(`/v1/families/${familyId}/members`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        email: childEmail,
        password: 'childpass123',
        name: 'Child User',
        birthdate: '2010-05-20',
        role: FamilyRole.Child,
      })
      .expect(201);

    const childId = addChildRes.body.memberId;

    const childLoginRes = await request(baseUrl)
      .post('/v1/auth/login')
      .send({
        email: childEmail,
        password: 'childpass123',
      })
      .expect(200);

    const childToken = childLoginRes.body.accessToken || childLoginRes.body.sessionToken;

    const forbiddenRes = await request(baseUrl)
      .delete(`/v1/families/${familyId}/members/${childId}`)
      .set('Authorization', `Bearer ${childToken}`)
      .expect(403);

    expect(forbiddenRes.body).toHaveProperty('error');
    expect(forbiddenRes.body.error).toMatch(/parent/i);

    const parentRoster = await request(baseUrl)
      .get('/v1/families')
      .set('Authorization', `Bearer ${parentToken}`)
      .expect(200);

    const family = parentRoster.body.find((entry: { familyId: string }) => entry.familyId === familyId);
    expect(family).toBeDefined();
    expect(family.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ memberId: childId, role: FamilyRole.Child }),
      ])
    );
  });
});
