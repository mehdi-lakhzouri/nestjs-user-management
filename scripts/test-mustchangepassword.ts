// Script de test pour mustChangePassword
// Ce script crée directement en base de données un utilisateur avec mustChangePassword = true

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/modules/users/users.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { UserRole, Gender } from '../src/database/schemas/user.schema';
import { Logger } from '@nestjs/common';

async function testMustChangePassword() {
  const logger = new Logger('TestMustChangePassword');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const usersService = app.get(UsersService);
    const authService = app.get(AuthService);

    // Créer un admin d'abord
    logger.log('Creating admin user...');
    const adminData = {
      fullname: 'System Admin',
      age: 35,
      gender: Gender.OTHER,
      email: 'admin@system.com',
      password: 'admin123!@#',
      role: UserRole.ADMIN,
    };

    let admin;
    try {
      const result = await usersService.create(adminData, 'System');
      admin = result.user;
      logger.log(`Admin created: ${admin.email}`);
    } catch (error) {
      // Si l'admin existe déjà, le récupérer
      admin = await usersService.findByEmail(adminData.email);
      logger.log(`Admin already exists: ${admin.email}`);
    }

    // Créer un utilisateur avec mot de passe temporaire
    logger.log('Creating user with temporary password...');
    const userData = {
      fullname: 'Temporary User',
      age: 25,
      gender: Gender.MALE,
      email: 'temp@test.com',
      // Pas de mot de passe fourni = mot de passe temporaire généré
    };

    try {
      const result = await usersService.create(userData, 'Admin System');
      const tempUser = result.user;
      const tempPassword = result.temporaryPassword;
      
      logger.log(`User created with temporary password: ${tempUser.email}`);
      logger.log(`Temporary password: ${tempPassword}`);
      
      // Tester la connexion avec le nouveau système 2FA
      logger.log('Testing login with temporary password using 2FA...');
      const loginWithOtpResult = await authService.loginWithOtp({
        email: tempUser.email,
        password: tempPassword!,
      });
      
      logger.log('Login with OTP successful! OTP sent to email.');
      
      // Note: Pour ce test automatisé, nous ne pouvons pas récupérer l'OTP depuis l'email
      // Nous allons simuler le test en vérifiant directement la propriété mustChangePassword
      const userFromDb = await usersService.findById(tempUser.id);
      const mustChangePassword = await usersService.mustChangePassword(tempUser.id);
      
      logger.log(`mustChangePassword: ${mustChangePassword}`);
      
      if (mustChangePassword === true) {
        logger.log('✅ SUCCESS: mustChangePassword is correctly set to true for temporary password user');
      } else {
        logger.error('❌ FAILURE: mustChangePassword should be true but is false');
      }
      
      // Tester le changement de mot de passe
      logger.log('Testing password change...');
      const changeResult = await authService.changePassword(tempUser.id, {
        currentPassword: tempPassword!,
        newPassword: 'newPassword123!@#',
        confirmPassword: 'newPassword123!@#',
      });
      
      logger.log('Password change successful!');
      
      // Reconnecter pour vérifier que mustChangePassword est maintenant false
      logger.log('Testing login after password change...');
      const newLoginWithOtpResult = await authService.loginWithOtp({
        email: tempUser.email,
        password: 'newPassword123!@#',
      });
      
      logger.log('Login with OTP after password change successful!');
      
      // Vérifier directement dans la base de données
      const mustChangePasswordAfter = await usersService.mustChangePassword(tempUser.id);
      logger.log(`mustChangePassword after change: ${mustChangePasswordAfter}`);
      
      if (mustChangePasswordAfter === false) {
        logger.log('✅ SUCCESS: mustChangePassword is correctly set to false after password change');
      } else {
        logger.error('❌ FAILURE: mustChangePassword should be false after password change');
      }
      
    } catch (userError) {
      if (userError.message?.includes('Email already exists')) {
        logger.log('User already exists, testing existing user...');
        const existingUser = await usersService.findByEmail(userData.email);
        if (existingUser) {
          const mustChange = await usersService.mustChangePassword(existingUser.id);
          logger.log(`Existing user mustChangePassword: ${mustChange}`);
        }
      } else {
        throw userError;
      }
    }

  } catch (error) {
    logger.error('Error during test:', error);
  } finally {
    await app.close();
  }
}

testMustChangePassword();
