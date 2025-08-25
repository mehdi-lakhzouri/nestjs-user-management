import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PasswordResetTokenDocument = PasswordResetToken & Document;

@Schema({ timestamps: true })
export class PasswordResetToken {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  tokenHash: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  used: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const PasswordResetTokenSchema = SchemaFactory.createForClass(PasswordResetToken);

// Index pour améliorer les performances et nettoyer automatiquement
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
PasswordResetTokenSchema.index({ tokenHash: 1 });
PasswordResetTokenSchema.index({ userId: 1 });
