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

  // Deploy Milestones Contract
  const OxiMilestones = await hre.ethers.getContractFactory("OxiMilestones");
  const milestones = await OxiMilestones.deploy("https://oxidex.com/api/metadata/{id}.json");
  await milestones.waitForDeployment();
  const milestonesAddress = await milestones.getAddress();
  console.log("OxiMilestones deployed to:", milestonesAddress);

  // Link Contracts
  console.log("Linking contracts...");
  let tx;
  
  tx = await oxideX.setContracts(tokenAddress, milestonesAddress);
  await tx.wait(1);
  console.log("- OxideXBase linked");
  
  tx = await token.setMatrixContract(oxideXAddress);
  await tx.wait(1);
  console.log("- OxiToken linked");
  
  tx = await milestones.setMatrixContract(oxideXAddress);
  await tx.wait(1);
  console.log("- OxiMilestones linked");

  console.log("All contracts successfully deployed and linked!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
