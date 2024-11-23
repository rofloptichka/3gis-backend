import { Module } from "@nestjs/common";
import { VehicleService } from "./vehicle.service";
import { GpsService } from "src/gps/gps.service";
import { GpsModule } from "src/gps/gps.module";



@Module({
    imports: [GpsModule],
    providers: [VehicleService],
    exports: [VehicleService]
})
export class VehicleModule {}