import { ConfigService } from '@nestjs/config';

export interface LoggerConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  enableConsole: boolean;
  enableFile: boolean;
  logDirectory: string;
  maxFileSize: string;
  maxFiles: number;
  format: 'json' | 'simple';
}

export const getLoggerConfig = (configService: ConfigService): LoggerConfig => {
  const environment = configService.get<string>('NODE_ENV', 'development');

  const defaultConfig: LoggerConfig = {
    level: 'info',
    enableConsole: true,
    enableFile: false,
    logDirectory: './logs',
    maxFileSize: '10m',
    maxFiles: 5,
    format: 'json',
  };

  // Configuration pour la production
  if (environment === 'production') {
    return {
      level: 'warn',
      enableConsole: false,
      enableFile: true,
      logDirectory: '/var/log/user-management',
      maxFileSize: '50m',
      maxFiles: 10,
      format: 'json',
    };
  }

  // Configuration pour les tests
  if (environment === 'test') {
    return {
      level: 'error',
      enableConsole: false,
      enableFile: false,
      logDirectory: './test-logs',
      maxFileSize: '5m',
      maxFiles: 2,
      format: 'json',
    };
  }

  return defaultConfig;
};
