import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TwoFaSessionDocument = TwoFaSession & Document;

@Schema({ timestamps: true })
export class TwoFaSession {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  sessionToken: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  used: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const TwoFaSessionSchema = SchemaFactory.createForClass(TwoFaSession);

// Index pour améliorer les performances et nettoyer automatiquement
TwoFaSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
TwoFaSessionSchema.index({ sessionToken: 1 });
TwoFaSessionSchema.index({ userId: 1 });
