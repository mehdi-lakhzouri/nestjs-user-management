import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto, RegisterWithAvatarDto, ForgotPasswordDto, ResetPasswordDto, RefreshTokenDto, VerifyOtpDto, LoginWithOtpDto, ChangePasswordDto } from './dto';
import { PasswordUtil } from '../../utils';
import { UserRole, UserDocument } from '../../database/schemas/user.schema';
import { AvatarService } from '../avatar/avatar.service';
import { EmailService } from '../email/email.service';
import { PasswordResetService } from './password-reset.service';
import { OtpService } from './otp.service';
import { TwoFaService } from './two-fa.service';
import { AppLoggerService } from '../../common/logger';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private avatarService: AvatarService,
    private emailService: EmailService,
    private passwordResetService: PasswordResetService,
    private otpService: OtpService,
    private twoFaService: TwoFaService,
    private readonly logger: AppLoggerService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { password, ...userData } = registerDto;
    
    // Ajouter le mot de passe aux données utilisateur
    const userDataWithPassword = {
      ...userData,
      password: password
    };
    
    const result = await this.usersService.create(userDataWithPassword, 'System Registration');
    const user = result.user;
    
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.usersService.addRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        age: user.age,
        gender: user.gender,
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt,
        mustChangePassword: false, // Les utilisateurs qui s'inscrivent eux-mêmes n'ont pas de mot de passe temporaire
      },
      ...tokens,
    };
  }

  async registerWithAvatar(registerDto: RegisterWithAvatarDto, file?: Express.Multer.File) {
    const { password, ...userData } = registerDto;
    
    let avatarUrl: string | undefined = undefined;
    
    // Si un fichier avatar est fourni, l'uploader
    if (file) {
      avatarUrl = await this.avatarService.saveFile(file);
    }
    
    // Créer l'utilisateur avec l'URL de l'avatar
    const userDataWithAvatar = {
      ...userData,
      avatar: avatarUrl,
    };
    
    try {
      // Mettre le mot de passe dans les données utilisateur pour create()
      const userDataWithPassword = {
        ...userDataWithAvatar,
        password: password
      };
      
      const result = await this.usersService.create(userDataWithPassword, 'Avatar Registration');
      const user = result.user;
      
      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.usersService.addRefreshToken(user.id, tokens.refreshToken);

      return {
        user: {
          id: user.id,
          fullname: user.fullname,
          email: user.email,
          role: user.role,
          age: user.age,
          gender: user.gender,
          avatar: user.avatar,
          isActive: user.isActive,
          createdAt: user.createdAt,
          mustChangePassword: false, // Les utilisateurs qui s'inscrivent eux-mêmes n'ont pas de mot de passe temporaire
        },
        ...tokens,
      };
    } catch (error) {
      // En cas d'erreur lors de la création de l'utilisateur, supprimer l'avatar uploadé
      if (avatarUrl) {
        await this.avatarService.deleteAvatar(avatarUrl);
      }
      throw error;
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;
    
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.usersService.findById(payload.sub);
      
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify refresh token exists in user's tokens
      const userWithTokens = await this.usersService.findByEmail(user.email, true);
      if (!userWithTokens || !userWithTokens.refreshTokens.includes(refreshToken)) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Remove old refresh token and generate new tokens
      await this.usersService.removeRefreshToken(user.id, refreshToken);
      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.usersService.addRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken: string) {
    await this.usersService.removeRefreshToken(userId, refreshToken);
    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string) {
    await this.usersService.clearAllRefreshTokens(userId);
    return { message: 'Logged out from all devices successfully' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    
    try {
      const user = await this.usersService.findByEmail(email);
      
      if (user) {
        // Générer un token de reset sécurisé
        const { token } = await this.passwordResetService.createResetToken(user.id);
        
        // Envoyer l'email de reset avec le token
        await this.emailService.sendPasswordResetEmail(email, token, user.fullname);
      }
      
      // Toujours retourner le même message pour des raisons de sécurité
      return { message: 'If the email exists, a reset link has been sent' };
    } catch (error) {
      // En cas d'erreur, on retourne quand même le message générique
      return { message: 'If the email exists, a reset link has been sent' };
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;
    
    // Valider le token avec le nouveau système
    const { isValid, userId, tokenDoc } = await this.passwordResetService.validateResetToken(token);
    
    if (!isValid || !userId || !tokenDoc) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Marquer le token comme utilisé
    await this.passwordResetService.markTokenAsUsed(tokenDoc);

    // Mettre à jour le mot de passe
    await this.usersService.updatePassword(userId, password);
    
    // Effacer tous les refresh tokens lors du reset password
    await this.usersService.clearAllRefreshTokens(userId);

    // Envoyer un email de confirmation
    try {
      const user = await this.usersService.findById(userId);
      if (user) {
        await this.emailService.sendPasswordChangedEmail(user.email, user.fullname);
      }
    } catch (error) {
      // L'erreur d'email ne doit pas empêcher le reset de fonctionner
      this.logger.warn('Failed to send password reset confirmation email', {
        module: 'AuthService',
        method: 'resetPassword',
        error: error.message
      });
    }

    return { message: 'Password reset successfully' };
  }

  // ===== NOUVELLE MÉTHODE 2FA =====

  async loginWithOtp(loginWithOtpDto: LoginWithOtpDto) {
    const { email, password } = loginWithOtpDto;
    
    this.logger.log(`🔄 Login with OTP attempt for: ${email}`);
    
    // Étape 1: Valider email + mot de passe
    const user = await this.usersService.findByEmail(email, true);
    
    if (!user || !user.isActive) {
      this.logger.warn(`❌ User not found or inactive: ${email}`);
      throw new UnauthorizedException('Invalid credentials or account inactive');
    }

    this.logger.log(`✅ User found: ${user.fullname}`);
    
    const isPasswordValid = await PasswordUtil.compare(password, user.password);
    
    if (!isPasswordValid) {
      this.logger.warn(`❌ Invalid password for: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`✅ Password valid for: ${email}`);

    // Étape 2: Credentials valides → Créer session 2FA et envoyer OTP
    this.logger.log(`🔄 Creating 2FA session for user: ${user.id}`);
    const { sessionToken, expiresAt } = await this.twoFaService.createTwoFaSession(user.id);
    
    this.logger.log(`🔄 Creating OTP for user: ${user.id}`);
    const { otp } = await this.otpService.createOtp(user.id, '2fa');
    
    this.logger.log(`📧 About to send OTP email to: ${email}, OTP: ${otp}`);
    // Envoyer l'OTP par email
    await this.emailService.sendOtpEmail(email, otp, user.fullname);
    this.logger.log(`✅ OTP process completed for: ${email}`);
    
    return { 
      message: 'Credentials validated. OTP sent to your email.',
      sessionToken,
      expiresAt: expiresAt.toISOString(),
      requiresOtp: true
    };
  }

  async verifyOtpAndCompleteLogin(verifyOtpDto: VerifyOtpDto) {
    const { email, otp, sessionToken } = verifyOtpDto;
    
    const user = await this.usersService.findByEmail(email);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials or account inactive');
    }

    // Si c'est un flow 2FA, valider la session
    if (sessionToken) {
      const { isValid, userId, sessionDoc } = await this.twoFaService.validateTwoFaSession(sessionToken);
      
      if (!isValid || userId !== user.id || !sessionDoc) {
        throw new UnauthorizedException('Invalid or expired session. Please start login again.');
      }

      // Valider l'OTP pour 2FA
      const { isValid: otpValid, error } = await this.otpService.validateOtp(user.id, otp, '2fa');
      
      if (!otpValid) {
        throw new UnauthorizedException(error || 'Invalid OTP');
      }

      // Marquer la session comme utilisée
      await this.twoFaService.markSessionAsUsed(sessionDoc);
    } else {
      // Flow OTP direct (sans mot de passe) - maintenir la compatibilité
      const { isValid, error } = await this.otpService.validateOtp(user.id, otp, 'login');
      
      if (!isValid) {
        throw new UnauthorizedException(error || 'Invalid OTP');
      }
    }

    // OTP valide - finaliser la connexion
    await this.usersService.updateLastLogin(user.id);
    
    // Vérifier si l'utilisateur doit changer son mot de passe
    const mustChangePassword = await this.usersService.mustChangePassword(user.id);
    
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.usersService.addRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        age: user.age,
        gender: user.gender,
        avatar: user.avatar,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        mustChangePassword,
      },
      ...tokens,
    };
  }

  private async generateTokens(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    // Vérifier que les nouveaux mots de passe correspondent
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas');
    }

    // Récupérer l'utilisateur avec son mot de passe
    const user = await this.usersService.findByEmail(
      (await this.usersService.findById(userId)).email, 
      true
    );

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await PasswordUtil.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      this.logger.warn('Failed password change attempt - incorrect current password', {
        module: 'AuthService',
        userId,
        email: user.email,
      });
      throw new BadRequestException('Mot de passe actuel incorrect');
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    const isSamePassword = await PasswordUtil.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('Le nouveau mot de passe doit être différent de l\'ancien');
    }

    // Vérifier si c'était un mot de passe temporaire avant la mise à jour
    const wasTemporary = await this.usersService.mustChangePassword(userId);

    // Mettre à jour le mot de passe
    await this.usersService.updatePassword(userId, newPassword);

    // Déconnecter de toutes les sessions pour sécurité
    await this.usersService.clearAllRefreshTokens(userId);

    // Envoyer email de confirmation
    try {
      await this.emailService.sendPasswordChangedEmail(user.email, user.fullname);
    } catch (emailError) {
      this.logger.error('Failed to send password change confirmation email', emailError, {
        module: 'AuthService',
        userId,
        email: user.email,
      });
      // Ne pas faire échouer le changement si l'email échoue
    }

    this.logger.info('Password changed successfully', {
      module: 'AuthService',
      userId,
      email: user.email,
      wasTemporary,
    });

    return {
      message: 'Mot de passe modifié avec succès. Toutes les sessions ont été déconnectées.',
      requiresRelogin: true,
    };
  }
}
