import { Router, Request, Response } from 'express';

/**
 * Health Check Routes - Simple liveness check for monitoring
 */
export function createHealthRoutes(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
