const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    const ownerAddress = "0x5029f4b4D2d3c44a32743EfeF8edB0358f6F2c6f".toLowerCase();
    
    try {
        console.log("Clearing old local testnet data from database...");
        await prisma.earning.deleteMany({});
        await prisma.transaction.deleteMany({});
        await prisma.user.deleteMany({});

        console.log("Injecting Owner (User 1) into database...");
            await prisma.user.create({
                data: {
                    walletAddress: ownerAddress,
                    onChainId: 1,
                    referrerAddress: "0x0000000000000000000000000000000000000000",
                    partnersCount: 0
                }
            });
            

            console.log("Success! Owner is now live in the database.");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
