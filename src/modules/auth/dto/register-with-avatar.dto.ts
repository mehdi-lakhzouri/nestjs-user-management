import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '../../../database/schemas/user.schema';

export class RegisterWithAvatarDto {
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

  @ApiProperty({ description: 'Password (minimum 8 characters)', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
