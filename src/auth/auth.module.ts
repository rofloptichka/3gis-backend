import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { AuthService } from "./auth.service";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "./guards/jwt.guard";


@Module({
    imports: [
      PassportModule,
      JwtModule.register({
        global: true,
        secret: process.env.JWT_KEY,
      }),
    ],
    controllers: [AuthController],
    providers: [
      JwtStrategy,
      AuthService,
    ],
    exports: [AuthService],
  })
  export class AuthModule {}