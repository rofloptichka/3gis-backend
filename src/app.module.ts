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
import { InputModule } from './input/input.module'
import { FileModule } from './file/file.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

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
    InputModule,
    FileModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/files/static',
    }),
  ],
  controllers: [AppController, AuthController, UserController, VehicleController],
  providers: [AppService, DatabaseService],
  exports: [DatabaseService],
})
export class AppModule {}
