import { PrismaClient, Prisma } from "../../generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'
// Singleton Prisma pour éviter les connexions multiples en développement (HMR)
// const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// export const prisma =
//   globalForPrisma.prisma ||
//   new PrismaClient({
//     accelerateUrl: process.env.DATABASE_URL!,
//     ...(process.env.NODE_ENV === "development" && {
//       log: ["query", "error", "warn"],
//     }),
//   } as ConstructorParameters<typeof PrismaClient>[0]);

// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

export const prisma = new PrismaClient({
adapter
});

export { Prisma };