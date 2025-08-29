import { Module } from '@nestjs/common';
import { AvatarService } from './avatar.service';
import { AppLoggerService } from '../../common/logger';

@Module({
  providers: [AvatarService, AppLoggerService],
  exports: [AvatarService],
})
export class AvatarModule {}
