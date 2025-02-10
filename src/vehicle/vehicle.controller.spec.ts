import { Test, TestingModule } from '@nestjs/testing';
import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('VehicleController', () => {
  let controller: VehicleController;
  let service: VehicleService;

  const mockVehicleService = {
    createVehicle: jest.fn(),
    getVehicles: jest.fn(),
    createRequest: jest.fn(),
    getRequests: jest.fn(),
    createMetric: jest.fn(),
    getMetrics: jest.fn(),
    createGps: jest.fn(),
    fleet_analitycs: jest.fn(),
    vehicleAnalytics: jest.fn(),
    fuel_analytics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehicleController],
      providers: [
        {
          provide: VehicleService,
          useValue: mockVehicleService,
        },
      ],
    }).compile();

    controller = module.get<VehicleController>(VehicleController);
    service = module.get<VehicleService>(VehicleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createVehicle', () => {
    it('should create a vehicle successfully', async () => {
      const vehicleData = {
        name: 'Test Vehicle',
        plateNumber: 'TEST123',
        location_time: new Date(),
        obd: {
          create: {
            speed: 0,
            rpm: 0,
            voltage: 0,
            fuel_level: 0,
            created_at: new Date()
          }
        }
      };
      mockVehicleService.createVehicle.mockResolvedValue(vehicleData);

      const result = await controller.createVehicle(vehicleData);
      
      expect(result).toEqual(vehicleData);
      expect(mockVehicleService.createVehicle).toHaveBeenCalledWith(vehicleData);
    });

    it('should handle errors when creating vehicle', async () => {
      const vehicleData = {
        name: 'Test Vehicle',
        plateNumber: 'TEST123',
        location_time: new Date(),
        obd: {
          create: {
            speed: 0,
            rpm: 0,
            voltage: 0,
            fuel_level: 0,
            created_at: new Date()
          }
        }
      };
      mockVehicleService.createVehicle.mockRejectedValue(new Error('Database error'));

      await expect(controller.createVehicle(vehicleData)).rejects.toThrow(HttpException);
    });
  });

  describe('getVehicles', () => {
    it('should return all vehicles', async () => {
      const vehicles = [
        { id: '1', name: 'Vehicle 1' },
        { id: '2', name: 'Vehicle 2' }
      ];
      mockVehicleService.getVehicles.mockResolvedValue(vehicles);

      const result = await controller.getVehicles();
      
      expect(result).toEqual(vehicles);
      expect(mockVehicleService.getVehicles).toHaveBeenCalled();
    });
  });

  describe('createRequest', () => {
    it('should create a request successfully', async () => {
      const requestData = {
        vehicleId: '1',
        type: 'MAINTENANCE',
        title: 'Lol',
        description: 'something',
        status: 'High',
        urgency: 'High',
        media: ''
      };
      mockVehicleService.createRequest.mockResolvedValue(requestData);

      const result = await controller.createRequest(requestData);
      
      expect(result).toEqual(requestData);
      expect(mockVehicleService.createRequest).toHaveBeenCalledWith(requestData);
    });
  });

  describe('getFleetAnalytics', () => {
    it('should return fleet analytics', async () => {
      const fleetId = '123';
      const analytics = { totalVehicles: 5, activeVehicles: 3 };
      mockVehicleService.fleet_analitycs.mockResolvedValue(analytics);

      const result = await controller.getFleetAnalytics(fleetId);
      
      expect(result).toEqual(analytics);
      expect(mockVehicleService.fleet_analitycs).toHaveBeenCalledWith(fleetId);
    });
  });

  describe('getFuelAnalytics', () => {
    it('should return fuel analytics with default time', async () => {
      const vehicleId = '123';
      const analytics = { fuelLevel: 75, consumption: 8.5 };
      mockVehicleService.fuel_analytics.mockResolvedValue(analytics);

      const result = await controller.getFuelAnalytics(vehicleId);
      
      expect(result).toEqual(analytics);
      expect(mockVehicleService.fuel_analytics).toHaveBeenCalledWith(vehicleId, 3600);
    });

    it('should return fuel analytics with custom time', async () => {
      const vehicleId = '123';
      const time = 7200;
      const analytics = { fuelLevel: 75, consumption: 8.5 };
      mockVehicleService.fuel_analytics.mockResolvedValue(analytics);

      const result = await controller.getFuelAnalytics(vehicleId, time);
      
      expect(result).toEqual(analytics);
      expect(mockVehicleService.fuel_analytics).toHaveBeenCalledWith(vehicleId, time);
    });
  });

  describe('error handling', () => {
    it('should handle duplicate entry errors', async () => {
      const vehicleData = {
        name: 'Test Vehicle',
        plateNumber: 'TEST123',
        location_time: new Date(),
        obd: {
          create: {
            speed: 0,
            rpm: 0,
            voltage: 0,
            fuel_level: 0,
            created_at: new Date()
          }
        }
      };
      const error = new Error('Duplicate entry');
      error['code'] = 'P2002';
      mockVehicleService.createVehicle.mockRejectedValue(error);

      await expect(controller.createVehicle(vehicleData)).rejects.toThrow(
        new HttpException('Duplicate entry', HttpStatus.CONFLICT)
      );
    });

    it('should handle general errors', async () => {
      const vehicleData = {
        name: 'Test Vehicle',
        plateNumber: 'TEST123',
        location_time: new Date(),
        obd: {
          create: {
            speed: 0,
            rpm: 0,
            voltage: 0,
            fuel_level: 0,
            created_at: new Date()
          }
        }
      };
      mockVehicleService.createVehicle.mockRejectedValue(new Error('Unknown error'));

      await expect(controller.createVehicle(vehicleData)).rejects.toThrow(
        new HttpException('Unknown error', HttpStatus.BAD_REQUEST)
      );
    });
  });
});