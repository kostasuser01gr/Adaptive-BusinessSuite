/**
 * RBAC permission-checking middleware.
 */

import type { Request, Response, NextFunction } from "express";
import { Permission, hasPermission } from "@shared/permissions";
import { storage } from "../storage";

/**
 * Express middleware that checks if the authenticated user has the required permission.
 * Must be placed AFTER `requireAuth` in the middleware chain.
 */
export function checkPermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!hasPermission(user.role, permission)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

/**
 * Middleware requiring the user to be an admin.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  return checkPermission(Permission.VIEW_ADMIN)(req, res, next);
}
