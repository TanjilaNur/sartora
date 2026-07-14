import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  user: Types.ObjectId;
  product: Types.ObjectId;
  rating: number;
  text: string;
  verified: boolean;
  reported: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, default: '', trim: true },
    verified: { type: Boolean, default: false },
    reported: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({ product: 1, createdAt: -1 });

export const Review = model<IReview>('Review', reviewSchema);
