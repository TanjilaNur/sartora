import { Schema, model, Document } from 'mongoose';

export interface IGuestCartItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface IGuestCart extends Document {
  guestId: string;
  items: IGuestCartItem[];
  expiresAt: Date;
}

const guestCartItemSchema = new Schema<IGuestCartItem>(
  {
    productId: { type: String, required: true },
    variantId: { type: String },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const guestCartSchema = new Schema<IGuestCart>(
  {
    guestId: { type: String, required: true, unique: true, index: true },
    items: { type: [guestCartItemSchema], default: [] },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true }
);

export const GuestCart = model<IGuestCart>('GuestCart', guestCartSchema);
