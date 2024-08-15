import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('Protected Routes (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer())
      .post('/login')
      .send({ user: 'will_smith', password: '1234567' })
      .expect(200);

    accessToken = response.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow access to protected route with valid token', () => {
    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('should deny access to protected route without token', () => {
    return request(app.getHttpServer()).get('/realestates').expect(401);
  });

  it('should deny access to protected route with invalid token', () => {
    return request(app.getHttpServer())
      .get('/tasks')
      .set('Authorization', `Bearer invalidtoken`)
      .expect(401);
  });
});
