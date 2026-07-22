import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { VOTER_COOKIE } from "../../lib/identity";

const router = Router();

router.get("/", async (req, res) => {
  const voterId = req.cookies?.[VOTER_COOKIE];
  if (!voterId) {
    res.status(401).json({ error: "Not verified. Please verify first." });
    return;
  }

  try {
    const voter = await prisma.voter.findUnique({
      where: { id: voterId },
      select: { unit: true },
    });

    if (!voter) {
      res.status(401).json({ error: "Voter session not found. Please verify again." });
      return;
    }

    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { unit: "All Units" },
          { unit: voter.unit },
        ],
      },
      orderBy: { order: "asc" },
      include: { nominees: { orderBy: { name: "asc" } } },
    });

    const existingVotes = await prisma.vote.findMany({
      where: { voterId },
      select: { categoryId: true, nomineeId: true },
    });
    const votedMap = Object.fromEntries(existingVotes.map((v) => [v.categoryId, v.nomineeId]));

    res.json({ categories, votedMap });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load ballot." });
  }
});

export default router;
