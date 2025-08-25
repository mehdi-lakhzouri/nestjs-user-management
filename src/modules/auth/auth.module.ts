import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { AvatarModule } from '../avatar/avatar.module';
import { EmailModule } from '../email/email.module';
import { PasswordResetService } from './password-reset.service';
import { OtpService } from './otp.service';
import { TwoFaService } from './two-fa.service';
import { PasswordResetToken, PasswordResetTokenSchema } from '../../database/schemas/password-reset-token.schema';
import { Otp, OtpSchema } from '../../database/schemas/otp.schema';
import { TwoFaSession, TwoFaSessionSchema } from '../../database/schemas/two-fa-session.schema';
import { getJwtConfig } from '../../config/jwt.config';

@Module({
  imports: [
    UsersModule,
    AvatarModule,
    EmailModule,
    PassportModule,
    MongooseModule.forFeature([
      { name: PasswordResetToken.name, schema: PasswordResetTokenSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: TwoFaSession.name, schema: TwoFaSessionSchema },
    ]),
    JwtModule.registerAsync({
      useFactory: getJwtConfig,
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PasswordResetService, OtpService, TwoFaService],
  exports: [AuthService, PasswordResetService, OtpService, TwoFaService],
})
export class AuthModule {}
