const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🏠 Deploying Real Estate Tokenization Platform to Celo...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  
  console.log("📤 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "CELO");
  
  if (parseFloat(hre.ethers.formatEther(balance)) < 0.5) {
    console.log("⚠️  Warning: Low balance. You might need more CELO for deployment.");
  }
  
  console.log();
  console.log("⏳ Deploying RealEstateTokenization contract...");
  
  const RealEstateTokenization = await hre.ethers.getContractFactory("RealEstateTokenization");
  const realEstate = await RealEstateTokenization.deploy();
  
  await realEstate.waitForDeployment();
  
  const contractAddress = await realEstate.getAddress();
  
  console.log("✅ RealEstateTokenization deployed to:", contractAddress);
  console.log();
  
  // Save deployment info
  const deploymentInfo = {
    network: network,
    chainId: hre.network.config.chainId,
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    deploymentTime: new Date().toISOString(),
    blockExplorer: network === "celoSepolia" 
      ? `https://sepolia.celoscan.io/address/${contractAddress}`
      : `https://celoscan.io/address/${contractAddress}`
  };
  
  const fileName = `deployment-${network}.json`;
  fs.writeFileSync(fileName, JSON.stringify(deploymentInfo, null, 2));
  console.log("📝 Deployment info saved to:", fileName);
  console.log();
  
  console.log("🎉 Deployment successful!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 Contract Details:");
  console.log("   Address:", contractAddress);
  console.log("   Network:", network);
  console.log("   Chain ID:", hre.network.config.chainId);
  console.log();
  console.log("🔗 View on Explorer:");
  console.log("  ", deploymentInfo.blockExplorer);
  console.log();
  console.log("💡 Next steps:");
  console.log("   1. Verify contract: node scripts/verify.js");
  console.log("   2. Test contract: node scripts/interact.js");
  console.log("   3. Register your first property!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
