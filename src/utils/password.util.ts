import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

export class PasswordUtil {
  private static rounds = 12;

  static setRounds(configService: ConfigService) {
    this.rounds = configService.get<number>('bcrypt.rounds') || 12;
  }

  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.rounds);
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
