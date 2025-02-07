import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { Prisma } from '@prisma/client';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    getAllUsers: jest.fn(),
    updateUser: jest.fn(),
    createFleet: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users successfully', async () => {
      const mockUsers = [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Doe', email: 'jane@example.com' },
      ];
      mockUserService.getAllUsers.mockResolvedValue(mockUsers);

      const result = await controller.getAllUsers();

      expect(result).toEqual(mockUsers);
      expect(mockUserService.getAllUsers).toHaveBeenCalled();
    });

    it('should handle errors when getting users', async () => {
      mockUserService.getAllUsers.mockRejectedValue(new Error('Database error'));

      await expect(controller.getAllUsers()).rejects.toThrow('Database error');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userId = '1';
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };
      const updatedUser = { id: userId, ...updateData };
      
      mockUserService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateRole(userId, updateData);

      expect(result).toEqual(updatedUser);
      expect(mockUserService.updateUser).toHaveBeenCalledWith(userId, updateData);
    });

    it('should handle errors when updating user', async () => {
      const userId = '1';
      const updateData = { name: 'Updated Name' };
      
      mockUserService.updateUser.mockRejectedValue(new Error('User not found'));

      await expect(controller.updateRole(userId, updateData)).rejects.toThrow('User not found');
    });
  });

  describe('createFleet', () => {
    it('should create fleet successfully', async () => {
      const fleetData: Prisma.VehicleFleetCreateInput = {
        name: 'Test Fleet',
        description: 'Test Fleet Description',
        email: "",
        phoneNumber: ""
      };
      const createdFleet = { id: '1', ...fleetData };
      
      mockUserService.createFleet.mockResolvedValue(createdFleet);

      const result = await controller.createFleet(fleetData);

      expect(result).toEqual(createdFleet);
      expect(mockUserService.createFleet).toHaveBeenCalledWith(fleetData);
    });

    it('should handle errors when creating fleet', async () => {
      const fleetData: Prisma.VehicleFleetCreateInput = {
        name: 'Test Fleet',
        description: 'Test Fleet Description',
        email: "",
        phoneNumber: ""
      };
      
      mockUserService.createFleet.mockRejectedValue(new Error('Fleet creation failed'));

      await expect(controller.createFleet(fleetData)).rejects.toThrow('Fleet creation failed');
    });
  });
});