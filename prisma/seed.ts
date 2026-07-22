import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.category.create({
    data: {
      slug: "most-dedicated-worker",
      title: "Most Dedicated Worker",
      description:
        "Honoring the individual whose relentless commitment and punctuality define our fellowship's operational excellence.",
      order: 1,
      nominees: {
        create: [{ name: "Dr. Samuel Ade" }, { name: "Sister Ruth Ola" }, { name: "Bro. David Chen" }],
      },
    },
  });

  await prisma.category.create({
    data: {
      slug: "outstanding-team-player",
      title: "Outstanding Team Player",
      description: "For the worker who consistently uplifts and supports every member of their unit.",
      order: 2,
      nominees: { create: [{ name: "Bro. John Okafor" }, { name: "Sister Grace Bello" }] },
    },
  });

  await prisma.category.create({
    data: {
      slug: "unsung-hero",
      title: "Unsung Hero Award",
      description: "Recognizing quiet, behind-the-scenes service that often goes unnoticed.",
      order: 3,
      nominees: { create: [{ name: "Bro. Emeka Nwosu" }, { name: "Sister Blessing Ade" }] },
    },
  });

  console.log("Seeded categories + nominees.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
