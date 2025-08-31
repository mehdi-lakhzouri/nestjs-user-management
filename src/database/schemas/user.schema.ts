import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  fullname: string;

  @Prop({ required: true, min: 0 })
  age: number;

  @Prop({ required: true, enum: Gender })
  gender: Gender;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  lastLogin: Date;

  @Prop()
  avatar: string;

  @Prop({ type: [String], select: false, default: [] })
  refreshTokens: string[];

  @Prop({ default: false, select: false })
  mustChangePassword: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Index pour améliorer les performances (sans créer de doublon pour email)
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
