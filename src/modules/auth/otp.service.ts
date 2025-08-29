import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp, OtpDocument } from '../../database/schemas/otp.schema';
import { PasswordUtil } from '../../utils';
import { AppLoggerService } from '../../common/logger';
import * as crypto from 'crypto';

export interface OtpValidationResult {
  isValid: boolean;
  otpDoc?: OtpDocument;
  error?: string;
}

@Injectable()
export class OtpService {
  constructor(
    @InjectModel(Otp.name)
    private otpModel: Model<OtpDocument>,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * Génère un code OTP sécurisé à 6 chiffres
   */
  private generateSecureOtp(): string {
    // Utiliser crypto.randomInt pour garantir la sécurité cryptographique
    let otp = '';
    for (let i = 0; i < 6; i++) {
      otp += crypto.randomInt(0, 10).toString();
    }
    return otp;
  }

  /**
   * Crée un nouvel OTP pour un utilisateur
   */
  async createOtp(userId: string, type: 'login' | 'password-reset' | '2fa' = 'login'): Promise<{ otp: string; otpHash: string }> {
    // Générer un OTP sécurisé
    const otp = this.generateSecureOtp();
    const otpHash = await PasswordUtil.hash(otp);

    // Supprimer les anciens OTPs non utilisés pour cet utilisateur et ce type
    await this.otpModel.deleteMany({ 
      userId, 
      type,
      used: false 
    });

    // Créer le nouvel OTP avec expiration de 4 minutes
    const expiresAt = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes

    await this.otpModel.create({
      userId,
      otpHash,
      expiresAt,
      attempts: 3,
      used: false,
      type,
    });

    return { otp, otpHash };
  }

  /**
   * Valide un code OTP fourni par l'utilisateur
   */
  async validateOtp(userId: string, providedOtp: string, type: 'login' | 'password-reset' | '2fa' = 'login'): Promise<OtpValidationResult> {
    try {
      // Rechercher l'OTP actif pour cet utilisateur
      const otpDoc = await this.otpModel.findOne({
        userId,
        type,
        used: false,
        expiresAt: { $gt: new Date() },
        attempts: { $gt: 0 }
      });

      if (!otpDoc) {
        return {
          isValid: false,
          error: 'No valid OTP found. Please request a new one.'
        };
      }

      // Vérifier si l'OTP correspond
      const isMatch = await PasswordUtil.compare(providedOtp, otpDoc.otpHash);

      if (!isMatch) {
        // Décrémenter le nombre d'essais restants
        otpDoc.attempts -= 1;
        await otpDoc.save();

        if (otpDoc.attempts <= 0) {
          // Marquer comme utilisé si plus d'essais
          otpDoc.used = true;
          await otpDoc.save();
          
          return {
            isValid: false,
            error: 'Maximum attempts reached. Please request a new OTP.'
          };
        }

        return {
          isValid: false,
          error: `Invalid OTP. ${otpDoc.attempts} attempts remaining.`
        };
      }

      // OTP valide - le marquer comme utilisé
      otpDoc.used = true;
      await otpDoc.save();

      return {
        isValid: true,
        otpDoc
      };

    } catch (error) {
      this.logger.error('Error validating OTP', error, {
        module: 'OtpService',
        method: 'validateOtp',
        userId,
        type
      });
      return {
        isValid: false,
        error: 'OTP validation failed. Please try again.'
      };
    }
  }

  /**
   * Invalide tous les OTPs actifs pour un utilisateur
   */
  async invalidateUserOtps(userId: string, type?: 'login' | 'password-reset' | '2fa'): Promise<void> {
    const query: any = { userId, used: false };
    if (type) {
      query.type = type;
    }

    await this.otpModel.updateMany(query, { used: true });
  }

  /**
   * Nettoie les OTPs expirés et utilisés
   */
  async cleanupExpiredOtps(): Promise<void> {
    await this.otpModel.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { used: true },
        { attempts: { $lte: 0 } }
      ],
    });
  }

  /**
   * Obtient des statistiques sur les OTPs pour monitoring
   */
  async getOtpStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    used: number;
  }> {
    const now = new Date();
    
    const [total, active, expired, used] = await Promise.all([
      this.otpModel.countDocuments({}),
      this.otpModel.countDocuments({
        used: false,
        expiresAt: { $gt: now },
        attempts: { $gt: 0 }
      }),
      this.otpModel.countDocuments({
        expiresAt: { $lte: now }
      }),
      this.otpModel.countDocuments({
        used: true
      })
    ]);

    return { total, active, expired, used };
  }
}
