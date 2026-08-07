import { Schema, model, Document, Types } from 'mongoose';

export interface IRefundRequest extends Document {
  order: Types.ObjectId;
  user: Types.ObjectId;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const refundRequestSchema = new Schema<IRefundRequest>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String },
  },
  { timestamps: true }
);

refundRequestSchema.index({ user: 1, createdAt: -1 });
// Only one pending/approved request per order at a time — a rejected request
// doesn't permanently block a customer from ever requesting again.
refundRequestSchema.index(
  { order: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'approved'] } } }
);

export const RefundRequest = model<IRefundRequest>('RefundRequest', refundRequestSchema);
