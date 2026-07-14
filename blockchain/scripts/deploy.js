const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contract with the account:", deployer.address);

  const OxideXBase = await hre.ethers.getContractFactory("OxideXBase");
  const oxideX = await OxideXBase.deploy(deployer.address);

  await oxideX.waitForDeployment();

  const address = await oxideX.getAddress();
  console.log("OxideXBase deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
