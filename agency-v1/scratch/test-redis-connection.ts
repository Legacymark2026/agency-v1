import Redis from "ioredis";

async function run() {
  const redisUrl = "redis://:Rebyeh2620.@127.0.0.1:6379";
  console.log("Testing connection with custom URL parsing logic for:", redisUrl);

  const parsed = new URL(redisUrl);
  const options = {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
  };

  console.log("Parsed Options:", options);

  const redis = new Redis(options);

  redis.on("connect", () => {
    console.log("Connected successfully using custom parsed options!");
  });

  redis.on("error", (err) => {
    console.error("Redis error:", err.message);
  });

  try {
    const res = await redis.ping();
    console.log("PING response:", res);
  } catch (err: any) {
    console.error("PING failed:", err.message || err);
  } finally {
    await redis.quit();
  }
}

run();
