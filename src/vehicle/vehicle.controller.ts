import { Controller, Get, Post, Body } from "@nestjs/common";
import { VehicleService } from "./vehicle.service";
import { Prisma } from ".prisma/client";

@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  async createVehicle(@Body() data: Prisma.VehicleCreateInput) {
    return this.vehicleService.createVehicle(data);
  }

  @Get()
  async getVehicles() {
    return this.vehicleService.getVehicles();
  }

  @Post('request')
  async createRequest(@Body() data: Prisma.RequestCreateInput) {
    return this.vehicleService.createRequest(data);
  }

  @Get('requests')
  async getRequests() {
    return this.vehicleService.getRequests();
  }

  @Post('metric')
  async createMetric(@Body() data: Prisma.ObdCreateInput) {
    return this.vehicleService.createMetric(data);
  }

  @Get('metrics')
  async getMetrics() {
    return this.vehicleService.getMetrics();
  }

  @Post('gps')
  async createGps(@Body() data: Prisma.GpsCreateInput) {
    return this.vehicleService.createGps(data);
  }

  @Post('obd-fuel')
  async createObdFuel(@Body() data: Prisma.Obd_fuelCreateInput) {
    return this.vehicleService.createObdFuel(data);
  }

  @Post('obd-check')
  async createObdCheck(@Body() data: Prisma.Obd_checkCreateInput) {
    return this.vehicleService.createObdCheck(data);
  }

  @Get('obd-checks')
  async getObdChecks() {
    return this.vehicleService.getObdChecks();
  }

  @Get('obd-checks/latest')
  async getLatestObdCheck() {
    return this.vehicleService.getLatestObdCheck();
  }
}