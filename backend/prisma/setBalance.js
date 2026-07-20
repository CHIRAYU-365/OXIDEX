const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Set the deployer's OXI token balance to 10000
  const walletAddress = "0x5029f4b4d2d3c44a32743efef8edb0358f6f2c6f";
  
  const user = await prisma.user.findUnique({
    where: { walletAddress }
  });

  if (user) {
    await prisma.user.update({
      where: { walletAddress },
      data: { oxiTokenBalance: 10000 }
    });
    console.log(`✅ Set oxiTokenBalance to 10000 for ${walletAddress}`);
  } else {
    console.log(`⚠️  User ${walletAddress} not found in DB. They may need to register first.`);
    console.log("The balance will be set to 10000 once they register via the launchpad.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
