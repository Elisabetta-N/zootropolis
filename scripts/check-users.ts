import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, password: true },
  });
  console.log("Users in DB:", users.length);
  for (const u of users) {
    const okOp = await bcrypt.compare("Operatore123!", u.password);
    const okAd = await bcrypt.compare("Admin123!", u.password);
    console.log(
      `${u.email} | role=${u.role} | hashLen=${u.password.length} | Operatore123!=${okOp} | Admin123!=${okAd}`
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
