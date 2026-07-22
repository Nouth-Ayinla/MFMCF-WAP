import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const unit = (req.query.unit as string)?.trim() ?? "";
  const isFiltered = !!(unit && unit !== "All Units");
  const where = isFiltered ? { voter: { unit } } : {};

  const [votes, uniqueWorkers, totalMembersCount, dbUnitCount] = await Promise.all([
    prisma.vote.findMany({
      where,
      include: { voter: true, nominee: true, category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.worker.findMany({
      select: { unit: true },
      distinct: ["unit"],
    }),
    isFiltered
      ? prisma.worker.count({ where: { unit } })
      : prisma.worker.count(),
    prisma.unit.count(),
  ]);

  const totalVotes = votes.length;

  const uniqueVoterIds = new Set(votes.map((v) => v.voterId));
  const participatingMembers = uniqueVoterIds.size;

  const unitCounts = new Map<string, number>();
  for (const v of votes) {
    unitCounts.set(v.voter.unit, (unitCounts.get(v.voter.unit) ?? 0) + 1);
  }
  const participatingUnits = unitCounts.size;
  const topUnitEntry = [...unitCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  const categoryMap = new Map<string, { title: string; nominees: Map<string, { name: string; votes: number }> }>();
  for (const v of votes) {
    if (!categoryMap.has(v.categoryId)) {
      categoryMap.set(v.categoryId, { title: v.category.title, nominees: new Map() });
    }
    const cat = categoryMap.get(v.categoryId)!;
    const existing = cat.nominees.get(v.nomineeId);
    cat.nominees.set(v.nomineeId, { name: v.nominee.name, votes: (existing?.votes ?? 0) + 1 });
  }
  const leaderboard = [...categoryMap.values()].map((cat) => ({
    title: cat.title,
    nominees: [...cat.nominees.values()].sort((a, b) => b.votes - a.votes).slice(0, 3),
  }));

  const recentActivity = votes.slice(0, 8).map((v) => ({
    id: v.id,
    voterUnit: v.voter.unit,
    categoryTitle: v.category.title,
    createdAt: v.createdAt,
  }));

  // Use DB unit count if set, else fall back to unique workers' units
  const totalUnits = dbUnitCount > 0
    ? dbUnitCount
    : uniqueWorkers.map((w) => w.unit).filter(Boolean).length;

  res.json({
    totalVotes,
    participatingUnits,
    totalUnits,
    topVotingUnit: topUnitEntry ? { unit: topUnitEntry[0], votes: topUnitEntry[1] } : null,
    leaderboard,
    recentActivity,
    isFiltered,
    participatingMembers,
    totalMembers: totalMembersCount,
  });
});

export default router;
