import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

const userOrIpKey = (req: Request): string =>
  (req as any).user?.id?.toString() ?? ipKeyGenerator(req.ip ?? '');

const rateLimitResponse = (message: string) => ({
  success: false,
  message,
});

// Auth endpoints: 50 req/min per IP (brute-force protection)
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse('Too many auth requests. Please try again in a minute.'),
});

// AI generation: 5 req/min per user (cost protection)
export const aiLimiterPerMinute = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse('AI generation limit reached. Max 5 requests per minute.'),
});

// File upload: 5 req/min per user
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse('Upload limit reached. Max 5 uploads per minute.'),
});

// Payment/subscription checkout: 5 req/min per user
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse('Payment request limit reached. Max 5 requests per minute.'),
});

// Stripe webhook: 100 req/min (generous, Stripe retries legitimately)
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse('Webhook rate limit exceeded.'),
});
