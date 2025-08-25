import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PasswordResetService } from '../auth/password-reset.service';
import { OtpService } from '../auth/otp.service';
import { TwoFaService } from '../auth/two-fa.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private passwordResetService: PasswordResetService,
    private otpService: OtpService,
    private twoFaService: TwoFaService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTokens() {
    this.logger.log('Running cleanup of expired password reset tokens...');
    try {
      await this.passwordResetService.cleanupExpiredTokens();
      this.logger.log('Cleanup of expired password reset tokens completed successfully');
    } catch (error) {
      this.logger.error('Failed to cleanup expired password reset tokens:', error);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async cleanupExpiredOtps() {
    this.logger.log('Running cleanup of expired OTPs...');
    try {
      await this.otpService.cleanupExpiredOtps();
      this.logger.log('Cleanup of expired OTPs completed successfully');
    } catch (error) {
      this.logger.error('Failed to cleanup expired OTPs:', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTwoFaSessions() {
    this.logger.log('Running cleanup of expired 2FA sessions...');
    try {
      await this.twoFaService.cleanupExpiredSessions();
      this.logger.log('Cleanup of expired 2FA sessions completed successfully');
    } catch (error) {
      this.logger.error('Failed to cleanup expired 2FA sessions:', error);
    }
  }
}
