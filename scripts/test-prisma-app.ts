import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL);
  const users = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log("Users via app-style client:", users);

  const op = await prisma.user.findUnique({
    where: { email: "operatore@zootropolis.it" },
  });
  if (op) {
    console.log(
      "Password check:",
      await bcrypt.compare("Operatore123!", op.password)
    );
  } else {
    console.log("Operator NOT FOUND");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
