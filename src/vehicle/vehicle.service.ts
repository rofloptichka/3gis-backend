import { Injectable } from "@nestjs/common";
import { DatabaseService } from '../database/database.service';
import { Prisma, Vehicle } from ".prisma/client";
import axios from "axios";
import * as turf from '@turf/turf';
import { LineString } from "geojson";
import { GpsService } from "../gps/gps.service";
import { connect } from "http2";


@Injectable()
export class VehicleService{
    constructor(
      private db: DatabaseService,
      private gps: GpsService
    ) {}

    async createVehicle(data: Prisma.VehicleCreateInput){
        return await this.db.vehicle.create({data})
    }

    async getVehicles(){
        return await this.db.vehicle.findMany()
    }

    async getVehicleById(vehicleId: string): Promise<Vehicle | null> {
      return await this.db.vehicle.findUnique({ where: { id: vehicleId } });
    }

    async createRequest(data: Prisma.RequestCreateInput){
        return await this.db.request.create({data})
    }

    async getRequests(){
        return await this.db.request.findMany()
    }

    async createMetric(data: Prisma.ObdCreateInput) {
      const counters = await this.getCounters(data.vehicleId);

      for (let counter of counters) {
        if (counter.currentDistance > data.distanceTraveled) {
          await this.createViolation({
            vehicle: {connect: {id: data.vehicleId}},
            type: `ThresholdExceeded`,
            description: `Vehicle has exceeded the threshold for counter: ${counter.title}.`,
            context: {
              currentDistance: data.distanceTraveled,
              threshold: counter.currentDistance,
              counterTitle: counter.title,
              counterDescription: counter.description,
              counterId: counter.id
            }, 
          });
          const updatedCurrentDistance = counter.currentDistance + counter.needDistance;
          await this.db.counter.update({
            where: { id: counter.id },
            data: { currentDistance: updatedCurrentDistance },
          });
        }
      }

      const obdRecord = await this.db.obd.create({ data });

      const obdFuelData = {
        vehicle_id: obdRecord.vehicleId,
        engineRpm: obdRecord.engineRpm ? Math.round(obdRecord.engineRpm) : null,
        fuelLevel: obdRecord.fuelLevel ? Math.round(obdRecord.fuelLevel) : null,
        engineLoad: obdRecord.engineLoad ? Math.round(obdRecord.engineLoad) : null,
        massAirFlow: obdRecord.massAirFlow,
        fuelPressure: obdRecord.fuelPressure ? Math.round(obdRecord.fuelPressure) : null,
        fuelConsumptionRate: obdRecord.fuelConsumptionRate,
        diagnosticTroubleCode: obdRecord.diagnosticTroubleCode,
        distanceTraveled: obdRecord.distanceTraveled,
        time: obdRecord.time,
        absStatus: null,
        tirePressure: null,
      };

      await this.createObdFuel(obdFuelData);
      return obdRecord;
    }

    async getMetrics(){
        return await this.db.obd.findMany()
    }

    async createGps(data: Prisma.GpsCreateInput, routeId: string) {
      const previousGps = await this.gps.getPreviousGps(data.vehicleId);
      const calculatedSpeed = this.gps.calculateSpeed(previousGps, data);
    
      const isWithinRoute = await this.gps.checkIfWithinRoute(data.vehicleId, data.latitude, data.longitude);
      const isIdle = await this.gps.checkIdleState(data.vehicleId, 5*60, 5);

      if (!isWithinRoute){
        await this.createViolation({
          vehicle: { connect: { id: data.vehicleId } }, 
          type: 'OUT_OF_ROUTE',
          description: `${data.vehicleId} is out of route at location (${data.latitude}, ${data.longitude}).`,
          context: { latitude: data.latitude, longitude: data.longitude },
        })
      }
      if (isIdle){
        await this.createViolation({
          vehicle: { connect: { id: data.vehicleId } },
          type: 'IDLE',
          description: `Транспортное средство ${data.vehicleId} бездействует более 5 минут.`,
          context: { lastKnownLocation: { latitude: data.latitude, longitude: data.longitude } },
        })
      }
      if (calculatedSpeed > 90) {
        await this.createViolation({
          vehicle: { connect: { id: data.vehicleId } },
          type: 'SPEEDING',
          description: `Транспортное средство ${data.vehicleId} превысило ограничение скорости в 90 км/ч.`,
          context: { speed: calculatedSpeed, location: { latitude: data.latitude, longitude: data.longitude } },
        });
      }

      data.isKey = false 
      if (this.gps.isKeyPoint(previousGps, data)) {
        data.isKey = true 
      }
    
      const newGps = await this.db.gps.create({
        data: { ...data, speed: calculatedSpeed, route: {
          connect: {id: routeId}
        } },
      });

      if (data.vehicleId) {
        await this.gps.updateVehicleLocation(data.vehicleId, newGps.id, newGps.timestamp);
        await this.gps.enforceGpsRecordLimit(data.vehicleId, 10);
      }
    
      return newGps;
    }

