const Redis = require('ioredis');

let redis;

if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL);
    
    redis.on('connect', () => console.log('Redis connected successfully'));
    redis.on('error', (err) => console.error('Redis connection error:', err));
} else {
    console.warn('REDIS_URL not found in .env. Falling back to in-memory operations (Not suitable for production scaling).');
}

module.exports = redis;
