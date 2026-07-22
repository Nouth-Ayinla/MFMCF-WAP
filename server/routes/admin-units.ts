import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../lib/auth";
import { logAction } from "../lib/logger";

const router = Router();

// Get all units
router.get("/", requireAuth, async (req, res) => {
  try {
    const units = await prisma.unit.findMany({
      orderBy: { name: "asc" },
    });
    res.json({ units });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load units." });
  }
});

// Create a new unit
router.post("/", requireAuth, async (req, res) => {
  const name = req.body?.name?.trim();

  if (!name) {
    res.status(400).json({ error: "Unit name is required." });
    return;
  }

  try {
    const existing = await prisma.unit.findUnique({ where: { name } });
    if (existing) {
      res.status(400).json({ error: "A unit with this name already exists." });
      return;
    }

    const unit = await prisma.unit.create({
      data: { name },
    });

    await logAction(req, "CREATE_UNIT", `Created unit "${name}"`);
    res.status(201).json({ unit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create unit." });
  }
});

// Delete a unit
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const unit = await prisma.unit.findUnique({ where: { id } });
    if (!unit) {
      res.status(404).json({ error: "Unit not found." });
      return;
    }

    await prisma.unit.delete({ where: { id } });

    await logAction(req, "DELETE_UNIT", `Deleted unit "${unit.name}"`);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete unit." });
  }
});

// Edit a unit name
router.patch("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const name = req.body?.name?.trim();

  if (!name) {
    res.status(400).json({ error: "Unit name is required." });
    return;
  }

  try {
    const unit = await prisma.unit.findUnique({ where: { id } });
    if (!unit) {
      res.status(404).json({ error: "Unit not found." });
      return;
    }

    const oldName = unit.name;
    if (oldName === name) {
      res.json({ unit });
      return;
    }

    const existing = await prisma.unit.findUnique({ where: { name } });
    if (existing) {
      res.status(400).json({ error: "A unit with this name already exists." });
      return;
    }

    const updatedUnit = await prisma.$transaction(async (tx) => {
      // 1. Update Unit record itself
      const u = await tx.unit.update({
        where: { id },
        data: { name },
      });

      // 2. Renames in Worker roster
      await tx.worker.updateMany({
        where: { unit: oldName },
        data: { unit: name },
      });

      // 3. Renames in Voter session
      await tx.voter.updateMany({
        where: { unit: oldName },
        data: { unit: name },
      });

      return u;
    });

    await logAction(req, "UPDATE_UNIT", `Renamed unit from "${oldName}" to "${name}"`);
    res.json({ unit: updatedUnit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update unit." });
  }
});

export default router;
