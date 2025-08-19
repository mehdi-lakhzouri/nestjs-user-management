import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export const getJwtConfig = (configService: ConfigService): JwtModuleOptions => ({
  secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
  signOptions: {
    expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '15m',
  },
});

export const getJwtRefreshConfig = (configService: ConfigService): JwtModuleOptions => ({
  secret: configService.get<string>('JWT_REFRESH_SECRET') || 'your-refresh-secret-key',
  signOptions: {
    expiresIn: configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
  },
});
