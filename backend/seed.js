const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to generate a random mock ethereum address
function generateRandomAddress() {
  const chars = '0123456789abcdef';
  let addr = '0x';
  for (let i = 0; i < 40; i++) {
    addr += chars[Math.floor(Math.random() * chars.length)];
  }
  return addr;
}

// Helper to get random number between min and max
function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

async function main() {
  console.log('Seeding HEAVY demo data for OXIDEX...');

  // Wipe the slate clean to prevent unique constraint errors from previous seeds
  console.log('Cleaning up old mock data...');
  await prisma.earning.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.user.deleteMany();
  await prisma.platformStats.deleteMany();

  // The main user wallet from deployment
  const rootWallet = '0x5029f4b4d2d3c44a32743efef8edb0358f6f2c6f'.toLowerCase();

  const users = [
    { 
      walletAddress: rootWallet, 
      onChainId: 1, 
      referrerAddress: null, 
      partnersCount: 0, 
      totalEarnings: 24.5 
    }
  ];

  // Generate 40 additional random users to build a massive tree
  const totalUsers = 40;
  for (let i = 2; i <= totalUsers; i++) {
    // Pick a random referrer from the already created users
    // Skew the logic slightly so early users (like root) get more direct partners
    const referrerIndex = Math.floor(Math.pow(Math.random(), 2) * users.length);
    const referrer = users[referrerIndex];
    
    // Increment the referrer's partner count locally
    referrer.partnersCount += 1;

    users.push({
      walletAddress: generateRandomAddress(),
      onChainId: i,
      referrerAddress: referrer.walletAddress,
      partnersCount: 0,
      totalEarnings: parseFloat(getRandom(0, 5).toFixed(4))
    });
  }

  console.log(`Generated ${users.length} mock users. Inserting into database...`);

  // Insert the clean batch of users
  for (const u of users) {
    await prisma.user.create({
      data: u
    });
  }

  // Add a bunch of Earning History for root wallet to make history page look full
  const earnings = [];
  for (let i = 0; i < 15; i++) {
    earnings.push({
      userAddress: rootWallet,
      level: Math.floor(Math.random() * 5) + 1,
      amount: parseFloat(getRandom(0.01, 1.5).toFixed(4)),
      fromAddress: users[Math.floor(Math.random() * users.length)].walletAddress,
      txHash: generateRandomAddress(), // mock tx hash
      earnedAt: new Date(Date.now() - Math.random() * 86400000 * 30) // random date in last 30 days
    });
  }

  for (const e of earnings) {
    await prisma.earning.create({ data: e });
  }

  // Add some Transactions
  for (let i = 0; i < 10; i++) {
    await prisma.transaction.create({
      data: {
        txHash: generateRandomAddress(),
        userAddress: rootWallet,
        eventType: 'TokensPurchased',
        amount: parseFloat(getRandom(0.5, 5).toFixed(4)),
        tokensAmount: Math.floor(getRandom(1000, 50000)),
        blockNumber: 1234500 + i,
        blockTimestamp: new Date(Date.now() - Math.random() * 86400000 * 30),
      }
    });
  }

  // Seed Platform Stats to look impressive
  await prisma.platformStats.upsert({
    where: { id: 1 },
    update: { totalUsers: 1842, totalVolume: 12456.78, volume24h: 342.15, users24h: 89 },
    create: { id: 1, totalUsers: 1842, totalVolume: 12456.78, volume24h: 342.15, users24h: 89 }
  });

  console.log('Successfully seeded database with HEAVY demo data!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
