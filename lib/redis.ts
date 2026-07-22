import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const hasRedis = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

export const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// 5 verify/vote attempts per minute per IP — fallback to auto-success if keys are not provided
export const rateLimiter =
  hasRedis && redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "60 s"),
        prefix: "mfmcf_ratelimit",
      })
    : {
        limit: async () => ({ success: true, limit: 0, remaining: 0, reset: 0 }),
      };
