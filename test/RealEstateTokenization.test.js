const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("RealEstateTokenization", function () {
  
  async function deployRealEstateFixture() {
    const [owner, propertyOwner, buyer1, buyer2] = await ethers.getSigners();
    
    const RealEstateTokenization = await ethers.getContractFactory("RealEstateTokenization");
    const realEstate = await RealEstateTokenization.deploy();
    
    return { realEstate, owner, propertyOwner, buyer1, buyer2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { realEstate, owner } = await loadFixture(deployRealEstateFixture);
      expect(await realEstate.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct platform fee", async function () {
      const { realEstate } = await loadFixture(deployRealEstateFixture);
      expect(await realEstate.platformFeePercent()).to.equal(250); // 2.5%
    });

    it("Should start with zero properties", async function () {
      const { realEstate } = await loadFixture(deployRealEstateFixture);
      expect(await realEstate.getTotalProperties()).to.equal(0);
    });
  });

  describe("Property Registration", function () {
    it("Should register a property successfully", async function () {
      const { realEstate, propertyOwner } = await loadFixture(deployRealEstateFixture);
      
      const tx = await realEstate.connect(propertyOwner).registerProperty(
        "Luxury Villa",
        "Miami, FL",
        0, // Residential
        ethers.parseEther("1000"),
        1000,
        ethers.parseEther("1"),
        ethers.parseEther("5"),
        "ipfs://QmExample"
      );
      
      await expect(tx)
        .to.emit(realEstate, "PropertyRegistered")
        .withArgs(1, propertyOwner.address, "Luxury Villa", ethers.parseEther("1000"), 1000);
      
      const property = await realEstate.properties(1);
      expect(property.name).to.equal("Luxury Villa");
      expect(property.totalShares).to.equal(1000);
      expect(property.availableShares).to.equal(1000);
    });

    it("Should mint NFT to property owner", async function () {
      const { realEstate, propertyOwner } = await loadFixture(deployRealEstateFixture);
      
      await realEstate.connect(propertyOwner).registerProperty(
        "Property",
        "Location",
        0,
        ethers.parseEther("100"),
        100,
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        "ipfs://QmTest"
      );
      
      expect(await realEstate.ownerOf(1)).to.equal(propertyOwner.address);
    });

    it("Should assign all shares to property owner initially", async function () {
      const { realEstate, propertyOwner } = await loadFixture(deployRealEstateFixture);
      
      await realEstate.connect(propertyOwner).registerProperty(
        "Property",
        "Location",
        0,
        ethers.parseEther("100"),
        100,
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        "ipfs://QmTest"
      );
      
      const shares = await realEstate.getUserShares(1, propertyOwner.address);
      expect(shares).to.equal(100);
    });

    it("Should fail with zero value", async function () {
      const { realEstate, propertyOwner } = await loadFixture(deployRealEstateFixture);
      
      await expect(
        realEstate.connect(propertyOwner).registerProperty(
          "Property",
          "Location",
          0,
          0, // Zero value
          100,
          ethers.parseEther("1"),
          ethers.parseEther("1"),
          "ipfs://QmTest"
        )
      ).to.be.revertedWith("Value must be > 0");
    });
  });

  describe("Share Purchase", function () {
    it("Should purchase shares successfully", async function () {
      const { realEstate, propertyOwner, buyer1 } = await loadFixture(deployRealEstateFixture);
      
      await realEstate.connect(propertyOwner).registerProperty(
        "Property",
        "Location",
        0,
        ethers.parseEther("100"),
        100,
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        "ipfs://QmTest"
      );
      
      await expect(
        realEstate.connect(buyer1).purchaseShares(1, 10, {
          value: ethers.parseEther("10")
        })
      ).to.emit(realEstate, "SharesPurchased");
      
      const shares = await realEstate.getUserShares(1, buyer1.address);
      expect(shares).to.equal(10);
    });

    it("Should update available shares", async function () {
      const { realEstate, propertyOwner, buyer1 } = await loadFixture(deployRealEstateFixture);
      
      await realEstate.connect(propertyOwner).registerProperty(
        "Property",
        "Location",
        0,
        ethers.parseEther("100"),
        100,
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        "ipfs://QmTest"
      );
      
      await realEstate.connect(buyer1).purchaseShares(1, 10, {
        value: ethers.parseEther("10")
      });
      
      const property = await realEstate.properties(1);
      expect(property.availableShares).to.equal(90);
    });

    it("Should transfer payment to seller minus platform fee", async function () {
      const { realEstate, propertyOwner, buyer1 } = await loadFixture(deployRealEstateFixture);
      
      await realEstate.connect(propertyOwner).registerProperty(
        "Property",
        "Location",
        0,
        ethers.parseEther("100"),
        100,
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        "ipfs://QmTest"
      );
      
      const balanceBefore = await ethers.provider.getBalance(propertyOwner.address);
      
      await realEstate.connect(buyer1).purchaseShares(1, 10, {
        value: ethers.parseEther("10")
      });
      
      const balanceAfter = await ethers.provider.getBalance(propertyOwner.address);
      const received = balanceAfter - balanceBefore;
      
      // Should receive 97.5% (10 CELO - 2.5% fee)
      expect(received).to.be.closeTo(
        ethers.parseEther("9.75"),
        ethers.parseEther("0.01")
      );
    });

    it("Should fail if insufficient payment", async function () {
      const { realEstate, propertyOwner, buyer1 } = await loadFixture(deployRealEstateFixture);
      
      await realEstate.connect(propertyOwner).registerProperty(
        "Property",
        "Location",
        0,
        ethers.parseEther("100"),
        100,
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        "ipfs://QmTest"
      );
      
      await expect(
        realEstate.connect(buyer1).purchaseShares(1, 10, {
          value: ethers.parseEther("5") // Too low
        })
      ).to.be.revertedWith("Insufficient payment");
    });
  });

  describe("Offers", function () {
    it("Should create an offer successfully", async function () {
      const { realEstate, propertyOwner, buyer1 } = await loadFixture(deployRealEstateFixture);
      
      await realEstate.connect(propertyOwner).registerProperty(
        "Property",
        "Location",
        0,
        ethers.parseEther("100"),
        100,
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        "ipfs://QmTest"
      );
      
      await expect(
        realEstate.connect(buyer1).createOffer(
          1,
          20,
          ethers.parseEther("1.2"),
          { value: ethers.parseEther("24") }
        )
      ).to.emit(realEstate, "OfferCreated");
      
      const offer = await realEstate.offers(1);
      expect(offer.sharesOffered).to.equal(20);
      expect(offer.isActive).to.be.true;
    });

    it("Should accept an offer and transfer shares", async function () {
      const { realEstate, propertyOwner, buyer1 } = await loadFixture(deployRealEstateFixture);
      
      await realEstate.connect(propertyOwner).registerProperty(
        "Property",
        "Location",
        0,
        ethers.parseEther("100"),
        100,
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        "ipfs://QmTest"
      );
      
      await realEstate.connect(buyer1).createOffer(
        1,
        20,
        ethers.parseEther("1.2"),
        { value: ethers.parseEther("24") }
      );
      
      await expect(
        realEstate.connect(propertyOwner).acceptOffer(1)
      ).to.emit(realEstate, "OfferAccepted");
      
      const buyerShares = await realEstate.getUserShares(1, buyer1.address);
      expect(buyerShares).to.equal(20);
      
      const sellerShares = await realEstate.getUserShares(1, propertyOwner.address);
      expect(sellerShares).to.equal(80);
    });

    it("Should allow canceling an offer", async function () {
      const { realEstate, propertyOwner, buyer1 } = await loadFixture(deployRealEstateFixture);
      
      await realEstate.connect(propertyOwner).registerProperty(
        "Property",
        "Location",
        0,
        ethers.parseEther("100"),
        100,
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        "ipfs://QmTest"
      );
      
      await realEstate.connect(buyer1).createOffer(
        1,
        20,
        ethers.parseEther("1.2"),
        { value: ethers.parseEther("24") }
      );
      
      await realEstate.connect(buyer1).cancelOffer(1);
      
      const offer = await realEstate.offers(1);
      expect(offer.isActive).to.be.false;
    });
  });

  describe("Rental Income & Dividends", function () {
    it("Should deposit rental income", async function () {
      const { realEstate, propertyOwner } = await loadFixture(deployRealEstateFixture);
      
      await realEstate.connect(propertyOwner).registerProperty(
        "Property",
        "Location",
        0,
        ethers.parseEther("100"),
        100,
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        "ipfs://QmTest"
      );
      
      await expect(
        realEstate.connect(propertyOwner).depositRentalIncome(
          1,
          "January 2024",
          { value: ethers.parseEther("5") }
        )
      ).to.emit(realEstate, "RentalIncomeDeposited");
      
      const unclaimed = await realEstate.getUnclaimedDividends(1);
      expect(unclaimed).to.equal(ethers.parseEther("5"));
    });

    it("Should claim dividends proportionally", async function () {
      const { realEstate, propertyOwner, buyer1 } = await loadFixture(deployRealEstateFixture);
      
      await realEstate.connect(propertyOwner).registerProperty(
        "Property",
        "Location",
        0,
        ethers.parseEther("100"),
        100,
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        "ipfs://QmTest"
      );
      
      // Buyer1 purchases 20% of shares
      await realEstate.connect(buyer1).purchaseShares(1, 20, {
        value: ethers.parseEther("20")
      });
      
      // Deposit rental income
      await realEstate.connect(propertyOwner).depositRentalIncome(
        1,
        "January 2024",
        { value: ethers.parseEther("10") }
      );
      
      const balanceBefore = await ethers.provider.getBalance(buyer1.address);
      
      await realEstate.connect(buyer1).claimDividends(1);
      
      const balanceAfter = await ethers.provider.getBalance(buyer1.address);
      const received = balanceAfter - balanceBefore;
      
      // Should receive 20% of 10 CELO = 2 CELO (minus gas)
      expect(received).to.be.closeTo(
        ethers.parseEther("2"),
        ethers.parseEther("0.1") // Allow for gas costs
      );
    });

    it("Should fail if no dividends to claim", async function () {
      const { realEstate, propertyOwner, buyer1 } = await loadFixture(deployRealEstateFixture);
      
      await realEstate.connect(propertyOwner).registerProperty(
        "Property",
        "Location",
        0,
        ethers.parseEther("100"),
        100,
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        "ipfs://QmTest"
      );
      
      await realEstate.connect(buyer1).purchaseShares(1, 20, {
        value: ethers.parseEther("20")
      });
      
      await expect(
        realEstate.connect(buyer1).claimDividends(1)
      ).to.be.revertedWith("No dividends available");
    });
  });

  describe("Property Verification", function () {
    it("Should allow owner to verify property", async function () {
      const { realEstate, owner, propertyOwner } = await loadFixture(deployRealEstateFixture);
      
      await realEstate.connect(propertyOwner).registerProperty(
        "Property",
        "Location",
        0,
        ethers.parseEther("100"),
        100,
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        "ipfs://QmTest"
      );
      
      await expect(
        realEstate.connect(owner).verifyProperty(1)
      ).to.emit(realEstate, "PropertyVerified");
      
      const property = await realEstate.properties(1);
      expect(property.isVerified).to.be.true;
    });

    it("Should not allow non-owner to verify", async function () {
      const { realEstate, propertyOwner, buyer1 } = await loadFixture(deployRealEstateFixture);
      
      await realEstate.connect(propertyOwner).registerProperty(
        "Property",
        "Location",
        0,
        ethers.parseEther("100"),
        100,
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        "ipfs://QmTest"
      );
      
      await expect(
        realEstate.connect(buyer1).verifyProperty(1)
      ).to.be.revertedWithCustomError(realEstate, "OwnableUnauthorizedAccount");
    });
  });

  describe("Admin Functions", function () {
    it("Should update platform fee", async function () {
      const { realEstate, owner } = await loadFixture(deployRealEstateFixture);
      
      await realEstate.connect(owner).updatePlatformFee(300); // 3%
      expect(await realEstate.platformFeePercent()).to.equal(300);
    });

    it("Should not allow fee above 10%", async function () {
      const { realEstate, owner } = await loadFixture(deployRealEstateFixture);
      
      await expect(
        realEstate.connect(owner).updatePlatformFee(1100)
      ).to.be.revertedWith("Fee too high");
    });

    it("Should withdraw accumulated fees", async function () {
      const { realEstate, owner, propertyOwner, buyer1 } = await loadFixture(deployRealEstateFixture);
      
      await realEstate.connect(propertyOwner).registerProperty(
        "Property",
        "Location",
        0,
        ethers.parseEther("100"),
        100,
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        "ipfs://QmTest"
      );
      
      await realEstate.connect(buyer1).purchaseShares(1, 10, {
        value: ethers.parseEther("10")
      });
      
      const feesBefore = await realEstate.accumulatedFees();
      expect(feesBefore).to.be.gt(0);
      
      await realEstate.connect(owner).withdrawFees();
      
      const feesAfter = await realEstate.accumulatedFees();
      expect(feesAfter).to.equal(0);
    });
  });

  describe("View Functions", function () {
    it("Should return user properties", async function () {
      const { realEstate, propertyOwner } = await loadFixture(deployRealEstateFixture);
      
      await realEstate.connect(propertyOwner).registerProperty(
        "Property 1",
        "Location",
        0,
        ethers.parseEther("100"),
        100,
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        "ipfs://QmTest1"
      );
      
      await realEstate.connect(propertyOwner).registerProperty(
        "Property 2",
        "Location",
        0,
        ethers.parseEther("200"),
        200,
        ethers.parseEther("1"),
        ethers.parseEther("2"),
        "ipfs://QmTest2"
      );
      
      const properties = await realEstate.getUserProperties(propertyOwner.address);
      expect(properties.length).to.equal(2);
    });

    it("Should calculate user dividend correctly", async function () {
      const { realEstate, propertyOwner, buyer1 } = await loadFixture(deployRealEstateFixture);
      
      await realEstate.connect(propertyOwner).registerProperty(
        "Property",
        "Location",
        0,
        ethers.parseEther("100"),
        100,
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        "ipfs://QmTest"
      );
      
      await realEstate.connect(buyer1).purchaseShares(1, 25, {
        value: ethers.parseEther("25")
      });
      
      await realEstate.connect(propertyOwner).depositRentalIncome(
        1,
        "January 2024",
        { value: ethers.parseEther("100") }
      );
      
      const dividend = await realEstate.calculateUserDividend(1, buyer1.address);
      expect(dividend).to.equal(ethers.parseEther("25")); // 25% of 100
    });
  });
});
