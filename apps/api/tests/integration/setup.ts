import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

export default async function globalSetup() {
  mongod = await MongoMemoryServer.create({ instance: { startupTimeout: 60000 } });
  process.env['MONGO_URI'] = mongod.getUri();
  process.env['JWT_SECRET'] = 'integration_test_secret';
  process.env['JWT_REFRESH_SECRET'] = 'integration_test_refresh_secret';
  process.env['PORT'] = '3099';
  (global as Record<string, unknown>).__MONGOD__ = mongod;
}
