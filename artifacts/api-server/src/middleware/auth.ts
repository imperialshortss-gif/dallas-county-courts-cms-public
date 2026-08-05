import type { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = (req as any).session;
  if (!session?.userId) {
    res.status(401).json({ error: "Unauthorized. Please log in." });
    return;
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const session = (req as any).session;
    if (!session?.userId) {
      res.status(401).json({ error: "Unauthorized. Please log in." });
      return;
    }
    if (!roles.includes(session.role)) {
      res.status(403).json({ error: "Forbidden. Insufficient permissions." });
      return;
    }
    next();
  };
}
