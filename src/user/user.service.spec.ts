import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { DatabaseService } from '../database/database.service';
import { Prisma, User } from '@prisma/client';

describe('UserService', () => {
  let service: UserService;
  let databaseService: DatabaseService;

  const mockDatabaseService = {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    role: 'USER',
    image: '',
    emailVerified: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserDto: Prisma.UserCreateInput = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      mockDatabaseService.user.create.mockResolvedValue(mockUser);

      const result = await service.createUser(createUserDto);

      expect(result).toEqual(mockUser);
      expect(mockDatabaseService.user.create).toHaveBeenCalledWith({
        data: createUserDto,
      });
    });

    it('should throw error if creation fails', async () => {
      const createUserDto: Prisma.UserCreateInput = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      mockDatabaseService.user.create.mockRejectedValue(new Error('Database error'));

      await expect(service.createUser(createUserDto)).rejects.toThrow('Database error');
    });
  });

  describe('getAllUsers', () => {
    it('should return array of users', async () => {
      const users = [mockUser];
      mockDatabaseService.user.findMany.mockResolvedValue(users);

      const result = await service.getAllUsers();

      expect(result).toEqual(users);
      expect(mockDatabaseService.user.findMany).toHaveBeenCalledWith({});
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserById('1');

      expect(result).toEqual(mockUser);
      expect(mockDatabaseService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null if user not found', async () => {
      mockDatabaseService.user.findUnique.mockResolvedValue(null);

      const result = await service.getUserById('999');

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockDatabaseService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('updateUser', () => {
    it('should update and return user', async () => {
      const updateData: Prisma.UserUpdateInput = {
        name: 'Updated Name',
      };

      mockDatabaseService.user.update.mockResolvedValue({
        ...mockUser,
        name: 'Updated Name',
      });

      const result = await service.updateUser('1', updateData);

      expect(result).toEqual({
        ...mockUser,
        name: 'Updated Name',
      });
      expect(mockDatabaseService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
      });
    });
  });
});