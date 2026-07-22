import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { verifyPassword } from "../../lib/crypto";
import { signToken, verifyToken } from "../../lib/jwt";

const router = Router();
const SESSION_COOKIE = "admin_session";
const ONE_DAY = 1000 * 60 * 60 * 24;

router.post("/login", async (req, res) => {
  const email = req.body?.email?.trim();
  const password = req.body?.password;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin || admin.banned) {
      res.status(401).json({ error: "Invalid credentials or account deactivated." });
      return;
    }

    const isValid = verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    const token = await signToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });

    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ONE_DAY,
    });

    res.json({
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred during sign in." });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie(SESSION_COOKIE, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ ok: true });
});

router.get("/me", async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { id: payload.id } });
    if (!admin || admin.banned) {
      res.status(401).json({ error: "Session invalid or account deactivated" });
      return;
    }

    res.json({
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
