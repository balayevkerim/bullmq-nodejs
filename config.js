require('dotenv').config();

module.exports = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
  },
  app: {
    port: parseInt(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  queue: {
    maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS) || 5,
    removeOnComplete: parseInt(process.env.REMOVE_ON_COMPLETE) || 100,
    removeOnFail: parseInt(process.env.REMOVE_ON_FAIL) || 50,
  }
};
