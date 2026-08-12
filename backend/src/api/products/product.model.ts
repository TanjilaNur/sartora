import { Schema, model, Document, Types } from 'mongoose';

export interface IProductVariant {
  _id: Types.ObjectId;
  size?: string;
  color?: string;
  stock: number;
  priceOverride?: number;
}

export interface IProduct extends Document {
  name: string;
  description: string;
  category: Types.ObjectId;
  price: number;
  stock: number;
  images: string[];
  variants: IProductVariant[];
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema<IProductVariant>({
  size: { type: String, trim: true },
  color: { type: String, trim: true },
  stock: { type: Number, required: true, min: 0, default: 0 },
  priceOverride: { type: Number, min: 0 },
});

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: { type: [String], default: [] },
    variants: { type: [variantSchema], default: [] },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

productSchema.index({ category: 1 });
productSchema.index({ name: 'text', description: 'text' });

export const Product = model<IProduct>('Product', productSchema);
