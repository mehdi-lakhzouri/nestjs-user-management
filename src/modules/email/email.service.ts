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

  async sendPasswordResetEmail(email: string, token: string, fullname: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"User Management App" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #007bff; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0;
            }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Réinitialisation de mot de passe</h1>
            </div>
            <div class="content">
              <p>Bonjour ${fullname},</p>
              
              <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
              
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
              </p>
              
              <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">
                ${resetUrl}
              </p>
              
              <p><strong>Important :</strong></p>
              <ul>
                <li>Ce lien est valide pendant 30 minutes seulement</li>
                <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                <li>Pour votre sécurité, ce lien ne peut être utilisé qu'une seule fois</li>
              </ul>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>© 2025 User Management App. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Bonjour ${fullname},
        
        Vous avez demandé la réinitialisation de votre mot de passe.
        
        Cliquez sur ce lien pour créer un nouveau mot de passe : ${resetUrl}
        
        Ce lien est valide pendant 30 minutes seulement.
        Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        
        Cordialement,
        L'équipe User Management App
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw new Error('Failed to send reset email');
    }
  }

  async sendOtpEmail(email: string, otp: string, fullname: string): Promise<void> {
    const mailOptions = {
      from: `"User Management App" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: 'Votre code de connexion OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background-color: #007bff; padding: 20px; text-align: center; color: white; }
            .content { padding: 20px; }
            .otp-code { 
              font-size: 32px; 
              font-weight: bold; 
              color: #007bff; 
              text-align: center; 
              background-color: #f8f9fa; 
              padding: 20px; 
              border-radius: 10px; 
              margin: 20px 0;
              letter-spacing: 8px;
              border: 2px dashed #007bff;
            }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Code de Connexion OTP</h1>
            </div>
            <div class="content">
              <p>Bonjour ${fullname},</p>
              
              <p>Voici votre code de connexion temporaire :</p>
              
              <div class="otp-code">${otp}</div>
              
              <div class="warning">
                <strong>⚠️ Important :</strong>
                <ul>
                  <li>Ce code est valide pendant <strong>4 minutes</strong> seulement</li>
                  <li>Vous disposez de <strong>3 tentatives maximum</strong></li>
                  <li>Ne partagez jamais ce code avec personne</li>
                  <li>Si vous n'avez pas demandé ce code, ignorez cet email</li>
                </ul>
              </div>
              
              <p>Saisissez ce code dans l'application pour vous connecter en toute sécurité.</p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>© 2025 User Management App. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Bonjour ${fullname},
        
        Voici votre code de connexion temporaire : ${otp}
        
        Ce code est valide pendant 4 minutes seulement.
        Vous disposez de 3 tentatives maximum.
        
        Ne partagez jamais ce code avec personne.
        Si vous n'avez pas demandé ce code, ignorez cet email.
        
        Cordialement,
        L'équipe User Management App
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`OTP email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}:`, error);
      throw new Error('Failed to send OTP email');
    }
  }

  async sendPasswordChangedEmail(email: string, fullname: string): Promise<void> {
    const mailOptions = {
      from: `"User Management App" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: 'Votre mot de passe a été modifié',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background-color: #28a745; padding: 20px; text-align: center; color: white; }
            .content { padding: 20px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
            .alert { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Mot de passe modifié avec succès</h1>
            </div>
            <div class="content">
              <p>Bonjour ${fullname},</p>
              
              <p>Votre mot de passe a été modifié avec succès le ${new Date().toLocaleString('fr-FR')}.</p>
              
              <div class="alert">
                <strong>⚠️ Sécurité :</strong> Si vous n'êtes pas à l'origine de cette modification, contactez immédiatement notre support.
              </div>
              
              <p>Pour votre sécurité :</p>
              <ul>
                <li>Toutes vos sessions actives ont été déconnectées</li>
                <li>Vous devrez vous reconnecter avec votre nouveau mot de passe</li>
                <li>Assurez-vous d'utiliser un mot de passe unique et sécurisé</li>
              </ul>
              
              <p>Merci de faire confiance à notre service.</p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>© 2025 User Management App. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Bonjour ${fullname},
        
        Votre mot de passe a été modifié avec succès le ${new Date().toLocaleString('fr-FR')}.
        
        Si vous n'êtes pas à l'origine de cette modification, contactez immédiatement notre support.
        
        Pour votre sécurité, toutes vos sessions actives ont été déconnectées.
        
        Cordialement,
        L'équipe User Management App
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password changed confirmation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password changed email to ${email}:`, error);
      // Ne pas faire échouer la réinitialisation si l'email de confirmation échoue
    }
  }
}
