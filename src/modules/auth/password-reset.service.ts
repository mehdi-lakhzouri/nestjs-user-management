import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PasswordResetToken,
  PasswordResetTokenDocument,
} from '../../database/schemas/password-reset-token.schema';
import { PasswordUtil } from '../../utils';
import { AppLoggerService } from '../../common/logger';
import * as crypto from 'crypto';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectModel(PasswordResetToken.name)
    private passwordResetTokenModel: Model<PasswordResetTokenDocument>,
    private readonly logger: AppLoggerService,
  ) {}

  async createResetToken(
    userId: string,
  ): Promise<{ token: string; hashedToken: string }> {
    // Générer un token sécurisé
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = await PasswordUtil.hash(token);

    // Supprimer les anciens tokens de reset pour cet utilisateur
    await this.passwordResetTokenModel.deleteMany({ userId });

    // Créer le nouveau token avec expiration de 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await this.passwordResetTokenModel.create({
      userId,
      tokenHash: hashedToken,
      expiresAt,
      used: false,
    });

    return { token, hashedToken };
  }

  async validateResetToken(token: string): Promise<{
    isValid: boolean;
    userId?: string;
    tokenDoc?: PasswordResetTokenDocument;
  }> {
    try {
      // Récupérer tous les tokens non expirés et non utilisés
      const tokens = await this.passwordResetTokenModel.find({
        expiresAt: { $gt: new Date() },
        used: false,
      });

      // Vérifier chaque token hashé
      for (const tokenDoc of tokens) {
        const isMatch = await PasswordUtil.compare(token, tokenDoc.tokenHash);
        if (isMatch) {
          return {
            isValid: true,
            userId: tokenDoc.userId.toString(),
            tokenDoc,
          };
        }
      }

      return { isValid: false };
    } catch (error) {
      this.logger.error('Error validating reset token', error, {
        module: 'PasswordResetService',
        method: 'validateResetToken',
      });
      return { isValid: false };
    }
  }

  async markTokenAsUsed(tokenDoc: PasswordResetTokenDocument): Promise<void> {
    await this.passwordResetTokenModel.findByIdAndUpdate(tokenDoc._id, {
      used: true,
    });
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.passwordResetTokenModel.deleteMany({
      $or: [{ expiresAt: { $lt: new Date() } }, { used: true }],
    });
  }
}
