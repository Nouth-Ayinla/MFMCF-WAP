import { Request } from "express";
import { prisma } from "../../lib/prisma";

/**
 * Audit log helper to record administrative actions.
 */
export async function logAction(req: Request, action: string, details: string) {
  const admin = req.user;
  const ip = (req.headers["x-forwarded-for"] as string) ?? req.socket.remoteAddress ?? "unknown";
  try {
    await prisma.auditLog.create({
      data: {
        action,
        details,
        adminId: admin?.id || null,
        adminName: admin ? (admin.fullName || admin.email) : "System/Voter",
        ipAddress: ip,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
