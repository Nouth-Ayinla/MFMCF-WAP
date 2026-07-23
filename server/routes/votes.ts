import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { rateLimiter } from "../../lib/redis";
import { VOTER_COOKIE } from "../../lib/identity";
import { Prisma } from "@prisma/client";

const router = Router();

router.post("/", async (req, res) => {
  const voterId = req.cookies?.[VOTER_COOKIE];
  if (!voterId) {
    res.status(401).json({ error: "Not verified. Please verify first." });
    return;
  }

  const ip = (req.headers["x-forwarded-for"] as string) ?? req.socket.remoteAddress ?? "unknown";
  const { success } = await rateLimiter.limit(`vote:${ip}`);
  if (!success) {
    res.status(429).json({ error: "Too many requests. Please slow down." });
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

  const selections: Record<string, string> | undefined = req.body?.selections;
  if (!selections || Object.keys(selections).length === 0) {
    res.status(400).json({ error: "No selections submitted." });
    return;
  }

  try {
    await prisma.$transaction(
      Object.entries(selections).map(([categoryId, nomineeId]) =>
        prisma.vote.create({ data: { voterId, categoryId, nomineeId } })
      )
    );
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      res.status(409).json({ error: "You've already voted in one or more of these categories." });
      return;
    }
    res.status(500).json({ error: "Could not record votes." });
    return;
  }

  const voter = await prisma.voter.findUnique({ where: { id: voterId } });
  res.json({ ok: true, name: voter?.name, unit: voter?.unit });
});

export default router;
