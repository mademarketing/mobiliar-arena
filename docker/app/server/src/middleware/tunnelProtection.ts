import { Request, Response, NextFunction } from 'express';

/**
 * Allowed paths that can be accessed via Cloudflare tunnel
 */
const ALLOWED_TUNNEL_PATHS = [
  '/admin',
  '/promoter',
  '/dashboard',
  '/api/admin',
  '/api/promoter',
  '/api/dashboard',
  '/api/health',
  '/health',
  // Admin HTML pages
  '/admin.html',
  '/promoter.html',
  '/dashboard.html',
  '/admin-login.html',
  '/promoter-login.html',
  // Static assets for admin pages
  '/admin.js',
  '/promoter.js',
  '/dashboard.js',
  // Common static assets
  '/favicon.ico',
  '/assets',
];

/**
 * Check if a path is allowed for tunnel access
 */
export function isAllowedPath(path: string): boolean {
  return ALLOWED_TUNNEL_PATHS.some(allowed =>
    path === allowed || path.startsWith(allowed + '/')
  );
}

/**
 * Detect if request is coming through Cloudflare tunnel
 */
export function isTunnelRequest(req: Request): boolean {
  // Cloudflare adds these headers to proxied requests
  return !!(
    req.headers['cf-connecting-ip'] ||
    req.headers['cf-ray'] ||
    req.headers['cf-visitor']
  );
}

/**
 * Middleware to protect game routes from tunnel access
 *
 * Cloudflare tunnels add specific headers to requests. This middleware
 * detects those headers and blocks access to game routes while allowing
 * administrative routes (/admin, /promoter, /dashboard and their APIs).
 */
export function tunnelProtection(req: Request, res: Response, next: NextFunction) {
  if (isTunnelRequest(req)) {
    if (!isAllowedPath(req.path)) {
      console.log(`Tunnel access blocked for path: ${req.path}`);
      return res.status(403).json({
        error: 'Access denied',
        message: 'Game access is not available via remote connection'
      });
    }
  }
  next();
}
