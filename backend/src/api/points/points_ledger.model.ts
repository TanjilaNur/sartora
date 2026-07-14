import { Schema, model, Document, Types } from 'mongoose';

export type PointsEvent = 'signup' | 'purchase' | 'review';

export interface IPointsLedger extends Document {
  user: Types.ObjectId;
  event: PointsEvent;
  points: number;
  referenceId?: string;
  idempotencyKey: string;
  description: string;
  createdAt: Date;
}

const pointsLedgerSchema = new Schema<IPointsLedger>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    event: { type: String, enum: ['signup', 'purchase', 'review'], required: true },
    points: { type: Number, required: true },
    referenceId: { type: String },
    idempotencyKey: { type: String, required: true, unique: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

export const PointsLedger = model<IPointsLedger>('PointsLedger', pointsLedgerSchema);
