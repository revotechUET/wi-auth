let redis = require('redis');
const config = require('config');
let redisClient = redis.createClient(process.env.REDIS_PORT || config.redis.port || 6379, process.env.REDIS_HOST || config.redis.host || '127.0.0.1');
redisClient.on("error", function (err) {
    console.log("Connecting redis-server err : ", err);
});
redisClient.on("connect", function () {
    console.log("Connected to redis server!");
});
module.exports = {
    redisClient: redisClient,
};