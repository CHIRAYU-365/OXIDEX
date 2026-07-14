const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OxideXBase Smart Contract", function () {
  let OxideXBase;
  let oxideX;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addr4;
  let addr5;
  let addr6;
  let addr7;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7] = await ethers.getSigners();
    
    // Deploy contract
    const OxideXBaseFactory = await ethers.getContractFactory("OxideXBase");
    oxideX = await OxideXBaseFactory.deploy(owner.address);
    await oxideX.waitForDeployment();
  });

  describe("Deployment & Initialization", function () {
    it("Should set the right owner", async function () {
      expect(await oxideX.owner()).to.equal(owner.address);
    });

    it("Should register owner as user ID 1 with all levels active", async function () {
      const ownerUser = await oxideX.users(owner.address);
      expect(ownerUser.id).to.equal(1n);
      expect(ownerUser.referrer).to.equal(ethers.ZeroAddress);
      
      for (let i = 1; i <= 12; i++) {
        expect(await oxideX.activeLevels_x3(owner.address, i)).to.be.true;
        expect(await oxideX.activeLevels_x4(owner.address, i)).to.be.true;
      }
    });

    it("Should set level prices doubling for each level", async function () {
      const priceL1 = await oxideX.levelPrice(1);
      expect(priceL1).to.equal(ethers.parseEther("0.025"));
      
      const priceL2 = await oxideX.levelPrice(2);
      expect(priceL2).to.equal(ethers.parseEther("0.05"));
      
      const priceL12 = await oxideX.levelPrice(12);
      expect(priceL12).to.equal(ethers.parseEther("51.2"));
    });
  });

  describe("Registration Flow", function () {
    it("Should allow a new user to register under owner", async function () {
      const regCost = await oxideX.REGISTRATION_COST();
      
      await expect(
        oxideX.connect(addr1).registrationExt(owner.address, { value: regCost })
      )
        .to.emit(oxideX, "Registration")
        .withArgs(addr1.address, owner.address, 2n, 1n);

      const user1 = await oxideX.users(addr1.address);
      expect(user1.id).to.equal(2n);
      expect(user1.referrer).to.equal(owner.address);
      
      // Confirm owner partners count increased
      const ownerUser = await oxideX.users(owner.address);
      expect(ownerUser.partnersCount).to.equal(1n);
    });

    it("Should reject registration with incorrect payment value", async function () {
      await expect(
        oxideX.connect(addr1).registrationExt(owner.address, { value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("registration cost is 0.05 ETH");
    });

    it("Should reject registration under non-existent referrer", async function () {
      const regCost = await oxideX.REGISTRATION_COST();
      await expect(
        oxideX.connect(addr1).registrationExt(addr2.address, { value: regCost })
      ).to.be.revertedWith("referrer does not exist");
    });
  });

  describe("x3 Matrix Placement & Reinvest", function () {
    it("Should place referrals in x3 Level 1 and trigger reinvest on 3rd user", async function () {
      const regCost = await oxideX.REGISTRATION_COST();
      
      // Register 3 users under owner directly
      await oxideX.connect(addr1).registrationExt(owner.address, { value: regCost });
      await oxideX.connect(addr2).registrationExt(owner.address, { value: regCost });

      // Owner should have 2 referrals in x3 Level 1
      let x3MatrixOwner = await oxideX.usersX3Matrix(owner.address, 1);
      expect(x3MatrixOwner[1].length).to.equal(2);
      expect(x3MatrixOwner[1][0]).to.equal(addr1.address);
      expect(x3MatrixOwner[1][1]).to.equal(addr2.address);

      // Trigger 3rd user -> should emit Reinvest and clear referrals
      await expect(
        oxideX.connect(addr3).registrationExt(owner.address, { value: regCost })
      )
        .to.emit(oxideX, "Reinvest")
        .withArgs(owner.address, ethers.ZeroAddress, addr3.address, 1, 1);

      x3MatrixOwner = await oxideX.usersX3Matrix(owner.address, 1);
      expect(x3MatrixOwner[1].length).to.equal(0); // referrals cleared
      expect(x3MatrixOwner[3]).to.equal(1n); // reinvestCount = 1
    });
  });

  describe("x4 Matrix Placement & Reinvest", function () {
    it("Should correctly place 6 users in x4 Level 1 and trigger reinvest", async function () {
      const regCost = await oxideX.REGISTRATION_COST();
      
      // User 1 registers under owner
      await oxideX.connect(addr1).registrationExt(owner.address, { value: regCost });
      // User 2 registers under owner
      await oxideX.connect(addr2).registrationExt(owner.address, { value: regCost });

      // Owner first level should be full (addr1 and addr2)
      let x4Owner = await oxideX.usersX4Matrix(owner.address, 1);
      expect(x4Owner[1].length).to.equal(2);
      expect(x4Owner[1][0]).to.equal(addr1.address);
      expect(x4Owner[1][1]).to.equal(addr2.address);

      // User 3 registers under owner -> should be placed on owner's second level under addr1 (firstLevel[0])
      await oxideX.connect(addr3).registrationExt(owner.address, { value: regCost });
      
      let x4Addr1 = await oxideX.usersX4Matrix(addr1.address, 1);
      expect(x4Addr1[1].length).to.equal(1);
      expect(x4Addr1[1][0]).to.equal(addr3.address);

      // Owner second level should contain addr3
      x4Owner = await oxideX.usersX4Matrix(owner.address, 1);
      expect(x4Owner[2].length).to.equal(1);
      expect(x4Owner[2][0]).to.equal(addr3.address);

      // Register addr4, addr5, addr6 under owner
      await oxideX.connect(addr4).registrationExt(owner.address, { value: regCost });
      await oxideX.connect(addr5).registrationExt(owner.address, { value: regCost });
      
      // 6th placement (addr6) should trigger reinvest
      await expect(
        oxideX.connect(addr6).registrationExt(owner.address, { value: regCost })
      )
        .to.emit(oxideX, "Reinvest")
        .withArgs(owner.address, ethers.ZeroAddress, addr6.address, 2, 1);

      x4Owner = await oxideX.usersX4Matrix(owner.address, 1);
      expect(x4Owner[1].length).to.equal(0); // cleared
      expect(x4Owner[2].length).to.equal(0); // cleared
      expect(x4Owner[4]).to.equal(1n); // reinvestCount = 1
    });
  });

  describe("Upgrades & Spillover/Overflow", function () {
    it("Should allow purchasing higher levels", async function () {
      const regCost = await oxideX.REGISTRATION_COST();
      await oxideX.connect(addr1).registrationExt(owner.address, { value: regCost });

      const priceL2 = await oxideX.levelPrice(2);
      await expect(
        oxideX.connect(addr1).buyNewLevel(1, 2, { value: priceL2 })
      )
        .to.emit(oxideX, "Upgrade")
        .withArgs(addr1.address, owner.address, 1, 2);

      expect(await oxideX.activeLevels_x3(addr1.address, 2)).to.be.true;
    });

    it("Should spill over to owner if immediate referrer does not have the level active", async function () {
      const regCost = await oxideX.REGISTRATION_COST();
      
      // addr1 registers under owner
      await oxideX.connect(addr1).registrationExt(owner.address, { value: regCost });
      // addr2 registers under addr1
      await oxideX.connect(addr2).registrationExt(addr1.address, { value: regCost });

      // addr1 does NOT buy Level 2.
      // addr2 buys Level 2 -> payment should spill over to owner (who has L2 active by default)
      const priceL2 = await oxideX.levelPrice(2);
      
      // Expect Upgrade event showing owner as the active referrer for Level 2
      await expect(
        oxideX.connect(addr2).buyNewLevel(1, 2, { value: priceL2 })
      )
        .to.emit(oxideX, "Upgrade")
        .withArgs(addr2.address, owner.address, 1, 2);
    });
  });
});
