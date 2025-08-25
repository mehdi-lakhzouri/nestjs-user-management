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
import { PasswordUtil } from '../../utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto, password?: string): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const userData: any = { ...createUserDto };
    
    if (password) {
      userData.password = await PasswordUtil.hash(password);
    }

    const user = new this.userModel(userData);
    return user.save();
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
    });
  }
}
