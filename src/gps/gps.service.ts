import { Injectable } from "@nestjs/common";
import { Prisma } from ".prisma/client";
import { DatabaseService } from "../database/database.service";
import * as turf from '@turf/turf';
import { LineString } from "geojson";

@Injectable()
export class GpsService{
    constructor(private db: DatabaseService) {}
      
    isKeyPoint(previousGps, currentGps) {
        if (!previousGps) return true; 
      
        const bearing = this.calculateBearing(previousGps, currentGps);
        return Math.abs(bearing) > 15; 
    }
  
    calculateBearing(point1, point2) {
        const lat1 = (point1.latitude * Math.PI) / 180;
        const lat2 = (point2.latitude * Math.PI) / 180;
        const deltaLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
      
        const y = Math.sin(deltaLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
      
        let bearing = Math.atan2(y, x);
        bearing = (bearing * 180) / Math.PI; 
        return (bearing + 360) % 360; 
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
  
    async updateVehicleLocation(vehicleId: string, locationId: string, timestamp: Date) {    
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
          where: { vehicleId, isKey: false },
        });
      
        if (gpsCount > limit) {
          const oldestGps = await this.db.gps.findMany({
            where: { vehicleId, isKey: false},
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
      
        return isIdle && locationChange < 5; 
    }
  
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
      
        return R * c; 
    }
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
  