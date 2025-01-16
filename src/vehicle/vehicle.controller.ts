import { Controller, Get, Post, Body, Put, Param, HttpException, HttpStatus, Query } from "@nestjs/common";
import { VehicleService } from "./vehicle.service";
import { Prisma } from ".prisma/client";
import { get } from "http";

@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  async createVehicle(@Body() data: Prisma.VehicleCreateInput) {
    try {
      return await this.vehicleService.createVehicle(data);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get()
  async getVehicles() {
    try {
      return await this.vehicleService.getVehicles();
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post('request')
  async createRequest(@Body() data: Prisma.RequestCreateInput) {
    try {
      return await this.vehicleService.createRequest(data);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get('requests')
  async getRequests() {
    try {
      return await this.vehicleService.getRequests();
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post('metric')
  async createMetric(@Body() data: Prisma.ObdCreateInput) {
    try {
      return await this.vehicleService.createMetric(data);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get('metrics')
  async getMetrics() {
    try {
      return await this.vehicleService.getMetrics();
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post('gps/:routeId')
  async createGps(@Body() data: Prisma.GpsCreateInput, @Param("routeId") routeId: string ) {
    try {
      console.log(routeId)
      return await this.vehicleService.createGps(data, routeId);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post('obd-fuel')
  async createObdFuel(@Body() data: Prisma.Obd_fuelCreateInput) {
    try {
      return await this.vehicleService.createObdFuel(data);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get("fleet/:fleetId")
  async getFleetAnalytics(
    @Param("fleetId") fleetId: string 

  ){
    try{
      return await this.vehicleService.fleet_analitycs(fleetId)
    }catch(err){
      this.handleError(err)
    }
  }

  @Get("vehicle/:vehicleId")
  async getVehicleAnalytics(
    @Param("vehicleId") vehicleId: string 
  ){
    try{
      return await this.vehicleService.vehicleAnalytics(vehicleId)
    }catch(err){
      this.handleError(err)
    }
  }

  @Get("obd-fuel/:vehicleId")
  async getFuelAnalytics(
    @Param("vehicleId") vehicleId: string,
    @Query("time") time?: number
  ){
    try{
      const timeInSeconds = time ? parseInt(time.toString(), 10) : 3600; 
      return await this.vehicleService.fuel_analytics(vehicleId,timeInSeconds)
    }catch(err){
      this.handleError(err)
    }
  }

  @Post('obd-check')
  async createObdCheck(@Body() data: Prisma.Obd_checkCreateInput) {
    try {
      return await this.vehicleService.createObdCheck(data);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get('obd-checks')
  async getObdChecks() {
    try {
      return await this.vehicleService.getObdChecks();
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get('obd-checks/latest')
  async getLatestObdCheck() {
    try {
      return await this.vehicleService.getLatestObdCheck();
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post('route/:vehicleId')
  async updateCurrentRoute(
    @Body() data: Prisma.RoutesCreateInput,
    @Param("vehicleId") vehicleId: string 
  ) {
    try {
      return await this.vehicleService.createRoute(vehicleId, data);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Put('route/:vehicleId/:routeId')
  async changeRoute(
    @Param("vehicleId") vehicleId: string ,
    @Param("routeId") routeId: string  
  ){
    try{
      return await this.vehicleService.changeCurrentRoute(vehicleId, routeId)
    }catch (err){
      this.handleError(err)
    }
  }

  @Get('route/:routeId')
  async getRoute(
    @Param("routeId") routeId: string 
  ){
    try{
      return await this.vehicleService.processRoute(routeId);
    }catch(err){
      this.handleError(err)
    }
  }


  @Get("violations/:vehicleId")
  async getViolations(
    @Param("vehicleId") vehicleId: string 
  ){
    try{
      return await this.vehicleService.getViolation(vehicleId)
    }catch (err){
      this.handleError(err)
    }
  }

  @Post("counter")
  async createCounter(
    @Body() data: Prisma.CounterCreateInput
  ){
    try{
      return await this.vehicleService.createCounter(data)
    }catch(err){
      this.handleError(err)
    }
  }

  @Get("counter/:vehicleId")
  async getCounters(
    @Param("vehicleId") vehicleId: string 
  ){
    try{
      return await this.vehicleService.getCounters(vehicleId)
    }catch(err){
      this.handleError(err)
    }
  }

  @Post("violation")
  async createViolation(
    @Body() data: Prisma.ViolationCreateInput
  ){
    try{
      return await this.vehicleService.createViolation(data)
    }catch(err){
      this.handleError(err)
    }
  }


  private handleError(error: any): void {
    console.error('Error:', error.message); 
    if (error instanceof HttpException) {
      throw error; 
    }
    if (error.code === 'P2002') {
      throw new HttpException('Duplicate entry', HttpStatus.CONFLICT);
    }
    console.error(error)
    throw new HttpException(error.message || 'Bad Request', HttpStatus.BAD_REQUEST);
  }
}
