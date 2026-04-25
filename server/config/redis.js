const { createClient } = require('redis');

let redis;

if (process.env.REDIS_URL) {
    redis = createClient({
        url: process.env.REDIS_URL,
        socket: {
            reconnectStrategy: (retries) => Math.min(retries * 50, 2000)
        }
    });
    
    redis.on('connect', () => console.log('Redis connected successfully'));
    redis.on('error', (err) => console.error('Redis connection error:', err));
    
    // Connect to Redis
    redis.connect().catch(console.error);
} else {
    console.warn('REDIS_URL not found in .env. Falling back to in-memory operations.');
}

module.exports = redis;
