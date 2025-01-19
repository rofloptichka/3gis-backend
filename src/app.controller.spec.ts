import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './app.module';
import { PrismaClient } from '@prisma/client';

describe('VehicleController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = new PrismaClient();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  describe('VehicleController (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaClient;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      prisma = new PrismaClient();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
      await prisma.$disconnect();
    });

    beforeEach(async () => {
      await prisma.routes.deleteMany();
      await prisma.gps.deleteMany();
    });

    it('/vehicles/metrics (GET)', () => {
      return request(app.getHttpServer())
        .get('/vehicles/metrics')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
    it('/vehicles/gps (POST)', async () => {
      const createdRoute = await prisma.routes.create({
        data: {
          driver_id: 'e6dbd680ec08f2305d753211',
          startingLocation: { lat: 1.234, lon: 5.678 },
          endingLocation: { lat: 9.876, lon: 5.432 },
          startingTime: new Date(),
          endingTime: new Date(),
          geojson: { type: 'LineString', coordinates: [[1.234, 5.678], [9.876, 5.432]] },
        },
      });

      const gpsData = {
        vehicleId: "5f4f1b9b8f1b2b3a4a5a6a7a",
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

    it('/vehicles/gps (POST) with invalid data', async () => {
      const gpsData = {
        vehicleId: "invalidVehicleId",
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date().toISOString(),
      };
      return request(app.getHttpServer())
        .post('/vehicles/gps/invalidVehicleId')
        .send(gpsData)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode', 400);
          expect(res.body).toHaveProperty('message');
        });
    });

    it('/vehicles/gps (POST) without required fields', async () => {
      const gpsData = {
        latitude: 40.7128,
        longitude: -74.0060,
      };

      return request(app.getHttpServer())
        .post('/vehicles/gps/5f9f1b2b8f1c2b3a5a5a6a7b')
        .send(gpsData)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode', 400);
          expect(res.body).toHaveProperty('message');
        });
    });

    it('/vehicles/counter (POST)', async () => {
      const counterData = {
        vehicleId: "5f4f1b9b8f1b2b3a4a5a6a7a",
        title: "Oil Change",
        description: "Oil change required every 5000 km",
        nextDistance: 5000,
        needDistance: 5000,
      };

      return request(app.getHttpServer())
        .post('/vehicles/counter')
        .send(counterData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('vehicleId', counterData.vehicleId);
          expect(res.body).toHaveProperty('title', counterData.title);
        });
    });
    
    it('/vehicles/counter/:vehicleId (GET)', async () => {
      const vehicleId = "5f4f1b9b8f1b2b3a4a5a6a7a";
      await prisma.counter.create({
        data: {
          vehicleId,
          title: "Oil Change",
          description: "Oil change required every 5000 km",
          nextDistance: 5000,
          needDistance: 5000,
        },
      });

      return request(app.getHttpServer())
        .get(`/vehicles/counter/${vehicleId}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body[0]).toHaveProperty('vehicleId', vehicleId);
        });
    });
  });
});