const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const network = hre.network.name;
  const deploymentFile = `deployment-${network}.json`;

  if (!fs.existsSync(deploymentFile)) {
    console.error(`❌ No deployment found for network: ${network}`);
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contractAddress = deploymentInfo.contractAddress;

  console.log("🏠 Real Estate Tokenization - Contract Interaction");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📍 Contract:", contractAddress);
  console.log("📡 Network:", network);
  console.log();

  const realEstate = await hre.ethers.getContractAt("RealEstateTokenization", contractAddress);
  const [signer] = await hre.ethers.getSigners();

  console.log("👤 Your account:", signer.address);
  const balance = await hre.ethers.provider.getBalance(signer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "CELO");
  console.log();

  // Get contract stats
  console.log("📊 Contract Statistics:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const totalProperties = await realEstate.getTotalProperties();
  const totalOffers = await realEstate.getTotalOffers();
  const platformFee = await realEstate.platformFeePercent();
  const accumulatedFees = await realEstate.accumulatedFees();

  console.log("Total Properties:", totalProperties.toString());
  console.log("Total Offers:", totalOffers.toString());
  console.log("Platform Fee:", (Number(platformFee) / 100).toFixed(2), "%");
  console.log("Accumulated Fees:", hre.ethers.formatEther(accumulatedFees), "CELO");
  console.log();

  console.log("💡 Example Commands:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  console.log("\n1. Register a Property:");
  console.log(`
const tx = await realEstate.registerProperty(
  "Luxury Apartment Downtown",
  "San Francisco, CA",
  0, // PropertyType.Residential
  ethers.parseEther("500"), // 500 CELO total value
  1000, // 1000 shares
  ethers.parseEther("0.5"), // 0.5 CELO per share
  ethers.parseEther("2"), // 2 CELO monthly rental
  "ipfs://QmPropertyDetails..."
);
await tx.wait();
  `);

  console.log("\n2. Purchase Shares:");
  console.log(`
const tx = await realEstate.purchaseShares(
  1, // propertyId
  10, // 10 shares
  { value: ethers.parseEther("5") } // 10 * 0.5 CELO
);
await tx.wait();
  `);

  console.log("\n3. Create Offer to Buy Shares:");
  console.log(`
const tx = await realEstate.createOffer(
  1, // propertyId
  50, // want 50 shares
  ethers.parseEther("0.55"), // offer 0.55 CELO per share
  { value: ethers.parseEther("27.5") } // 50 * 0.55
);
await tx.wait();
  `);

  console.log("\n4. Deposit Rental Income:");
  console.log(`
const tx = await realEstate.depositRentalIncome(
  1, // propertyId
  "January 2024",
  { value: ethers.parseEther("2") } // 2 CELO rental
);
await tx.wait();
  `);

  console.log("\n5. Claim Dividends:");
  console.log(`
const tx = await realEstate.claimDividends(1); // propertyId
await tx.wait();
  `);

  console.log();
  console.log("🔗 View on Explorer:", deploymentInfo.blockExplorer);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
