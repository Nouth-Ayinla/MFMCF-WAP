import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../../lib/jwt";
import { prisma } from "../../lib/prisma";

export interface CustomAdminUser {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  banned: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: CustomAdminUser;
    }
  }
}

const SESSION_COOKIE = "admin_session";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) {
    res.status(401).json({ error: "Unauthorized. Please sign in." });
    return;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Session expired. Please sign in again." });
    return;
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { id: payload.id } });
    if (!admin || admin.banned) {
      res.status(401).json({ error: "Account deactivated or not found." });
      return;
    }

    req.user = {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      banned: admin.banned,
    };
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Auth verification failed." });
  }
}

export async function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) {
    res.status(401).json({ error: "Unauthorized. Please sign in." });
    return;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Session expired. Please sign in again." });
    return;
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { id: payload.id } });
    if (!admin || admin.banned) {
      res.status(401).json({ error: "Account deactivated or not found." });
      return;
    }

    if (admin.role !== "superadmin") {
      res.status(403).json({ error: "Superadmin access required." });
      return;
    }

    req.user = {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      banned: admin.banned,
    };
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Auth verification failed." });
  }
}
