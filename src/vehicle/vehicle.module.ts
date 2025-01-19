import { Module } from "@nestjs/common";
import { VehicleService } from "./vehicle.service";
import { GpsService } from "../gps/gps.service";
import { GpsModule } from "../gps/gps.module";



@Module({
    imports: [GpsModule],
    providers: [VehicleService],
    exports: [VehicleService]
})
export class VehicleModule {}