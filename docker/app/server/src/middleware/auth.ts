import { Request, Response, NextFunction } from 'express';

/**
 * Simple password-based authentication middleware for admin and promoter panels
 *
 * Defense in depth: Adds basic password protection to protected routes
 * even though system is network-isolated and requires physical access.
 *
 * Passwords stored in environment variables:
 * - ADMIN_PASSWORD: For admin panel (default: 'swisslos2026')
 * - PROMOTER_PASSWORD: For promoter panel (default: 'promoter2026')
 */

declare module 'express-session' {
  interface SessionData {
    authenticated?: boolean;
    promoterAuthenticated?: boolean;
  }
}

/**
 * Middleware to check if user is authenticated
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.authenticated) {
    next();
  } else {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
}

/**
 * Login endpoint handler
 */
export function loginHandler(req: Request, res: Response): void {
  const { password } = req.body;
  const correctPassword = process.env.ADMIN_PASSWORD || 'swisslos2026';

  if (password === correctPassword) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid password'
    });
  }
}

/**
 * Logout endpoint handler
 */
export function logoutHandler(req: Request, res: Response): void {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ success: false, error: 'Logout failed' });
    } else {
      res.json({ success: true });
    }
  });
}

/**
 * Check authentication status
 */
export function checkAuthHandler(req: Request, res: Response): void {
  res.json({
    authenticated: req.session?.authenticated || false
  });
}

// ========== Promoter Authentication ==========

/**
 * Middleware to check if promoter is authenticated
 */
export function requirePromoterAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.promoterAuthenticated) {
    next();
  } else {
    res.status(401).json({
      success: false,
      error: 'Promoter authentication required'
    });
  }
}

/**
 * Promoter login endpoint handler
 */
export function promoterLoginHandler(req: Request, res: Response): void {
  const { password } = req.body;
  const correctPassword = process.env.PROMOTER_PASSWORD || 'promoter';

  if (password === correctPassword) {
    req.session.promoterAuthenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid password'
    });
  }
}

/**
 * Promoter logout endpoint handler
 */
export function promoterLogoutHandler(req: Request, res: Response): void {
  req.session.promoterAuthenticated = false;
  res.json({ success: true });
}

/**
 * Check promoter authentication status
 */
export function checkPromoterAuthHandler(req: Request, res: Response): void {
  res.json({
    authenticated: req.session?.promoterAuthenticated || false
  });
}
