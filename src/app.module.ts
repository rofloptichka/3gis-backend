import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './database/database.module';
import { DatabaseService } from './database/database.service';
import { AuthController } from './auth/auth.controller';
import { UserController } from './user/user.controller';
import { VehicleModule } from './vehicle/vehicle.module';
import { VehicleController } from './vehicle/vehicle.controller';
import { GpsModule } from './gps/gps.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    DatabaseModule,
    VehicleModule,
    GpsModule,
  ],
  controllers: [AppController, AuthController, UserController, VehicleController],
  providers: [AppService, DatabaseService],
  exports: [DatabaseService],
})
export class AppModule {}
