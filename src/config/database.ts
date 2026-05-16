import mongoose from 'mongoose';
import { config } from './index';

let cachedConnection: typeof mongoose | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  if (cachedConnection) {
    return cachedConnection;
  }

  if (!config.mongodb.uri) {
    throw new Error('MONGODB_URI is not defined');
  }

  cachedConnection = await mongoose.connect(config.mongodb.uri, {
    bufferCommands: false,
  });

  return cachedConnection;
}
