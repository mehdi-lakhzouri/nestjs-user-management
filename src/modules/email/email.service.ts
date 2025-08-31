import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Vérifier la configuration SMTP
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('SMTP configuration error:', error);
      } else {
        this.logger.log('SMTP server is ready to take our messages');
      }
    });
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    fullname: string,
  ): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"User Management App" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; width: 100% !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f4f4f7; color: #333; }
          .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }
          .content { padding: 40px; text-align: center; }
          h1 { font-size: 24px; font-weight: 600; color: #1a1a1a; margin: 0 0 20px; }
          p { font-size: 16px; line-height: 1.6; color: #555; margin: 0 0 30px; }
          .button { display: inline-block; padding: 14px 28px; background-color: #1E90FF; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #888; }
          .link { word-break: break-all; color: #1E90FF; }
        </style>
      </head>
      <body>
        <table width="100%" border="0" cellspacing="0" cellpadding="20" style="background-color:#f4f4f7;">
          <tr>
            <td>
              <div class="container">
                <div class="content">
                  <h1>Réinitialisation de mot de passe</h1>
                  <p>Bonjour ${fullname},</p>
                  <p>Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en définir un nouveau.</p>
                  <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
                  <p style="margin-top: 30px; font-size: 14px; color: #777;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.</p>
                </div>
                <div class="footer">
                  <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br><a href="${resetUrl}" class="link">${resetUrl}</a></p>
                  <p>© ${new Date().getFullYear()} User Management App. Tous droits réservés.</p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `,
      text: `
        Bonjour ${fullname},
        
        Nous avons reçu une demande de réinitialisation de votre mot de passe.
        
        Cliquez sur ce lien pour créer un nouveau mot de passe : ${resetUrl}
        
        Ce lien est valide pendant 30 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.
        
        Cordialement,
        L'équipe User Management App
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}:`,
        error,
      );
      throw new Error('Failed to send reset email');
    }
  }

  async sendOtpEmail(
    email: string,
    otp: string,
    fullname: string,
  ): Promise<void> {
    this.logger.log(`🔄 Attempting to send OTP email to: ${email}`);

    const mailOptions = {
      from: `"User Management App" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: 'Votre code de connexion unique',
      html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; width: 100% !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f4f4f7; color: #333; }
          .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }
          .content { padding: 40px; text-align: center; }
          h1 { font-size: 24px; font-weight: 600; color: #1a1a1a; margin: 0 0 20px; }
          p { font-size: 16px; line-height: 1.6; color: #555; margin: 0 0 30px; }
          .otp-code { display: inline-block; background-color: #f4f4f7; padding: 15px 30px; border-radius: 6px; font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #1E90FF; margin-bottom: 30px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <table width="100%" border="0" cellspacing="0" cellpadding="20" style="background-color:#f4f4f7;">
          <tr>
            <td>
              <div class="container">
                <div class="content">
                  <h1>Votre code de connexion</h1>
                  <p>Bonjour ${fullname},</p>
                  <p>Utilisez le code ci-dessous pour vous connecter en toute sécurité à votre compte.</p>
                  <div class="otp-code">${otp}</div>
                  <p style="font-size: 14px; color: #777;">Ce code expirera dans 4 minutes. Ne le partagez avec personne.</p>
                </div>
                <div class="footer">
                  <p>Si vous n'avez pas demandé ce code, vous pouvez ignorer cet e-mail.</p>
                  <p>© ${new Date().getFullYear()} User Management App. Tous droits réservés.</p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `,
      text: `
        Bonjour ${fullname},
        
        Voici votre code de connexion : ${otp}
        
        Ce code est valide pendant 4 minutes. Ne le partagez avec personne.
        Si vous n'avez pas demandé ce code, ignorez cet e-mail.
        
        Cordialement,
        L'équipe User Management App
      `,
    };

    try {
      this.logger.log(`📧 Sending OTP email to ${email} with OTP: ${otp}`);
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ OTP email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send OTP email to ${email}:`, error);
      throw new Error('Failed to send OTP email');
    }
  }

  async sendPasswordChangedEmail(
    email: string,
    fullname: string,
  ): Promise<void> {
    const mailOptions = {
      from: `"User Management App" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: 'Confirmation de changement de mot de passe',
      html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; width: 100% !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f4f4f7; color: #333; }
          .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }
          .content { padding: 40px; text-align: center; }
          h1 { font-size: 24px; font-weight: 600; color: #1a1a1a; margin: 0 0 20px; }
          p { font-size: 16px; line-height: 1.6; color: #555; margin: 0 0 30px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <table width="100%" border="0" cellspacing="0" cellpadding="20" style="background-color:#f4f4f7;">
          <tr>
            <td>
              <div class="container">
                <div class="content">
                  <h1>Mot de passe modifié</h1>
                  <p>Bonjour ${fullname},</p>
                  <p>Nous vous confirmons que le mot de passe de votre compte a été modifié avec succès le ${new Date().toLocaleString('fr-FR')}.</p>
                  <p style="font-size: 14px; color: #777;">Si vous n'êtes pas à l'origine de cette action, veuillez contacter immédiatement notre support.</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} User Management App. Tous droits réservés.</p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `,
      text: `
        Bonjour ${fullname},
        
        Nous vous confirmons que le mot de passe de votre compte a été modifié avec succès le ${new Date().toLocaleString('fr-FR')}.
        
        Si vous n'êtes pas à l'origine de cette action, veuillez contacter immédiatement notre support.
        
        Cordialement,
        L'équipe User Management App
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password changed confirmation email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password changed email to ${email}:`,
        error,
      );
      // Ne pas faire échouer la réinitialisation si l'email de confirmation échoue
    }
  }

  async sendTemporaryPasswordEmail(
    email: string,
    fullname: string,
    temporaryPassword: string,
    createdByAdmin: string,
  ): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const loginUrl = `${frontendUrl}/login`;

    const mailOptions = {
      from: `"User Management App" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: 'Bienvenue ! Votre compte a été créé',
      html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; width: 100% !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f4f4f7; color: #333; }
          .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }
          .content { padding: 40px; text-align: center; }
          h1 { font-size: 24px; font-weight: 600; color: #1a1a1a; margin: 0 0 20px; }
          p { font-size: 16px; line-height: 1.6; color: #555; margin: 0 0 30px; }
          .password-box { display: inline-block; background-color: #f4f4f7; padding: 15px 30px; border-radius: 6px; font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #1E90FF; margin-bottom: 30px; }
          .button { display: inline-block; padding: 14px 28px; background-color: #1E90FF; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <table width="100%" border="0" cellspacing="0" cellpadding="20" style="background-color:#f4f4f7;">
          <tr>
            <td>
              <div class="container">
                <div class="content">
                  <h1>Bienvenue !</h1>
                  <p>Bonjour ${fullname},</p>
                  <p>Un compte a été créé pour vous par <strong>${createdByAdmin}</strong>. Voici votre mot de passe temporaire pour vous connecter :</p>
                  <div class="password-box">${temporaryPassword}</div>
                  <a href="${loginUrl}" class="button">Se connecter</a>
                  <p style="margin-top: 30px; font-size: 14px; color: #777;">Pour votre sécurité, il vous sera demandé de changer ce mot de passe lors de votre première connexion.</p>
                </div>
                <div class="footer">
                  <p>Si vous avez des questions, n'hésitez pas à contacter votre administrateur.</p>
                  <p>© ${new Date().getFullYear()} User Management App. Tous droits réservés.</p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `,
      text: `
        Bonjour ${fullname},
        
        Un compte a été créé pour vous par ${createdByAdmin}.
        
        Votre mot de passe temporaire est : ${temporaryPassword}
        
        Connectez-vous ici : ${loginUrl}
        
        Pour votre sécurité, il vous sera demandé de changer ce mot de passe lors de votre première connexion.
        
        Cordialement,
        L'équipe User Management App
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Temporary password email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send temporary password email to ${email}:`,
        error,
      );
      throw new Error(
        "Échec de l'envoi de l'email avec le mot de passe temporaire",
      );
    }
  }
}
