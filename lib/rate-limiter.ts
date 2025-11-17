import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple in-memory rate limiter
 * For production with multiple instances, consider using Redis-based solution
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

// In-memory store: userId -> endpoint -> RequestRecord
const rateLimitStore = new Map<string, Map<string, RequestRecord>>();

// Clean up old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [userId, endpoints] of rateLimitStore.entries()) {
    for (const [endpoint, record] of endpoints.entries()) {
      if (record.resetTime < now) {
        endpoints.delete(endpoint);
      }
    }
    if (endpoints.size === 0) {
      rateLimitStore.delete(userId);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Rate limit configurations per endpoint
 * These are generous limits for regular users, but prevent abuse
 */
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/generate': {
    maxRequests: 100, // 100 AI requests per hour (most expensive endpoint)
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  '/api/boards': {
    maxRequests: 1000, // 1000 requests per hour (very generous)
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  '/api/feedback': {
    maxRequests: 50, // 50 feedback submissions per hour
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Default for any other endpoint
  default: {
    maxRequests: 500, // 500 requests per hour
    windowMs: 60 * 60 * 1000, // 1 hour
  },
};

/**
 * Get rate limit config for an endpoint
 */
function getRateLimitConfig(pathname: string): RateLimitConfig {
  // Check exact match first
  if (RATE_LIMITS[pathname]) {
    return RATE_LIMITS[pathname];
  }
  
  // Check if pathname starts with any configured path
  for (const [path, config] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(path)) {
      return config;
    }
  }
  
  return RATE_LIMITS.default;
}

/**
 * Check if request should be rate limited
 * @param userId - User ID (or IP if not authenticated)
 * @param pathname - API endpoint pathname
 * @returns null if allowed, or error response if rate limited
 */
export function checkRateLimit(
  userId: string,
  pathname: string
): { allowed: boolean; remaining?: number; resetTime?: number; error?: NextResponse } {
  const config = getRateLimitConfig(pathname);
  const now = Date.now();
  
  // Get or create user's endpoint records
  let userEndpoints = rateLimitStore.get(userId);
  if (!userEndpoints) {
    userEndpoints = new Map();
    rateLimitStore.set(userId, userEndpoints);
  }
  
  // Get or create endpoint record
  let record = userEndpoints.get(pathname);
  
  // Reset if window expired
  if (!record || record.resetTime < now) {
    record = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    userEndpoints.set(pathname, record);
  }
  
  // Check limit
  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return {
      allowed: false,
      error: NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
          },
        }
      ),
    };
  }
  
  // Increment count
  record.count++;
  
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Middleware helper to apply rate limiting to API routes
 * @param request - Next.js request
 * @param userId - User ID from authentication (or IP if not authenticated)
 * @returns null if allowed, or error response if rate limited
 */
export function applyRateLimit(
  request: NextRequest,
  userId: string | null
): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  
  // Use IP address as fallback if no user ID
  // Try to get IP from headers (x-forwarded-for for proxies, or x-real-ip)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'anonymous';
  const identifier = userId || ip;
  
  const result = checkRateLimit(identifier, pathname);
  
  if (!result.allowed) {
    return result.error || null;
  }
  
  return null; // Allowed
}

/**
 * Get rate limit info for response headers
 */
export function getRateLimitHeaders(pathname: string, remaining?: number, resetTime?: number) {
  const config = getRateLimitConfig(pathname);
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
  };
  
  if (remaining !== undefined) {
    headers['X-RateLimit-Remaining'] = remaining.toString();
  }
  
  if (resetTime !== undefined) {
    headers['X-RateLimit-Reset'] = new Date(resetTime).toISOString();
  }
  
  return headers;
}

