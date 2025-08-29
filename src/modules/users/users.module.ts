import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { AvatarModule } from '../avatar/avatar.module';
import { EmailModule } from '../email/email.module';
import { AppLoggerService } from '../../common/logger';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    AvatarModule,
    EmailModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, AppLoggerService],
  exports: [UsersService],
})
export class UsersModule {}
