const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const colors = await prisma.color.findMany();
  console.log('Colors in database:', JSON.stringify(colors, null, 2));
  await prisma.$disconnect();
})();
