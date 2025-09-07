import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer;

export const connectTestDB = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  await mongoose.connect(uri);
};

export const closeTestDB = async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.close();
  }
  if (mongod) {
    await mongod.stop();
  }
};

export const clearTestDB = async () => {
  if (mongoose.connection.db) {
    const collections = mongoose.connection.db.collections;
    for (const collection of Object.values(collections)) {
      await collection.deleteMany({});
    }
  }
};