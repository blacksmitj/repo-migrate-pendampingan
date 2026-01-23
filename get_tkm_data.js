const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const tkm = await prisma.participants.findFirst({
      include: {
        profiles: {
          include: {
            users: true
          }
        },
        businesses: true,
        participant_groups: true
      }
    });

    if (tkm) {
      console.log('--- 1 Data TKM Found ---');
      console.log(JSON.stringify(tkm, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2));
    } else {
      console.log('No TKM data found.');
    }
  } catch (error) {
    console.error('Error fetching TKM data:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
