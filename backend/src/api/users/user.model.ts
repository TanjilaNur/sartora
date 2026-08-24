import { Schema, model, Document, Types } from 'mongoose';

export interface IAddress {
  _id: Types.ObjectId;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface IPushToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  createdAt: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'user' | 'admin';
  refreshToken?: string;
  googleId?: string;
  addresses: IAddress[];
  wishlist: Types.ObjectId[];
  notificationsEnabled: boolean;
  pushTokens: IPushToken[];
  isDeleted: boolean;
  deletedAt?: Date;
  passwordResetTokenHash?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
}

const addressSchema = new Schema<IAddress>({
  label: { type: String, required: true, trim: true, default: 'Home' },
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  zip: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  isDefault: { type: Boolean, default: false },
});

const pushTokenSchema = new Schema<IPushToken>(
  {
    token: { type: String, required: true },
    platform: { type: String, enum: ['ios', 'android', 'web'], required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, unique: true, trim: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    refreshToken: { type: String, default: null },
    googleId: { type: String, unique: true, sparse: true },
    addresses: { type: [addressSchema], default: [] },
    wishlist: { type: [{ type: Schema.Types.ObjectId, ref: 'Product' }], default: [] },
    notificationsEnabled: { type: Boolean, default: true },
    pushTokens: { type: [pushTokenSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', userSchema);
