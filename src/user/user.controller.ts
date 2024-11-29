import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { UserService } from "./user.service";
import { Prisma } from ".prisma/client";

@Controller("user")
export class UserController{
    constructor(
        private readonly userService: UserService
    ) {}

    @Put(":id/role")
    async updateRole(
        @Param("id") id: string, 
        @Body() body: Prisma.UserCreateInput
    ){
        try{
            const newUser = await this.userService.updateUser(id, body)
            return newUser
        }catch(err){
            throw err 
        }
    }

    @Get("")
    async getAllUsers(){
        try{
            const users = await this.userService.getAllUsers()
            return users 
        }catch(err){
            throw err 
        }
    }

    @Post("fleet")
    async createFleet(
        @Body() data: Prisma.VehicleFleetCreateInput
    ){
        try{
            return await this.userService.createFleet(data)
        }catch(err){
            throw err 
        }
    }

    @Get("fleet/:fleetId")
    async getFleet(
        @Param("fleetId") fleetId: string 
    ){
        try{
            return await this.userService.getFleet(fleetId)
        }catch(err){
            throw err 

        }
    }


}