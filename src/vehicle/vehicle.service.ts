import { Injectable } from "@nestjs/common";
import { DatabaseService } from 'src/database/database.service';
import { Prisma, Vehicle } from ".prisma/client/default";
import axios from "axios";
import * as turf from '@turf/turf';
import { LineString } from "geojson";


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

    async createGps(data: Prisma.GpsCreateInput) {
      const previousGps = await this.getPreviousGps(data.vehicleId);
      const calculatedSpeed = this.calculateSpeed(previousGps, data);
    
      const isWithinRoute = await this.checkIfWithinRoute(data.vehicleId, data.latitude, data.longitude);
      const isIdle = await this.checkIdleState(data.vehicleId, 5*60, 5);

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
          description: `Vehicle ${data.vehicleId} has been idle for more than 5 minutes.`,
          context: { lastKnownLocation: { latitude: data.latitude, longitude: data.longitude } },
        })
      }
      if (calculatedSpeed > 90) {
        await this.createViolation({
          vehicle: { connect: { id: data.vehicleId } },
          type: 'SPEEDING',
          description: `Vehicle ${data.vehicleId} exceeded the speed limit of 90 km/h.`,
          context: { speed: calculatedSpeed, location: { latitude: data.latitude, longitude: data.longitude } },
        });
      }
    
      const newGps = await this.db.gps.create({
        data: { ...data, speed: calculatedSpeed },
      });
    
      if (data.vehicleId) {
        await this.updateVehicleLocation(data.vehicleId, newGps.id, newGps.timestamp, isWithinRoute);
        await this.enforceGpsRecordLimit(data.vehicleId, 10);
      }
    
      return newGps;
    }
    
    async getPreviousGps(vehicleId?: string) {
      if (!vehicleId) return null;
    
      return await this.db.gps.findFirst({
        where: { vehicleId },
        orderBy: { timestamp: 'desc' },
      });
    }

    calculateSpeed(previousGps: any, currentGps: Prisma.GpsCreateInput) {
      if (!previousGps) return null;
    
      const distance = this.calculateDistance(
        previousGps.latitude,
        previousGps.longitude,
        currentGps.latitude,
        currentGps.longitude
      );
    
      const timeDifference =
        (new Date(currentGps.timestamp).getTime() - new Date(previousGps.timestamp).getTime()) / 1000; 
    
      return timeDifference > 0 ? (distance / timeDifference) * 3.6 : null; 
    }

    async checkIfWithinRoute(vehicleId: string | undefined, latitude: number, longitude: number) {
      if (!vehicleId) return true;
    
      const vehicle = await this.db.vehicle.findUnique({
        where: { id: vehicleId },
        include: { currentRoute: true },
      });
    
      if (!vehicle?.currentRoute?.geojson) return true;
    
      const geojson = vehicle.currentRoute.geojson as never as GeoJSON;
    
      const routeFeature = geojson.features[0];
    
      if (!routeFeature || !this.isLineString(routeFeature.geometry)) {
        throw new Error("Invalid GeoJSON: Route geometry is not a LineString");
      }
    
      const point = turf.point([longitude, latitude]);
    
      return turf.booleanPointOnLine(point, routeFeature.geometry);
    }

    isLineString(geometry: any): geometry is LineString {
      return geometry?.type === "LineString" && Array.isArray(geometry.coordinates);
    }

    async updateVehicleLocation(vehicleId: string, locationId: string, timestamp: Date, isWithinRoute: boolean) {    
      await this.db.vehicle.update({
        where: { id: vehicleId },
        data: {
          locationId,
          location_time: timestamp,
        },
      });
    }

    async enforceGpsRecordLimit(vehicleId: string, limit: number) {
      const gpsCount = await this.db.gps.count({
        where: { vehicleId },
      });
    
      if (gpsCount > limit) {
        const oldestGps = await this.db.gps.findMany({
          where: { vehicleId },
          orderBy: { timestamp: 'asc' },
          take: 1, 
        });
    
        if (oldestGps.length > 0) {
          await this.db.gps.delete({
            where: { id: oldestGps[0].id },
          });
        }
      }
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

    async createRoute(vehicleId: string, routeData: Prisma.RoutesCreateInput) {
      const startingLocation = routeData.startingLocation as unknown as Location;
      const endingLocation = routeData.endingLocation as unknown as Location;
      const startCoords = `${startingLocation.longitude},${startingLocation.latitude}`;
      const endCoords = `${endingLocation.longitude},${endingLocation.latitude}`;

      const response = await axios.get(
        `https://api.openrouteservice.org/v2/directions/driving-car`,
        {
          params: {
            api_key: process.env.OPENROUTESERVICE_API_KEY,
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
        },
      });
    }

    async changeCurrentRoute(vehicleId: string, routeId: number) {
        const updatedVehicle = await this.db.vehicle.update({
          where: { id: vehicleId },
          data: { currentRouteId: routeId },
        });
    
        return updatedVehicle;
    }
    
    async checkIdleState(vehicleId: string, timeThreshold: number, speedThreshold: number) {
      const recentGpsData = await this.db.gps.findMany({
        where: { vehicleId },
        orderBy: { timestamp: 'desc' },
        take: 10, 
      });
    
      if (recentGpsData.length < 2) return false; 
    
      const isIdle = recentGpsData.every(
        (gps) => gps.speed !== null && gps.speed < speedThreshold
      );
    
      const locationChange = recentGpsData.reduce((total, current, index, array) => {
        if (index === 0) return total;
        const prev = array[index - 1];
        const distance = this.calculateDistance(
          prev.latitude,
          prev.longitude,
          current.latitude,
          current.longitude
        );
        return total + distance;
      }, 0);
    
      return isIdle && locationChange < 0.05; 
    }

    // Haversine distance
    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371e3; 
      const f1 = (lat1 * Math.PI) / 180;
      const f2 = (lat2 * Math.PI) / 180;
      const delt_f = ((lat2 - lat1) * Math.PI) / 180;
      const delt_l = ((lon2 - lon1) * Math.PI) / 180;
    
      const a =
        Math.sin(delt_f / 2) * Math.sin(delt_f / 2) +
        Math.cos(f1) * Math.cos(f2) * Math.sin(delt_l / 2) * Math.sin(delt_l / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
      return R * c; // meters
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
}

interface Location {
  longitude: number;
  latitude: number;
}

interface GeoJSON {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "LineString" | "Polygon";
      coordinates: number[][] | number[][][];
    };
    properties?: Record<string, any>;
  }>;
}
