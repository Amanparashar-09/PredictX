import { ethers } from "hardhat";

async function main() {
  console.log("Deploying contracts...");

  // Deploy MockUSDC (collateral token)
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const usdcAddress = await mockUSDC.getAddress();
  console.log(`MockUSDC deployed to: ${usdcAddress}`);

  // Deploy SimpleOracle
  const SimpleOracle = await ethers.getContractFactory("SimpleOracle");
  const simpleOracle = await SimpleOracle.deploy();
  await simpleOracle.waitForDeployment();
  const oracleAddress = await simpleOracle.getAddress();
  console.log(`SimpleOracle deployed to: ${oracleAddress}`);

  // Deploy MarketFactory
  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  const marketFactory = await MarketFactory.deploy(usdcAddress, oracleAddress);
  await marketFactory.waitForDeployment();
  const factoryAddress = await marketFactory.getAddress();
  console.log(`MarketFactory deployed to: ${factoryAddress}`);

  // Create a test market
  // Set expiry to 7 days from now
  const expiry = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  const question = "Will Bitcoin exceed $100,000 by end of 2025?";
  
  const tx = await marketFactory.createMarket(expiry, question);
  const receipt = await tx.wait();
  
  // Find the MarketCreated event
  const marketCreatedEvent = receipt?.logs.find((log: any) => {
    try {
      return log.fragment?.name === "MarketCreated";
    } catch {
      return false;
    }
  });
  
  let marketAddress = "0x";
  if (marketCreatedEvent) {
    marketAddress = marketCreatedEvent.args?.market;
  }
  console.log(`Test Market created at: ${marketAddress}`);

  // Get some test accounts
  const [deployer, user1, user2] = await ethers.getSigners();
  
  // Mint some USDC to test users
  const mintAmount = ethers.parseUnits("1000", 6); // 1000 USDC
  await mockUSDC.mint(user1.address, mintAmount);
  await mockUSDC.mint(user2.address, mintAmount);
  console.log(`Minted 1000 USDC to user1: ${user1.address}`);
  console.log(`Minted 1000 USDC to user2: ${user2.address}`);

  // Approve market to spend USDC
  const approveAmount = ethers.parseUnits("1000", 6);
  await mockUSDC.connect(user1).approve(marketAddress, approveAmount);
  await mockUSDC.connect(user2).approve(marketAddress, approveAmount);
  console.log("Approved markets to spend USDC for test users");

  console.log("\n=== Deployment Summary ===");
  console.log(`USDC: ${usdcAddress}`);
  console.log(`Oracle: ${oracleAddress}`);
  console.log(`Factory: ${factoryAddress}`);
  console.log(`Test Market: ${marketAddress}`);
  console.log("\nSave these addresses for frontend configuration!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });