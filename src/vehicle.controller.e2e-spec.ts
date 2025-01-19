import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './app.module';


describe('VehicleController (e2e)', () => {
  let app: INestApplication;
    
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/vehicles/metrics (GET)', () => {
    return request(app.getHttpServer())
      .get('/vehicles/metrics')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('/vehicles/gps (POST)', () => {
    const gpsData = {
      vehicleId: "5f9f1b9b8f1b2b3a4a5a6a7a",
      latitude: 40.7128,
      longitude: -74.0060,
      timestamp: new Date().toISOString(),
    };

    return request(app.getHttpServer())
      .post('/vehicles/gps/5f9f1b2b8f1c2b3a5a5a6a7b')
      .send(gpsData)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('vehicleId', gpsData.vehicleId);
      });
  });
});