import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { rateLimiter } from "../../lib/redis";
import { makeIdentityHash, VOTER_COOKIE } from "../../lib/identity";

const router = Router();

router.post("/", async (req, res) => {
  const ip = (req.headers["x-forwarded-for"] as string) ?? req.socket.remoteAddress ?? "unknown";
  const { success } = await rateLimiter.limit(`verify:${ip}`);
  if (!success) {
    res.status(429).json({ error: "Too many attempts. Please wait a moment." });
    return;
  }

  const name: string | undefined = req.body?.name?.trim();
  const unit: string | undefined = req.body?.unit?.trim();

  if (!name || !unit) {
    res.status(400).json({ error: "Name and unit are required." });
    return;
  }

  const identityHash = makeIdentityHash(name, unit);

  const voter = await prisma.voter.upsert({
    where: { identityHash },
    update: {},
    create: { name, unit, identityHash },
  });

  // Automatically mark this worker as VERIFIED in the roster on successful sign-in
  try {
    await prisma.worker.updateMany({
      where: {
        name: { equals: name, mode: "insensitive" },
        unit: { equals: unit, mode: "insensitive" },
      },
      data: { status: "VERIFIED" },
    });
  } catch (err) {
    console.error("Failed to auto-verify worker:", err);
  }

  res.cookie(VOTER_COOKIE, voter.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 1000 * 60 * 30, // 30 min ballot session (Express maxAge is ms)
  });
  res.json({ voterId: voter.id, name: voter.name, unit: voter.unit });
});

router.get("/units", async (req, res) => {
  try {
    const dbUnits = await prisma.unit.findMany({
      select: { name: true },
    });
    let units = dbUnits.map((u) => u.name.trim()).filter(Boolean);
    if (units.length === 0) {
      const workers = await prisma.worker.findMany({
        select: { unit: true },
        distinct: ["unit"],
      });
      units = workers.map((w) => w.unit?.trim()).filter(Boolean);
    }
    units = Array.from(new Set(units)).sort();
    res.json({ units });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load units." });
  }
});

export default router;
