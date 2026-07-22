import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../lib/auth";

const router = Router();
const PAGE_SIZE = 15;

router.get("/", requireAuth, async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? "1"));
  const search = (req.query.search as string)?.trim() ?? "";

  const where = search
    ? {
        OR: [
          { action: { contains: search, mode: "insensitive" as const } },
          { details: { contains: search, mode: "insensitive" as const } },
          { adminName: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  try {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      total,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load audit logs." });
  }
});

export default router;
