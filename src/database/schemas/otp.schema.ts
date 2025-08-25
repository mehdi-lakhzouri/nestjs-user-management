import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({ timestamps: true })
export class Otp {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  otpHash: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: 3 })
  attempts: number;

  @Prop({ default: false })
  used: boolean;

  @Prop({ required: true, enum: ['login', 'password-reset', '2fa'] })
  type: string;

  createdAt: Date;
  updatedAt: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// Index pour améliorer les performances et nettoyer automatiquement
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpSchema.index({ userId: 1, type: 1 });
OtpSchema.index({ otpHash: 1 });
