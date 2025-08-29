import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TwoFaSession, TwoFaSessionDocument } from '../../database/schemas/two-fa-session.schema';
import { AppLoggerService } from '../../common/logger';
import * as crypto from 'crypto';

export interface TwoFaSessionResult {
  sessionToken: string;
  expiresAt: Date;
}

@Injectable()
export class TwoFaService {
  constructor(
    @InjectModel(TwoFaSession.name)
    private twoFaSessionModel: Model<TwoFaSessionDocument>,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * Crée une session 2FA temporaire après validation des credentials
   */
  async createTwoFaSession(userId: string): Promise<TwoFaSessionResult> {
    // Générer un token de session sécurisé
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    // Supprimer les anciennes sessions pour cet utilisateur
    await this.twoFaSessionModel.deleteMany({ userId });

    // Créer la nouvelle session avec expiration de 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.twoFaSessionModel.create({
      userId,
      sessionToken,
      expiresAt,
      used: false,
    });

    return { sessionToken, expiresAt };
  }

  /**
   * Valide une session 2FA
   */
  async validateTwoFaSession(sessionToken: string): Promise<{ isValid: boolean; userId?: string; sessionDoc?: TwoFaSessionDocument }> {
    try {
      const sessionDoc = await this.twoFaSessionModel.findOne({
        sessionToken,
        used: false,
        expiresAt: { $gt: new Date() }
      });

      if (!sessionDoc) {
        return { isValid: false };
      }

      return {
        isValid: true,
        userId: sessionDoc.userId.toString(),
        sessionDoc
      };
    } catch (error) {
      this.logger.error('Error validating 2FA session', error, {
        module: 'TwoFaService',
        method: 'validateTwoFaSession',
        sessionToken
      });
      return { isValid: false };
    }
  }

  /**
   * Marque une session 2FA comme utilisée
   */
  async markSessionAsUsed(sessionDoc: TwoFaSessionDocument): Promise<void> {
    await this.twoFaSessionModel.findByIdAndUpdate(sessionDoc._id, {
      used: true,
    });
  }

  /**
   * Invalide toutes les sessions 2FA pour un utilisateur
   */
  async invalidateUserSessions(userId: string): Promise<void> {
    await this.twoFaSessionModel.updateMany(
      { userId, used: false },
      { used: true }
    );
  }

  /**
   * Nettoie les sessions expirées
   */
  async cleanupExpiredSessions(): Promise<void> {
    await this.twoFaSessionModel.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { used: true }
      ],
    });
  }
}
