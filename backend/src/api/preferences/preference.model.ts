import { Schema, model, Document, Types } from 'mongoose';

export interface IPreference extends Document {
  user: Types.ObjectId;
  darkMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const preferenceSchema = new Schema<IPreference>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    darkMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Preference = model<IPreference>('Preference', preferenceSchema);
