import { Module } from '@nestjs/common';
import { InputController } from './input.controller';
import { InputService } from './input.service';
import { VehicleModule } from '../vehicle/vehicle.module';
import { GpsModule } from '../gps/gps.module';

@Module({
  imports: [VehicleModule, GpsModule],
  controllers: [InputController],
  providers: [InputService],
})
export class InputModule {}