    async createObdFuel(data: Prisma.Obd_fuelCreateInput){
      const lastEntry = await this.db.obd_fuel.findFirst({
        where: { vehicle_id: data.vehicle_id },
        orderBy: { time: 'desc' },
      });

      if (lastEntry) {
          const timeDifference = (new Date(data.time).getTime() - new Date(lastEntry.time).getTime()) / 3600000; 
          const expectedDecrease = lastEntry.fuelConsumptionRate * timeDifference;

          const actualDecrease = lastEntry.fuelLevel - data.fuelLevel;
          if (actualDecrease > expectedDecrease * 1.2) { 
              await this.createViolation({
                vehicle: { connect: { id: data.vehicle_id } },
                type: 'FUEL_THEFT',  
                description: `potential fuel theft detected for vehicle ${data.vehicle_id}. Fuel level drop exceeds expected consumption.`,
                context: {
                    fuelLevelDrop: actualDecrease,
                    expectedDrop: expectedDecrease,
                    fuelConsumptionRate: lastEntry.fuelConsumptionRate,
                    timeDifference, 
                },
            });
          }
      }

      return await this.db.obd_fuel.create({ data });
    }

    async fuel_analytics(vehicleId: string, timeInSeconds: number) {
      const cutoffTime = new Date(Date.now() - timeInSeconds * 1000);
    
      const records = await this.db.obd_fuel.findMany({
        where: {
          vehicle_id: vehicleId,
          time: {
            gte: cutoffTime, 
          },
        },
        orderBy: { time: 'asc' },
      });
    
      if (records.length < 2) {
        return {
          message: `Not enough data to calculate fuel analytics for vehicle ${vehicleId} in the last ${timeInSeconds} seconds.`,
          fuelFilled: 0,
          fuelUsed: 0,
        };
      }
    
      let fuelFilled = 0; 
      let fuelUsed = 0;   
    
      for (let i = 1; i < records.length; i++) {
        const previous = records[i - 1];
        const current = records[i];
    
        if (current.fuelLevel > previous.fuelLevel) {
          fuelFilled += current.fuelLevel - previous.fuelLevel;
        }
    
        if (current.fuelLevel < previous.fuelLevel) {
          const fuelDecrease = previous.fuelLevel - current.fuelLevel;
          fuelUsed += fuelDecrease;
        }
      }
    
      return {
        fuelFilled: Math.round(fuelFilled * 100) / 100, // 2 dec
        fuelUsed: Math.round(fuelUsed * 100) / 100,     
      };
    }
    
    async fleet_analitycs(id: string){
      const oneWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const vehicles = await this.db.vehicle.findMany({
        where: { fleetId: id },
        select: { id: true }, 
      });
      if (vehicles.length === 0) {
        return {
          totalDistance: 0,
        };
      }
      const vehicleIds = vehicles.map((vehicle) => vehicle.id);
      const totalDistance = await this.db.obd_fuel.aggregate({
        _sum: {
          distanceTraveled: true,
        },
        where: {
          vehicle_id: { in: vehicleIds },
          time: {
            gte: oneWeek, 
          },
        },
      });
      return {
        totalDistance: totalDistance._sum.distanceTraveled || 0
      }
    }

