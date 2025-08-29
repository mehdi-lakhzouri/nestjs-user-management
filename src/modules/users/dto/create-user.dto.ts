import { IsEmail, IsNotEmpty, IsString, IsEnum, IsNumber, Min, Max, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, UserRole } from '../../../database/schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({ description: 'Full name of the user' })
  @IsNotEmpty()
  @IsString()
  fullname: string;

  @ApiProperty({ description: 'Age of the user', minimum: 1, maximum: 120 })
  @IsNumber()
  @Min(1)
  @Max(120)
  age: number;

  @ApiProperty({ description: 'Gender of the user', enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ description: 'Email address of the user' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ 
    description: 'Password for the user (if not provided, a temporary password will be generated and sent by email)' 
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  password?: string;

  @ApiPropertyOptional({ description: 'Role of the user', enum: UserRole, default: UserRole.USER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: 'User active status', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
