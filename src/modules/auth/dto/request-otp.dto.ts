import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({ description: 'Email address for OTP login' })
  @IsEmail()
  email: string;
}
