const prisma = require('../src/utils/prisma');
const { ensureDefaultData } = require('../src/utils/bootstrap');

async function main() {
  await ensureDefaultData(prisma);
  console.log('Seed completed');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
