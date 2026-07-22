import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { hashPassword } from "../../lib/crypto";
import { requireSuperAdmin } from "../lib/auth";

const router = Router();

router.get("/", requireSuperAdmin, async (req, res) => {
  try {
    const list = await prisma.admin.findMany({
      orderBy: { createdAt: "desc" },
    });

    const admins = list.map((a) => ({
      id: a.id,
      email: a.email,
      fullName: a.fullName,
      role: a.role,
      banned: a.banned,
      lastSignInAt: null, // Custom database system doesn't track last sign in unless we implement it
      createdAt: a.createdAt,
      isSelf: a.id === req.user!.id,
    }));

    res.json({ admins });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not list admin accounts." });
  }
});

router.post("/", requireSuperAdmin, async (req, res) => {
  const fullName = req.body?.fullName?.trim();
  const email = req.body?.email?.trim();
  const password = req.body?.password;
  const role = req.body?.role === "superadmin" ? "superadmin" : "admin";

  if (!fullName || !email || !password) {
    res.status(400).json({ error: "Name, email, and password are required." });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  try {
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: "An admin with that email already exists." });
      return;
    }

    const passwordHash = hashPassword(password);
    const admin = await prisma.admin.create({
      data: {
        fullName,
        email,
        passwordHash,
        role,
      },
    });

    res.status(201).json({
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create admin account." });
  }
});

router.patch("/:id", requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const action = req.body?.action;

  if (id === req.user!.id && (action === "setRole" || action === "setBanned")) {
    res.status(400).json({ error: "You can't change your own role or status." });
    return;
  }

  try {
    const existing = await prisma.admin.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Admin not found." });
      return;
    }

    if (action === "setRole") {
      const role = req.body?.role === "superadmin" ? "superadmin" : "admin";
      await prisma.admin.update({
        where: { id },
        data: { role },
      });
      res.json({ ok: true });
      return;
    }

    if (action === "setBanned") {
      const banned = Boolean(req.body?.banned);
      await prisma.admin.update({
        where: { id },
        data: { banned },
      });
      res.json({ ok: true });
      return;
    }

    res.status(400).json({ error: "Unknown action." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update admin account." });
  }
});

router.delete("/:id", requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  if (id === req.user!.id) {
    res.status(400).json({ error: "You can't delete your own account." });
    return;
  }

  try {
    const existing = await prisma.admin.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Admin not found." });
      return;
    }

    await prisma.admin.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete admin account." });
  }
});

export default router;
