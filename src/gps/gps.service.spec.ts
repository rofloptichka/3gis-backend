import { Test, TestingModule } from '@nestjs/testing';
import { GpsService } from './gps.service';
import { Prisma } from ".prisma/client";
import { DatabaseService } from '../database/database.service';
import { feature, lineString } from '@turf/turf';
import * as turf from '@turf/turf';

describe('GpsService', () => {
  let service: GpsService;
  let databaseService: DatabaseService;

  const mockDatabaseService = {
    vehicle: {
      findUnique: jest.fn(),
    },
  };

  const mockGpsPoint1: Prisma.GpsCreateInput = {
    latitude: 42.0,
    longitude: 74.0,
    timestamp: new Date('2024-03-10T10:00:00Z'),
    altitude: 1000,
    speed: 0,
    isKey: false,
  };

  const mockGpsPoint2: Prisma.GpsCreateInput = {
    latitude: 42.1,
    longitude: 74.1,
    timestamp: new Date('2024-03-10T10:01:00Z'),
    altitude: 1000,
    speed: 0,
    isKey: false,
  };
  const mockGpsPoint3: Prisma.GpsCreateInput = {
    latitude: 42.1,
    longitude: 74.1,
    timestamp: new Date('2024-03-10T10:00:00Z'),
    altitude: 1000,
    speed: 0,
    isKey: false,
  };


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GpsService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<GpsService>(GpsService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateSpeed', () => {
    it('should calculate speed correctly', () => {
      const point1 = { latitude: 42.0, longitude: 74.0 };
      const point2 = { latitude: 42.1, longitude: 74.1 };
      const time1 = new Date('2024-03-10T10:00:00Z');
      const time2 = new Date('2024-03-10T10:01:00Z');

      const speed = service.calculateSpeed(mockGpsPoint1, mockGpsPoint2
      );

      expect(speed).toBeGreaterThan(0);
    });

    it('should return null when time difference is zero', () => {
      const time = new Date('2024-03-10T10:00:00Z');

      const speed = service.calculateSpeed(mockGpsPoint1, mockGpsPoint3
      );

      expect(speed).toBeNull();
    });
  });

  describe('checkIfWithinRoute', () => {
    const mockGeoJson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [74.0, 42.0],
              [74.1, 42.1],
            ],
          },
          properties: {},
        },
      ],
    };

    it('should return true when point is on route', async () => {
      mockDatabaseService.vehicle.findUnique.mockResolvedValue({
        currentRoute: {
          geojson: mockGeoJson,
        },
      });

      const result = await service.checkIfWithinRoute(
        'vehicle-id',
        42.0,
        74.0
      );

      expect(result).toBeTruthy();
      expect(mockDatabaseService.vehicle.findUnique).toHaveBeenCalledWith({
        where: { id: 'vehicle-id' },
        include: { currentRoute: true },
      });
    });

    it('should return true when vehicleId is undefined', async () => {
      const result = await service.checkIfWithinRoute(
        undefined,
        42.0,
        74.0
      );

      expect(result).toBeTruthy();
    });

    it('should throw error for invalid GeoJSON', async () => {
      const invalidGeoJson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [74.0, 42.0],
            },
            properties: {},
          },
        ],
      };

      mockDatabaseService.vehicle.findUnique.mockResolvedValue({
        currentRoute: {
          geojson: invalidGeoJson,
        },
      });

      await expect(
        service.checkIfWithinRoute('vehicle-id', 42.0, 74.0)
      ).rejects.toThrow('Invalid GeoJSON: Route geometry is not a LineString');
    });
  });

  describe('isLineString', () => {
    it('should return true for valid LineString', () => {
      const validLineString = {
        type: 'LineString',
        coordinates: [[74.0, 42.0], [74.1, 42.1]],
      };

      expect(service.isLineString(validLineString)).toBeTruthy();
    });

    it('should return false for invalid geometry', () => {
      const invalidGeometry = {
        type: 'Point',
        coordinates: [74.0, 42.0],
      };

      expect(service.isLineString(invalidGeometry)).toBeFalsy();
    });
  });
});