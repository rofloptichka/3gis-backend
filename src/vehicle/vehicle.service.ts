import { Injectable } from "@nestjs/common";
import { DatabaseService } from 'src/database/database.service';
import { Prisma, Vehicle } from ".prisma/client";

@Injectable()
export class VehicleService{
    constructor(private db: DatabaseService) {}

    async createVehicle(data: Prisma.VehicleCreateInput){
        return await this.db.vehicle.create({data})
    }

    async getVehicles(){
        return await this.db.vehicle.findMany()
    }


    async createRequest(data: Prisma.RequestCreateInput){
        return await this.db.request.create({data})
    }

    async getRequests(){
        return await this.db.request.findMany()
    }


    async createMetric(data: Prisma.ObdCreateInput){
        return await this.db.obd.create({data})
    }

    async getMetrics(){
        return await this.db.obd.findMany()
    }

    async createGps(data: Prisma.GpsCreateInput){
        const newGps = await this.db.gps.create({ data });
        if (data.vehicleId) {
            await this.db.vehicle.update({
              where: { id: data.vehicleId },
              data: {
                locationId: newGps.id,
                location_time: newGps.timestamp, 
              },
            });
          }
        return newGps;
    }

    async createObdFuel(data: Prisma.Obd_fuelCreateInput){
        return await this.db.obd_fuel.create({data})
    }

    async createObdCheck(data: Prisma.Obd_checkCreateInput) {
        return await this.db.obd_check.create({ data });
    }    

    async getObdChecks(){
        return await this.db.obd_check.findMany()
    }

    async getLatestObdCheck(){
        return await this.db.obd_check.findFirst({
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async createOrUpdateRoute(vehicleId: string, routeData: Prisma.RoutesCreateInput) {
        const existingRoute = await this.db.routes.findUnique({
          where: { vehicleId },
        });
      
        if (existingRoute) {
          return await this.db.routes.update({
            where: { id: existingRoute.id },
            data: routeData,
          });
        } else {
          return await this.db.routes.create({
            data: { ...routeData, vehicleId },
          });
        }
    }
}