    async vehicleAnalytics(vehicleId: string){
      const records = await this.db.obd_fuel.findMany({
        where: { vehicle_id: vehicleId },
        orderBy: { time: 'asc' },
      });
      if (records.length < 2) {
        return {
          message: `Not enough data to calculate analytics for vehicle ${vehicleId}.`,
          totalDistance: 0,
          totalFuelUsed: 0,
        };
      }
      let totalDistance = 0;
      let totalFuelUsed = 0;
      for (let i = 1; i < records.length; i++) {
        const previous = records[i - 1];
        const current = records[i];
    
        if (current.distanceTraveled && previous.distanceTraveled) {
          totalDistance += current.distanceTraveled - previous.distanceTraveled;
        }
    
        if (current.fuelLevel && previous.fuelLevel) {
          totalFuelUsed += previous.fuelLevel - current.fuelLevel;
        }
      }
      return {
        message: `Analytics for vehicle ${vehicleId}.`,
        totalDistance: Math.round(totalDistance * 100) / 100,
        totalFuelUsed: Math.round(totalFuelUsed * 100) / 100,
      };
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

    async createRoute(vehicleId: string, routeData: Prisma.RoutesCreateInput) {
      const startingLocation = routeData.startingLocation as unknown as Location;
      const endingLocation = routeData.endingLocation as unknown as Location;
      const startCoords = `${startingLocation.longitude},${startingLocation.latitude}`;
      const endCoords = `${endingLocation.longitude},${endingLocation.latitude}`;

      const response = await axios.get(
        `https://api.openrouteservice.org/v2/directions/driving-car`,
        {
          params: {
            api_key: process.env.ORS_API_KEY,
            start: startCoords,
            end: endCoords,
          },
        }
      );
      
      const geojson = response.data;

      return await this.db.routes.create({
        data: {
          ...routeData,
          vehicle: { connect: { id: vehicleId } },
          geojson, 
          startingTime: new Date()
        },
      });
    }

    async changeCurrentRoute(vehicleId: string, routeId: string) {
        const updatedVehicle = await this.db.vehicle.update({
          where: { id: vehicleId },
          data: { currentRouteId: routeId },
        });
    
        return updatedVehicle;
    }
    
    async createViolation(data: Prisma.ViolationCreateInput){
      return await this.db.violation.create({data})
    }

    async getViolation(vehicleId: string){
      return await this.db.violation.findMany({
        where: { vehicleId },
        orderBy: { createdAt: 'desc' }, 
      });
    }

    async processRoute(routeId: string) {
      const route = await this.getRoute(routeId);
  
      if (!route) {
        throw new Error(`Route with ID ${routeId} not found`);
      }
  
      const geojsonCoordinates: [number, number][] =
        (route.geojson as any)?.features?.[0]?.geometry?.coordinates || [];
  
      const gpsCoordinates: [number, number][] = route.gps.map((gpsPoint) => [
        gpsPoint.latitude,
        gpsPoint.longitude,
      ]);
  
      const gpsDistance = gpsCoordinates.reduce((total, current, index) => {
        if (index === 0) return total; 
        return total + this.haversineDistance(gpsCoordinates[index - 1], current);
      }, 0);
  
      const geojsonDistance: number =
        (route.geojson as any)?.features?.[0]?.properties?.summary?.distance || 0;
  
      return {
        geojson: geojsonCoordinates,
        gps: gpsCoordinates,
        distances: {
          gpsDistance,
          geojsonDistance,
        },
      };
    }

    async getRoute(routeId: string){
      return await this.db.routes.findFirst({
        where: {id: routeId},
        include: {
          gps: {
            where: {
              isKey: true,
            },
          },
        },
      })
    }

    haversineDistance(coord1: number[], coord2: number[]): number {
      const toRadians = (deg: number) => (deg * Math.PI) / 180;
    
      const [lat1, lon1] = coord1;
      const [lat2, lon2] = coord2;
    
      const R = 6371e3; 
      const φ1 = toRadians(lat1);
      const φ2 = toRadians(lat2);
      const Δφ = toRadians(lat2 - lat1);
      const Δλ = toRadians(lon2 - lon1);
    
      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
      const distance = R * c; // Distance in meters
      return distance;
    }
    
    async createCounter(data: Prisma.CounterCreateInput){
      return await this.db.counter.create({data})
    }

    async getCounters(vehicleId: string){
      return await this.db.counter.findMany({where: {vehicleId}})
    }
}

interface Location {
  longitude: number;
  latitude: number;
}

