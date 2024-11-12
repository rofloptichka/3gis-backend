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
        return await this.db.obs.findMany()
    }

    async createGps(data: Prisma.GpsCreateInput){
        return await this.db.gps.create({data})
    }

    async createObdFuel(data: Prisma.Obd_fuelCreateInput){
        return await this.db.obd_fuel.create({data})
    }

    async createObdCheck(data: Prisma.Obd_checkCreateInput){
        return await this.db.obd_check.create({all: data})
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
}