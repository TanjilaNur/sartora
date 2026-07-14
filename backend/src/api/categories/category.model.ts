import { Schema, model, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

export const Category = model<ICategory>('Category', categorySchema);
