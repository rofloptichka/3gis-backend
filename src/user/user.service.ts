import { Injectable } from "@nestjs/common";
import { DatabaseService } from 'src/database/database.service';
import { Prisma , User} from '.prisma/client';

@Injectable()
export class UserService {
    constructor(private databaseService: DatabaseService) {}
  
    async createUser(data: Prisma.UserCreateInput): Promise<User> {
      return this.databaseService.user.create({ data });
    }
  
    async getAllUsers(): Promise<User[]> {
      return this.databaseService.user.findMany({});
    }
  
    async getUserById(id: string): Promise<User | null> {
      return this.databaseService.user.findUnique({ where: { id } });
    }
  
    async getUserByEmail(email: string): Promise<User | null> {
      return this.databaseService.user.findUnique({ where: { email } });
    }
  
    async updateUser(
      id: string,
      data: Prisma.UserUpdateInput,
    ): Promise<User | null> {
      const updatedUser = await this.databaseService.user.update({
        where: { id },
        data,
      });
    
      return updatedUser;
    }
    
  
    async deleteUser(id: string): Promise<User | null> {
      return this.databaseService.user.delete({ where: { id } });
    }

    async createFleet(data: Prisma.VehicleFleetCreateInput){
      return this.databaseService.vehicleFleet.create({data})
    }

    async getFleet(fleetId: string){
      return this.databaseService.vehicleFleet.findFirst({where: {id: fleetId}})
    }
  }
