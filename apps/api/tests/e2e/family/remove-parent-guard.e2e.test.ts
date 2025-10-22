import request from 'supertest';
import { cleanDatabase } from '../helpers/database';
import { getTestApp } from '../helpers/test-app';
import { FamilyRole } from '@modules/family/domain/family';

describe('DELETE /v1/families/:familyId/members/:memberId - Parent guardrails', () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  it('allows a parent to remove a co-parent while another parent remains', async () => {
    const timestamp = Date.now();

    const parent1Res = await request(baseUrl)
      .post('/v1/auth/register')
      .send({
        email: `parent1-${timestamp}@example.com`,
        password: 'parent1pass123',
        name: 'Parent One',
        birthdate: '1980-01-15',
      })
      .expect(201);

    const parent1Token = parent1Res.body.accessToken || parent1Res.body.sessionToken;
    const parent1Id = parent1Res.body.user.id;

    const familyRes = await request(baseUrl)
      .post('/v1/families')
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({ name: 'Guard Family' })
      .expect(201);

    const familyId = familyRes.body.familyId;
    const parent2Email = `parent2-${timestamp}@example.com`;

    const addParent2Res = await request(baseUrl)
      .post(`/v1/families/${familyId}/members`)
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({
        email: parent2Email,
        password: 'parent2pass123',
        name: 'Parent Two',
        birthdate: '1982-06-20',
        role: FamilyRole.Parent,
      })
      .expect(201);

    const parent2Id = addParent2Res.body.memberId;

    const parent2LoginRes = await request(baseUrl)
      .post('/v1/auth/login')
      .send({
        email: parent2Email,
        password: 'parent2pass123',
      })
      .expect(200);

    const parent2Token = parent2LoginRes.body.accessToken || parent2LoginRes.body.sessionToken;

    await request(baseUrl)
      .delete(`/v1/families/${familyId}/members/${parent2Id}`)
      .set('Authorization', `Bearer ${parent1Token}`)
      .expect(204);

    const parentRoster = await request(baseUrl)
      .get('/v1/families')
      .set('Authorization', `Bearer ${parent1Token}`)
      .expect(200);

    const updatedFamily = parentRoster.body.find((family: { familyId: string }) => family.familyId === familyId);
    expect(updatedFamily).toBeDefined();
    expect(updatedFamily.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ memberId: parent1Id, role: FamilyRole.Parent }),
      ])
    );
    expect(updatedFamily.members).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ memberId: parent2Id }),
      ])
    );

    const parent2Roster = await request(baseUrl)
      .get('/v1/families')
      .set('Authorization', `Bearer ${parent2Token}`)
      .expect(200);

    expect(parent2Roster.body).toEqual([]);
  });

  it('prevents removing the final remaining parent with a 409 conflict', async () => {
    const timestamp = Date.now();

    const parentRes = await request(baseUrl)
      .post('/v1/auth/register')
      .send({
        email: `solo-parent-${timestamp}@example.com`,
        password: 'parentpass123',
        name: 'Solo Parent',
        birthdate: '1980-01-15',
      })
      .expect(201);

    const parentToken = parentRes.body.accessToken || parentRes.body.sessionToken;
    const parentId = parentRes.body.user.id;

    const familyRes = await request(baseUrl)
      .post('/v1/families')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ name: 'Solo Family' })
      .expect(201);

    const familyId = familyRes.body.familyId;

    const conflictRes = await request(baseUrl)
      .delete(`/v1/families/${familyId}/members/${parentId}`)
      .set('Authorization', `Bearer ${parentToken}`)
      .expect(409);

    expect(conflictRes.body).toHaveProperty('error');
    expect(conflictRes.body.error).toMatch(/at least one parent/i);
  });
});
