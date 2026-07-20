import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy Matrix Contract
  const OxideXBase = await hre.ethers.getContractFactory("OxideXBase");
  const oxideX = await OxideXBase.deploy(deployer.address);
  await oxideX.waitForDeployment();
  const oxideXAddress = await oxideX.getAddress();
  console.log("OxideXBase deployed to:", oxideXAddress);

  // Deploy Token Contract
  const OxiToken = await hre.ethers.getContractFactory("OxiToken");
  const token = await OxiToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("OxiToken deployed to:", tokenAddress);

  // Deploy NFT VIP Pass Contract
  const OxideXNFT = await hre.ethers.getContractFactory("OxideXNFT");
  const nft = await OxideXNFT.deploy(tokenAddress);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("OxideXNFT deployed to:", nftAddress);

  // Link Contracts
  console.log("Linking contracts...");
  let tx;
  
  tx = await oxideX.setToken(tokenAddress);
  await tx.wait(1);
  console.log("- OxideXBase linked to OxiToken");
  
  tx = await token.setLaunchpadContract(oxideXAddress);
  await tx.wait(1);
  console.log("- OxiToken linked to OxideXBase");

  tx = await oxideX.setNFTContract(nftAddress);
  await tx.wait(1);
  console.log("- OxideXBase linked to OxideXNFT");

  console.log("All contracts successfully deployed and linked!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
