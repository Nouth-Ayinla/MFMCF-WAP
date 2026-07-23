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
        data: { id: "settings", status: "active", endsAt: null, categoriesLocked: false },
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
    const existingSettings = await prisma.electionSetting.findUnique({
      where: { id: "settings" },
    });

    let categoriesLocked = existingSettings?.categoriesLocked ?? false;

    if (req.body?.categoriesLocked !== undefined) {
      if (req.user!.role !== "superadmin") {
        res.status(403).json({ error: "Only superadmins can change category lock status." });
        return;
      }
      categoriesLocked = Boolean(req.body.categoriesLocked);
    }

    const settings = await prisma.electionSetting.upsert({
      where: { id: "settings" },
      update: { status, endsAt, categoriesLocked },
      create: { id: "settings", status, endsAt, categoriesLocked },
    });

    const timerDesc = endsAt ? `timer set to ${endsAt.toISOString()}` : "timer cleared";
    const lockDesc = categoriesLocked ? "categories locked" : "categories unlocked";
    await logAction(
      req,
      "UPDATE_SETTINGS",
      `Updated settings: status is "${status}", ${timerDesc}, ${lockDesc}`
    );

    res.json({ settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update election settings." });
  }
});

export default router;
