import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../lib/auth";
import type { WorkerStatus } from "@prisma/client";

const router = Router();
const PAGE_SIZE = 10;

router.get("/", requireAuth, async (req, res) => {
  const search = (req.query.search as string)?.trim() ?? "";
  const unit = (req.query.unit as string)?.trim() ?? "";
  const page = Math.max(1, Number(req.query.page ?? "1"));

  const where = {
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { unit: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {},
      unit && unit !== "All Units" ? { unit } : {},
    ],
  };

  const [workers, total] = await Promise.all([
    prisma.worker.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.worker.count({ where }),
  ]);

  res.json({ workers, total, page, pageSize: PAGE_SIZE });
});

router.post("/", requireAuth, async (req, res) => {
  const name: string | undefined = req.body?.name?.trim();
  const unit: string | undefined = req.body?.unit?.trim();
  const status: WorkerStatus = req.body?.status === "VERIFIED" ? "VERIFIED" : "PENDING";

  if (!name || !unit) {
    res.status(400).json({ error: "Name and unit are required." });
    return;
  }

  const worker = await prisma.worker.create({ data: { name, unit, status } });
  res.status(201).json({ worker });
});

router.post("/bulk", requireAuth, async (req, res) => {
  const rows: { name?: string; unit?: string }[] | undefined = req.body?.rows;
  if (!rows || rows.length === 0) {
    res.status(400).json({ error: "No rows to import." });
    return;
  }

  const clean = rows
    .map((r) => ({ name: r.name?.trim(), unit: r.unit?.trim() }))
    .filter((r): r is { name: string; unit: string } => Boolean(r.name && r.unit));

  if (clean.length === 0) {
    res.status(400).json({ error: "No valid rows found (need name + unit columns)." });
    return;
  }
  if (clean.length > 500) {
    res.status(400).json({ error: "Max 500 rows per import." });
    return;
  }

  const result = await prisma.worker.createMany({
    data: clean.map((r) => ({ name: r.name, unit: r.unit, status: "PENDING" as const })),
  });

  res.json({ imported: result.count });
});

// Edit a worker's record
router.patch("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const name = req.body?.name?.trim();
  const unit = req.body?.unit?.trim();
  const status = req.body?.status;

  if (!name || !unit) {
    res.status(400).json({ error: "Name and unit are required." });
    return;
  }

  try {
    const worker = await prisma.worker.update({
      where: { id },
      data: { name, unit, status: status === "VERIFIED" ? "VERIFIED" : "PENDING" },
    });
    res.json({ worker });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update worker." });
  }
});

// Delete a worker
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.worker.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete worker." });
  }
});

export default router;
