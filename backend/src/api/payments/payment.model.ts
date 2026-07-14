import { Schema, model, Document, Types } from 'mongoose';

export interface ITransaction extends Document {
  order: Types.ObjectId;
  user: Types.ObjectId;
  stripePaymentIntentId: string;
  amount: number; // in cents
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  stripeRefundId?: string;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stripePaymentIntentId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'usd' },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
    },
    stripeRefundId: { type: String },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

transactionSchema.index({ order: 1 }, { unique: true });
transactionSchema.index({ stripePaymentIntentId: 1 });

export const Transaction = model<ITransaction>('Transaction', transactionSchema);
