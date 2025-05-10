import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsArray } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsString()
  companyId: string;

  @IsArray()
  @IsString({ each: true })
  departments: any[];
}
