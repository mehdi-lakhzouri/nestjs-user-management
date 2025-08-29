import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { CreateUserDto, UpdateUserDto, QueryUsersDto } from './dto';
import { PasswordUtil, generateTemporaryPassword } from '../../utils';
import { EmailService } from '../email/email.service';
import { AppLoggerService } from '../../common/logger';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly emailService: EmailService,
    private readonly logger: AppLoggerService,
  ) {}

  async create(createUserDto: CreateUserDto, createdByAdminName?: string): Promise<{ user: UserDocument; temporaryPassword?: string }> {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const userData: any = { ...createUserDto };
    let temporaryPassword: string | undefined;
    
    // Si aucun mot de passe n'est fourni, générer un mot de passe temporaire
    if (!createUserDto.password) {
      temporaryPassword = generateTemporaryPassword();
      userData.password = await PasswordUtil.hash(temporaryPassword);
      userData.mustChangePassword = true;
      
      this.logger.info('Temporary password generated for new user', {
        module: 'UsersService',
        email: createUserDto.email,
        createdBy: createdByAdminName || 'Admin',
      });
    } else {
      userData.password = await PasswordUtil.hash(createUserDto.password);
      userData.mustChangePassword = false;
    }

    const user = new this.userModel(userData);
    const savedUser = await user.save();
    
    // Envoyer l'email avec le mot de passe temporaire si généré
    if (temporaryPassword && createdByAdminName) {
      try {
        await this.emailService.sendTemporaryPasswordEmail(
          createUserDto.email,
          createUserDto.fullname,
          temporaryPassword,
          createdByAdminName
        );
        
        this.logger.info('Temporary password email sent successfully', {
          module: 'UsersService',
          email: createUserDto.email,
          createdBy: createdByAdminName,
        });
      } catch (emailError) {
        this.logger.error('Failed to send temporary password email', emailError, {
          module: 'UsersService',
          email: createUserDto.email,
        });
        
        // Ne pas faire échouer la création si l'email échoue
        // L'admin peut toujours récupérer le mot de passe temporaire
      }
    }

    return { 
      user: savedUser, 
      temporaryPassword: temporaryPassword 
    };
  }

  async findAll(queryDto: QueryUsersDto): Promise<{ users: UserDocument[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, search, gender, role, isActive } = queryDto;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (search) {
      filter.fullname = { $regex: search, $options: 'i' };
    }

    if (gender) {
      filter.gender = gender;
    }

    if (role) {
      filter.role = role;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      this.userModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      this.userModel.countDocuments(filter),
    ]);

    return {
      users,
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string, includePassword = false): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ email });
    
    if (includePassword) {
      query.select('+password +refreshTokens');
    }

    return query.exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      updateUserDto,
      { new: true, runValidators: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id);
    
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { lastLogin: new Date() });
  }

  async addRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $push: { refreshTokens: refreshToken },
    });
  }

  async removeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: refreshToken },
    });
  }

  async clearAllRefreshTokens(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $unset: { refreshTokens: 1 },
    });
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await PasswordUtil.hash(newPassword);
    
    await this.userModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
      mustChangePassword: false, // L'utilisateur a changé son mot de passe
    });
  }

  async mustChangePassword(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).select('+mustChangePassword');
    return user?.mustChangePassword || false;
  }

  async markPasswordChanged(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      mustChangePassword: false,
    });
  }
}
