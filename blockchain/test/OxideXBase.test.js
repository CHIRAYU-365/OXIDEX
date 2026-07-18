const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OxideXBase Smart Contract (Unilevel Token Launchpad)", function () {
  let OxideXBase, OxiToken;
  let oxideX, token;
  let owner, addr1, addr2, addr3, addr4, addr5, addr6;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4, addr5, addr6] = await ethers.getSigners();
    
    // Deploy OxideXBase
    const OxideXBaseFactory = await ethers.getContractFactory("OxideXBase");
    oxideX = await OxideXBaseFactory.deploy(owner.address);
    await oxideX.waitForDeployment();

    // Deploy OxiToken
    const OxiTokenFactory = await ethers.getContractFactory("OxiToken");
    token = await OxiTokenFactory.deploy();
    await token.waitForDeployment();

    // Link contracts
    await oxideX.setToken(await token.getAddress());
    await token.setLaunchpadContract(await oxideX.getAddress());
  });

  describe("Deployment & Initialization", function () {
    it("Should set the right owner", async function () {
      expect(await oxideX.owner()).to.equal(owner.address);
    });

    it("Should register owner as user ID 1", async function () {
      const ownerUser = await oxideX.users(owner.address);
      expect(ownerUser.id).to.equal(1n);
      expect(ownerUser.referrer).to.equal(ethers.ZeroAddress);
    });

    it("Should set level commissions correctly", async function () {
      expect(await oxideX.levelCommissions(1)).to.equal(1000n); // 10%
      expect(await oxideX.levelCommissions(5)).to.equal(100n); // 1%
    });
  });

  describe("Token Purchase Flow", function () {
    it("Should allow a new user to buy tokens and mint OXI", async function () {
      const ethAmount = ethers.parseEther("0.1"); // 0.1 ETH
      // Token price is 0.0001 ETH per token, so 0.1 ETH should buy 1000 tokens
      // 0.1 / 0.0001 = 1000 tokens (times 10^18 for decimals)
      
      await expect(
        oxideX.connect(addr1).buyLaunchpadTokens(owner.address, { value: ethAmount })
      )
        .to.emit(oxideX, "Registration")
        .withArgs(addr1.address, owner.address, 2n, 1n)
        .and.to.emit(oxideX, "TokensPurchased")
        .withArgs(addr1.address, ethers.parseEther("1000"), ethAmount);

      const user1 = await oxideX.users(addr1.address);
      expect(user1.id).to.equal(2n);
      expect(user1.referrer).to.equal(owner.address);
      
      const balance = await token.balanceOf(addr1.address);
      expect(balance).to.equal(ethers.parseEther("1000"));
    });

    it("Should distribute unilevel commissions correctly", async function () {
      const ethAmount = ethers.parseEther("1.0"); // 1 ETH
      
      // Chain of referrals: owner -> addr1 -> addr2 -> addr3 -> addr4 -> addr5 -> addr6
      await oxideX.connect(addr1).buyLaunchpadTokens(owner.address, { value: ethers.parseEther("0.01") });
      await oxideX.connect(addr2).buyLaunchpadTokens(addr1.address, { value: ethers.parseEther("0.01") });
      await oxideX.connect(addr3).buyLaunchpadTokens(addr2.address, { value: ethers.parseEther("0.01") });
      await oxideX.connect(addr4).buyLaunchpadTokens(addr3.address, { value: ethers.parseEther("0.01") });
      await oxideX.connect(addr5).buyLaunchpadTokens(addr4.address, { value: ethers.parseEther("0.01") });
      
      // Now addr6 buys 1.0 ETH
      // Level 1: addr5 gets 10% (0.1 ETH)
      // Level 2: addr4 gets 5% (0.05 ETH)
      // Level 3: addr3 gets 3% (0.03 ETH)
      // Level 4: addr2 gets 2% (0.02 ETH)
      // Level 5: addr1 gets 1% (0.01 ETH)
      // Total distributed: 21% (0.21 ETH)
      
      const tx = await oxideX.connect(addr6).buyLaunchpadTokens(addr5.address, { value: ethAmount });
      
      await expect(tx).to.emit(oxideX, "CommissionPaid").withArgs(addr6.address, addr5.address, 1, ethers.parseEther("0.1"));
      await expect(tx).to.emit(oxideX, "CommissionPaid").withArgs(addr6.address, addr4.address, 2, ethers.parseEther("0.05"));
      await expect(tx).to.emit(oxideX, "CommissionPaid").withArgs(addr6.address, addr3.address, 3, ethers.parseEther("0.03"));
      await expect(tx).to.emit(oxideX, "CommissionPaid").withArgs(addr6.address, addr2.address, 4, ethers.parseEther("0.02"));
      await expect(tx).to.emit(oxideX, "CommissionPaid").withArgs(addr6.address, addr1.address, 5, ethers.parseEther("0.01"));
    });
  });
});
