import { Schema, model, Document, Types } from 'mongoose';

interface IPromoUsage {
  user: Types.ObjectId;
  usedAt: Date;
}

export interface IPromotion extends Document {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrderAmount: number;
  maxUses?: number;
  usedCount: number;
  perUserLimit: number;
  expiresAt?: Date;
  active: boolean;
  usedBy: IPromoUsage[];
  createdAt: Date;
  updatedAt: Date;
}

const promotionSchema = new Schema<IPromotion>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    maxUses: { type: Number },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1, min: 1 },
    expiresAt: { type: Date },
    active: { type: Boolean, default: true },
    usedBy: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        usedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

promotionSchema.index({ code: 1 }, { unique: true });

export const Promotion = model<IPromotion>('Promotion', promotionSchema);
