import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../lib/auth";
import { logAction } from "../lib/logger";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    let settings = await prisma.electionSetting.findUnique({
      where: { id: "settings" },
    });
    if (!settings) {
      settings = await prisma.electionSetting.create({
        data: { id: "settings", status: "active", endsAt: null },
      });
    }
    res.json({ settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load election settings." });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const status = req.body?.status === "stopped" ? "stopped" : "active";
  const endsAtStr = req.body?.endsAt;
  const endsAt = endsAtStr ? new Date(endsAtStr) : null;

  if (endsAt && isNaN(endsAt.getTime())) {
    res.status(400).json({ error: "Invalid end date/time." });
    return;
  }

  try {
    const settings = await prisma.electionSetting.upsert({
      where: { id: "settings" },
      update: { status, endsAt },
      create: { id: "settings", status, endsAt },
    });

    const timerDesc = endsAt ? `timer set to ${endsAt.toISOString()}` : "timer cleared";
    await logAction(
      req,
      "UPDATE_SETTINGS",
      `Updated settings: status is "${status}", ${timerDesc}`
    );

    res.json({ settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update election settings." });
  }
});

export default router;
