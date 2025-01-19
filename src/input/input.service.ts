import { Injectable } from '@nestjs/common';
import { VehicleService } from '../vehicle/vehicle.service';
import { GpsService } from '../gps/gps.service';

@Injectable()
export class InputService {
  constructor(
    private readonly vehicleService: VehicleService,
    private readonly gpsService: GpsService,
  ) {}

  async processInput(data: any) {

    //check if vehicle exists
    let vehicle = await this.vehicleService.getVehicleById(data.vehicleId);
    if (!vehicle) {
      //create the vehicle if it doesn't exist
      vehicle = await this.vehicleService.createVehicle({
        id: data.vehicleId,
        licensePlate: data.licensePlate,
        vehicleType: data.vehicleType,
        location_time: data.location_time,
        obd: data.obd,
        currentMission: data.currentMission,
        //need to add other fields if JSON will have them
      });
    }

    // create gps && upd vehicle location && delete old GPS locations if it exceeded 20 
    if (data.gps) {
      const newGps = await this.vehicleService.createGps(data.gps, data.currentRoute?.id);
      if (data.vehicleId) {
        await this.gpsService.updateVehicleLocation(data.vehicleId, newGps.id, newGps.timestamp);
        await this.gpsService.enforceGpsRecordLimit(data.vehicleId, 20);
      }
    }

    // Obd create metric and fuel
    if (data.obd) {
      await this.vehicleService.createMetric(data.obd);
      await this.vehicleService.createObdFuel(data.obd);
    }

    //violations creation
    if (data.violations) {
      for (const violation of data.violations) {
        await this.vehicleService.createViolation(violation);
      }
    }

    //counters creation
    if (data.counters) {
      for (const counter of data.counters) {
        await this.vehicleService.createCounter(counter);
      }
    }

  }
}