import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("\n=== Prediction Market Deploy ===");
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Network:  ${(await ethers.provider.getNetwork()).name}\n`);

  // ── Deploy MockUSDC ───────────────────────────────────────────────────────
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const usdcAddress = await mockUSDC.getAddress();
  console.log(`✓ MockUSDC deployed:    ${usdcAddress}`);

  // ── Deploy SimpleOracle ───────────────────────────────────────────────────
  const SimpleOracle = await ethers.getContractFactory("SimpleOracle");
  const simpleOracle = await SimpleOracle.deploy();
  await simpleOracle.waitForDeployment();
  const oracleAddress = await simpleOracle.getAddress();
  console.log(`✓ SimpleOracle deployed: ${oracleAddress}`);

  // ── Deploy MarketFactory ──────────────────────────────────────────────────
  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  const marketFactory = await MarketFactory.deploy(usdcAddress, oracleAddress);
  await marketFactory.waitForDeployment();
  const factoryAddress = await marketFactory.getAddress();
  console.log(`✓ MarketFactory deployed: ${factoryAddress}`);

  // ── Create demo markets ───────────────────────────────────────────────────
  const latestBlock = await ethers.provider.getBlock("latest");
  const now = latestBlock!.timestamp;

  const demoMarkets = [
    {
      question: "Will Bitcoin exceed $150,000 by end of 2025?",
      expiryOffset: 60 * 24 * 60 * 60, // 60 days
    },
    {
      question: "Will Ethereum ETF see $10B inflows in 2025?",
      expiryOffset: 90 * 24 * 60 * 60, // 90 days
    },
    {
      question: "Will the Fed cut rates in Q3 2025?",
      expiryOffset: 30 * 24 * 60 * 60, // 30 days
    },
  ];

  const marketAddresses: string[] = [];

  for (const demo of demoMarkets) {
    const expiry = now + demo.expiryOffset;
    const tx = await marketFactory.createMarket(expiry, demo.question);
    const receipt = await tx.wait();

    const event = receipt?.logs.find((log: any) => {
      try { return log.fragment?.name === "MarketCreated"; } catch { return false; }
    }) as any;

    const marketAddr = event?.args?.market;
    if (marketAddr) {
      marketAddresses.push(marketAddr);
      console.log(`✓ Market created: ${marketAddr}`);
      console.log(`  "${demo.question}"`);
    }
  }

  // ── Fund test accounts ────────────────────────────────────────────────────
  const signers = await ethers.getSigners();
  const mintAmount = ethers.parseUnits("10000", 6); // 10,000 USDC each

  const funded: string[] = [];
  for (let i = 1; i < Math.min(signers.length, 5); i++) {
    await mockUSDC.mint(signers[i].address, mintAmount);
    funded.push(signers[i].address);
  }
  console.log(`\n✓ Minted 10,000 USDC to ${funded.length} test accounts`);
  funded.forEach((a) => console.log(`  ${a}`));

  // ── Write deployed-addresses.json ─────────────────────────────────────────
  const addresses = {
    usdc: usdcAddress,
    oracle: oracleAddress,
    factory: factoryAddress,
    markets: marketAddresses,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };

  // Write to backend/
  const backendPath = path.join(__dirname, "..", "..", "backend", "deployed-addresses.json");
  fs.writeFileSync(backendPath, JSON.stringify(addresses, null, 2));
  console.log(`\n✓ Addresses written to: ${backendPath}`);

  // Write to frontend/src/lib/
  const frontendPath = path.join(__dirname, "..", "..", "frontend", "src", "lib", "deployed-addresses.json");
  fs.writeFileSync(frontendPath, JSON.stringify(addresses, null, 2));
  console.log(`✓ Addresses written to: ${frontendPath}`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n=== Deployment Summary ===");
  console.log(`USDC:    ${usdcAddress}`);
  console.log(`Oracle:  ${oracleAddress}`);
  console.log(`Factory: ${factoryAddress}`);
  console.log(`Markets: ${marketAddresses.length} created`);
  marketAddresses.forEach((a) => console.log(`  ${a}`));

  console.log("\n=== Next Steps ===");
  console.log("1. Copy Hardhat account #0 private key to backend/.env as ORACLE_PRIVATE_KEY");
  console.log("   (printed by `npx hardhat node`)");
  console.log("2. Start backend:  cd backend && npm run dev");
  console.log("3. Start frontend: cd frontend && npm run dev");
  console.log("4. Add MetaMask network: RPC http://127.0.0.1:8545, Chain ID 31337");
  console.log("5. Import a Hardhat test account into MetaMask using its private key\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });