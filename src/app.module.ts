import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule, UsersModule } from './modules';
import { EmailModule } from './modules/email/email.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AllExceptionsFilter } from './common/filters';
import { AppLoggerService } from './common/logger';
import { LoggingInterceptor } from './common/interceptors';
import { RequestIdMiddleware } from './common/middleware';
import { getDatabaseConfig } from './config/database.config';
import appConfig from './config/app.config';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, configuration],
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    EmailModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppLoggerService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes('*');
  }
}
