import mongoose from 'mongoose';
import config from './index.js';

export async function connectDatabase() {
  await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 5000 });
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
