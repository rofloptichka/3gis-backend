import { Test, TestingModule } from '@nestjs/testing';
import { VehicleService } from './vehicle.service';
import { DatabaseService } from '../database/database.service';
import { GpsService } from '../gps/gps.service';

// vehicle.service.spec.ts

describe('VehicleService', () => {
  let service: VehicleService;
  let dbService: DatabaseService;

  const mockDatabaseService = {
    request: {
      findMany: jest.fn()
    }
  };

  const mockGpsService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService
        },
        {
          provide: GpsService,
          useValue: mockGpsService
        }
      ],
    }).compile();

    service = module.get<VehicleService>(VehicleService);
    dbService = module.get<DatabaseService>(DatabaseService);
  });

  describe('getRequests', () => {
    it('should return all requests', async () => {
      const mockRequests = [
        { id: '1', type: 'maintenance' },
        { id: '2', type: 'repair' }
      ];
      mockDatabaseService.request.findMany.mockResolvedValue(mockRequests);

      const result = await service.getRequests();
      
      expect(result).toEqual(mockRequests);
      expect(mockDatabaseService.request.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no requests exist', async () => {
      mockDatabaseService.request.findMany.mockResolvedValue([]);

      const result = await service.getRequests();
      
      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      mockDatabaseService.request.findMany.mockRejectedValue(new Error('DB Error'));

      await expect(service.getRequests()).rejects.toThrow('DB Error');
    });
  });
});
