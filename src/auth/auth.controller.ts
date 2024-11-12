import { Body, ConflictException, Controller, Post, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegistrationRequestDto } from "./auth.types";



@Controller("auth")
export class AuthController{
    constructor(
        private readonly authService: AuthService
     ) {}

    @Post('register')
    async registerUser(
        @Req() req,
        @Body() userData: RegistrationRequestDto,
    ){
        try {
            const newUser = await this.authService.registerUser(userData);
            // const refreshToken = this.authService.generateRefreshToken(newUser);
            // const accessToken = this.authService.generateAccessToken(newUser);

            // await this.authService.saveRefreshToken(newUser, refreshToken);
            // this.authService.setTokenCookies(req.res, { accessToken, refreshToken });

            return newUser;
        } catch (error: any) {
            throw error;
        }
    }
}