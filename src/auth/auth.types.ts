import { ApiProperty } from '@nestjs/swagger';
import { MinLength, MaxLength, IsNotEmpty, IsString } from 'class-validator';


export class LoginUserRequestDto {
    @ApiProperty()
    @IsString()
    email: string;
    @ApiProperty()
    password: string;
}

export class RegistrationRequestDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;
  
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    email: string;
  
    @ApiProperty()
    @MinLength(6)
    @MaxLength(20)
    @IsNotEmpty()
    password: string;
  }