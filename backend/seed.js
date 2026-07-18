const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data for OXIDEX...');

  // The main user wallet from deployment
  const rootWallet = '0x5029f4b4d2d3c44a32743efef8edb0358f6f2c6f'.toLowerCase();

  // Create Users (Building a Tree)
  const users = [
    { walletAddress: rootWallet, onChainId: 1, referrerAddress: null, partnersCount: 2, totalEarnings: 12.5 },
    { walletAddress: '0x1234567890123456789012345678901234567890', onChainId: 2, referrerAddress: rootWallet, partnersCount: 2, totalEarnings: 3.2 },
    { walletAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', onChainId: 3, referrerAddress: rootWallet, partnersCount: 1, totalEarnings: 1.1 },
    { walletAddress: '0x9999999999999999999999999999999999999999', onChainId: 4, referrerAddress: '0x1234567890123456789012345678901234567890', partnersCount: 0, totalEarnings: 0 },
    { walletAddress: '0x8888888888888888888888888888888888888888', onChainId: 5, referrerAddress: '0x1234567890123456789012345678901234567890', partnersCount: 0, totalEarnings: 0 },
    { walletAddress: '0x7777777777777777777777777777777777777777', onChainId: 6, referrerAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', partnersCount: 0, totalEarnings: 0 },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { walletAddress: u.walletAddress },
      update: u,
      create: u
    });
  }

  // Add Earning History for root wallet
  const earnings = [
    { userAddress: rootWallet, level: 1, amount: 0.1, fromAddress: '0x1234567890123456789012345678901234567890', txHash: '0xa1b2c3d4e5f6', earnedAt: new Date(Date.now() - 86400000 * 2) },
    { userAddress: rootWallet, level: 1, amount: 0.1, fromAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', txHash: '0xa1b2c3d4e5f7', earnedAt: new Date(Date.now() - 86400000 * 1) },
    { userAddress: rootWallet, level: 2, amount: 0.05, fromAddress: '0x9999999999999999999999999999999999999999', txHash: '0xa1b2c3d4e5f8', earnedAt: new Date() },
  ];

  for (const e of earnings) {
    await prisma.earning.create({ data: e });
  }

  // Add Transactions
  await prisma.transaction.create({
    data: {
      txHash: '0xa1b2c3d4e5f9',
      userAddress: rootWallet,
      eventType: 'TokensPurchased',
      amount: 1.5,
      tokensAmount: 15000,
      blockNumber: 1234567,
      blockTimestamp: new Date(),
    }
  });

  // Seed Platform Stats
  await prisma.platformStats.upsert({
    where: { id: 1 },
    update: { totalUsers: 142, totalVolume: 456.78 },
    create: { id: 1, totalUsers: 142, totalVolume: 456.78 }
  });

  console.log('Successfully seeded database with demo data!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
