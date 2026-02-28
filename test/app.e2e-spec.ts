import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('UniShare API (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // --- Auth ---

  describe('Auth', () => {
    const testUser = {
      email: `e2e-test-${Date.now()}@example.com`,
      password: 'testpass123',
      fullName: 'E2E Test User',
    };

    it('POST /api/auth/register - should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', testUser.email);
          expect(res.body).toHaveProperty('fullName', testUser.fullName);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('POST /api/auth/register - should fail for duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('POST /api/auth/login - should login successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(testUser.email);
          accessToken = res.body.accessToken;
        });
    });

    it('POST /api/auth/login - should fail with wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401);
    });

    it('GET /api/auth/me - should return current user', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', testUser.email);
        });
    });

    it('GET /api/auth/me - should fail without token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });
  });

  // --- Public Documents ---

  describe('Documents (public)', () => {
    it('GET /api/documents - should return documents without auth', () => {
      return request(app.getHttpServer())
        .get('/api/documents')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('GET /api/documents - should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/documents?page=1&limit=5')
        .expect(200)
        .expect((res) => {
          expect(res.body.pagination.page).toBe(1);
          expect(res.body.pagination.limit).toBe(5);
        });
    });

    it('GET /api/documents - should support search', () => {
      return request(app.getHttpServer())
        .get('/api/documents?search=test')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
        });
    });
  });

  // --- Categories (public) ---

  describe('Categories (public)', () => {
    it('GET /api/categories/subjects - should return all subjects', () => {
      return request(app.getHttpServer())
        .get('/api/categories/subjects')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/categories/majors - should return all majors', () => {
      return request(app.getHttpServer())
        .get('/api/categories/majors')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  // --- Protected Routes ---

  describe('Protected Routes', () => {
    it('GET /api/users/me/profile - should require auth', () => {
      return request(app.getHttpServer())
        .get('/api/users/me/profile')
        .expect(401);
    });

    it('GET /api/users/me/profile - should return profile with token', () => {
      return request(app.getHttpServer())
        .get('/api/users/me/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('fullName');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('GET /api/users/me/stats - should return user stats', () => {
      return request(app.getHttpServer())
        .get('/api/users/me/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalUploads');
          expect(res.body).toHaveProperty('totalDownloads');
          expect(res.body).toHaveProperty('avgDownloadsPerDoc');
        });
    });

    it('POST /api/documents/upload - should require auth', () => {
      return request(app.getHttpServer())
        .post('/api/documents/upload')
        .expect(401);
    });
  });

  // --- Statistics ---

  describe('Statistics', () => {
    it('GET /api/statistics/platform - should return platform stats', () => {
      return request(app.getHttpServer())
        .get('/api/statistics/platform')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalUploads');
          expect(res.body).toHaveProperty('totalDownloads');
          expect(res.body).toHaveProperty('activeUsers');
          expect(res.body).toHaveProperty('avgDlPerDoc');
        });
    });
  });
});
