import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../lib/auth";
import { logAction } from "../lib/logger";

const router = Router();

// Get all categories with nominees and vote counts
router.get("/", requireAuth, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      include: {
        nominees: {
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: { votes: true },
            },
          },
        },
      },
    });

    res.json({ categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch categories." });
  }
});

// Create a new category and its nominees
router.post("/", requireAuth, async (req, res) => {
  const { title, description, order, nominees, unit } = req.body;

  if (!title || !description) {
    res.status(400).json({ error: "Title and description are required." });
    return;
  }

  const nomineeNames: string[] = Array.isArray(nominees)
    ? nominees.map((n: any) => String(n).trim()).filter(Boolean)
    : [];

  if (nomineeNames.length === 0) {
    res.status(400).json({ error: "At least one nominee is required." });
    return;
  }

  const categoryUnit = unit ? String(unit).trim() : "All Units";
  const slugBase = categoryUnit === "All Units" ? title : `${title}-${categoryUnit}`;
  const slug = slugBase
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  try {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      res.status(400).json({ error: "A category with a similar title and unit already exists." });
      return;
    }

    const category = await prisma.category.create({
      data: {
        title: title.trim(),
        slug,
        description: description.trim(),
        order: Number(order ?? 0),
        unit: categoryUnit,
        nominees: {
          create: nomineeNames.map((name) => ({ name })),
        },
      },
      include: {
        nominees: true,
      },
    });

    await logAction(req, "CREATE_CATEGORY", `Created category "${category.title}" with ${nomineeNames.length} nominees`);
    res.status(201).json({ category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create category." });
  }
});

// Update a category and sync its nominees
router.patch("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { title, description, order, nominees, unit } = req.body;

  if (!title || !description) {
    res.status(400).json({ error: "Title and description are required." });
    return;
  }

  // Expect nominees payload as: [{ id?: string, name: string }]
  const nomineePayload: { id?: string; name: string }[] = Array.isArray(nominees)
    ? nominees
        .map((n: any) => ({
          id: n.id ? String(n.id) : undefined,
          name: String(n.name || "").trim(),
        }))
        .filter((n) => n.name)
    : [];

  if (nomineePayload.length === 0) {
    res.status(400).json({ error: "At least one nominee is required." });
    return;
  }

  const categoryUnit = unit ? String(unit).trim() : "All Units";
  const slugBase = categoryUnit === "All Units" ? title : `${title}-${categoryUnit}`;
  const slug = slugBase
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { nominees: true },
    });

    if (!category) {
      res.status(404).json({ error: "Category not found." });
      return;
    }

    // Check slug uniqueness if title or unit changed
    if (slug !== category.slug) {
      const existing = await prisma.category.findUnique({ where: { slug } });
      if (existing) {
        res.status(400).json({ error: "A category with a similar title and unit already exists." });
        return;
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update basic category info
      await tx.category.update({
        where: { id },
        data: {
          title: title.trim(),
          slug,
          description: description.trim(),
          order: Number(order ?? 0),
          unit: categoryUnit,
        },
      });

      // 2. Identify nominees to delete (present in DB but missing in payload)
      const payloadIds = nomineePayload.map((n) => n.id).filter(Boolean) as string[];
      const toDelete = category.nominees.filter((dbNom) => !payloadIds.includes(dbNom.id));

      if (toDelete.length > 0) {
        const deleteIds = toDelete.map((n) => n.id);
        // First delete votes for these nominees to prevent foreign key errors
        await tx.vote.deleteMany({
          where: { nomineeId: { in: deleteIds } },
        });
        // Then delete the nominees
        await tx.nominee.deleteMany({
          where: { id: { in: deleteIds } },
        });
      }

      // 3. Create or Update nominees
      for (const nom of nomineePayload) {
        if (nom.id) {
          // Update existing nominee
          await tx.nominee.update({
            where: { id: nom.id },
            data: { name: nom.name },
          });
        } else {
          // Create new nominee
          await tx.nominee.create({
            data: {
              name: nom.name,
              categoryId: id,
            },
          });
        }
      }
    });

    await logAction(req, "UPDATE_CATEGORY", `Updated category "${title}"`);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update category." });
  }
});

// Delete a category and clean up votes/nominees
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      res.status(404).json({ error: "Category not found." });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete all votes cast in this category
      await tx.vote.deleteMany({ where: { categoryId: id } });
      // 2. Delete all nominees in this category
      await tx.nominee.deleteMany({ where: { categoryId: id } });
      // 3. Delete the category itself
      await tx.category.delete({ where: { id } });
    });

    await logAction(req, "DELETE_CATEGORY", `Deleted category "${category.title}"`);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete category." });
  }
});

export default router;
