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

  // Check if election is closed
  const settings = await prisma.electionSetting.findUnique({
    where: { id: "settings" },
  });
  const isStopped = settings?.status === "stopped";
  const isExpired = settings?.endsAt ? new Date() > new Date(settings.endsAt) : false;
  if (isStopped || isExpired) {
    res.status(400).json({ error: "Voting is currently closed." });
    return;
  }

  const name: string | undefined = req.body?.name?.trim();
  const unit: string | undefined = req.body?.unit?.trim();

  if (!name || !unit) {
    res.status(400).json({ error: "Name and unit are required." });
    return;
  }

  const worker = await prisma.worker.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      unit: { equals: unit, mode: "insensitive" },
    },
  });

  if (!worker) {
    res.status(403).json({ error: "Your name and unit were not found in the official worker roster." });
    return;
  }

  if (worker.status !== "VERIFIED") {
    res.status(403).json({ error: "Your account is pending verification. Please contact your unit coordinator." });
    return;
  }

  const identityHash = makeIdentityHash(name, unit);

  const voter = await prisma.voter.upsert({
    where: { identityHash },
    update: {},
    create: { name, unit, identityHash },
  });

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

    const settings = await prisma.electionSetting.findUnique({
      where: { id: "settings" },
    });
    const electionClosed = settings ? (settings.status === "stopped" || (settings.endsAt ? new Date() > new Date(settings.endsAt) : false)) : false;

    res.json({
      units,
      electionClosed,
      status: settings?.status ?? "active",
      endsAt: settings?.endsAt ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load units." });
  }
});

export default router;
