import { Schema, model, Document, Types } from 'mongoose';

export type BadgeCriteriaType = 'points_threshold' | 'order_count' | 'review_count';

export interface IBadgeCriteria {
  type: BadgeCriteriaType;
  value: number;
}

export interface IBadge extends Document {
  key: string;
  name: string;
  description: string;
  icon: string;
  criteria: IBadgeCriteria;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserBadge extends Document {
  user: Types.ObjectId;
  badge: Types.ObjectId;
  earnedAt: Date;
}

const badgeSchema = new Schema<IBadge>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    icon: { type: String, default: '' },
    criteria: {
      type: { type: String, enum: ['points_threshold', 'order_count', 'review_count'], required: true },
      value: { type: Number, required: true, min: 0 },
    },
  },
  { timestamps: true }
);

export const Badge = model<IBadge>('Badge', badgeSchema);

const userBadgeSchema = new Schema<IUserBadge>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    badge: { type: Schema.Types.ObjectId, ref: 'Badge', required: true },
    earnedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

userBadgeSchema.index({ user: 1, badge: 1 }, { unique: true });

export const UserBadge = model<IUserBadge>('UserBadge', userBadgeSchema);
