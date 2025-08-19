import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/modules/users/users.service';
import { UserRole, Gender } from '../src/database/schemas/user.schema';
import { Logger } from '@nestjs/common';

async function seed() {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const usersService = app.get(UsersService);

    // Check if admin user already exists
    const adminExists = await usersService.findByEmail('admin@example.com');
    
    if (adminExists) {
      logger.log('Admin user already exists');
      return;
    }

    // Create admin user
    const adminUser = await usersService.create(
      {
        fullname: 'System Administrator',
        age: 30,
        gender: Gender.OTHER,
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        isActive: true,
      },
      'admin123456' // Default password
    );

    logger.log(`Admin user created successfully with email: ${adminUser.email}`);
    logger.log('Default password: admin123456');
    logger.warn('Please change the default password after first login');

  } catch (error) {
    logger.error('Error seeding database:', error);
  } finally {
    await app.close();
  }
}

seed();
