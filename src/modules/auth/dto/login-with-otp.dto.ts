import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginWithOtpDto {
  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password' })
  @IsString()
  password: string;
}
