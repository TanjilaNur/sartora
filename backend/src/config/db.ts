import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dress-shop';
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}
