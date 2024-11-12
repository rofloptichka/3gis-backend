import { ConflictException, Injectable } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from 'src/database/database.service';
import { RegistrationRequestDto } from "./auth.types";
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService{
    constructor(
        private readonly jwtService: JwtService,
        private readonly db: DatabaseService,
    ) {}

    public async registerUser(registerDto: RegistrationRequestDto) {
        const userCheck = await this.db.user.findFirst({
          where: { email: registerDto.email },
        });
        if (userCheck) {
          throw new ConflictException(
            `User with email: ${registerDto.email} already exists`,
          );
        }
    
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(registerDto.password, salt);
    
        const user = await this.db.user.create({
          data: {
            email: registerDto.email,
            password: passwordHash,
            name: registerDto.name,
            role: 'USER',
          },
        });
    
        return { ...user };
      }
}