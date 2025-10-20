import request from 'supertest';
import { setupE2E, teardownE2E } from './setup/testcontainers-setup';

describe('E2E: GET /v1/health', () => {
  let baseUrl: string;

  beforeAll(async () => {
    baseUrl = await setupE2E();
  }, 120000); // 2 minutes timeout for container startup

  afterAll(async () => {
    await teardownE2E();
  }, 30000);

  describe('Health Check', () => {
    it('should respond with status ok and HTTP 200', async () => {
      const response = await request(baseUrl)
        .get('/v1/health');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual({
        status: 'ok',
      });
    });

    it('should respond quickly (< 100ms)', async () => {
      const startTime = Date.now();
      
      const response = await request(baseUrl)
        .get('/v1/health');

      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(100);
    });

    it('should not require authentication', async () => {
      // Health endpoint should work without any auth
      const response = await request(baseUrl)
        .get('/v1/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });

    it('should return consistent response format', async () => {
      // Make multiple requests to ensure consistency
      for (let i = 0; i < 3; i++) {
        const response = await request(baseUrl)
          .get('/v1/health');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status');
        expect(response.body.status).toBe('ok');
      }
    });
  });
});
