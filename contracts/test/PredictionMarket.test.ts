import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("PredictionMarket", function () {
  let mockUSDC: any;
  let oracle: any;
  let factory: any;
  let market: any;
  let owner: any;
  let user1: any;
  let user2: any;

  const USDC_DECIMALS = 6;
  const HUNDRED_USDC = ethers.parseUnits("100", USDC_DECIMALS);
  const THOUSAND_USDC = ethers.parseUnits("1000", USDC_DECIMALS);

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();

    // Deploy SimpleOracle (owner of oracle = owner signer)
    const SimpleOracle = await ethers.getContractFactory("SimpleOracle");
    oracle = await SimpleOracle.deploy();
    await oracle.waitForDeployment();

    // Deploy MarketFactory — oracle address is the SimpleOracle contract
    const MarketFactory = await ethers.getContractFactory("MarketFactory");
    factory = await MarketFactory.deploy(
      await mockUSDC.getAddress(),
      await oracle.getAddress()
    );
    await factory.waitForDeployment();

    // Create a test market with 1 day expiry — use EVM time not wall clock
    const latestBlock = await time.latest();
    const expiry = latestBlock + 24 * 60 * 60;
    const tx = await factory.createMarket(expiry, "Will BTC reach $100k?");
    const receipt = await tx.wait();

    // Find market address from event
    const marketCreatedEvent = receipt?.logs.find((log: any) => {
      try {
        return log.fragment?.name === "MarketCreated";
      } catch {
        return false;
      }
    });
    market = await ethers.getContractAt(
      "PredictionMarket",
      marketCreatedEvent.args.market
    );

    // Mint USDC to test users
    await mockUSDC.mint(user1.address, THOUSAND_USDC);
    await mockUSDC.mint(user2.address, THOUSAND_USDC);

    // Approve market to spend USDC
    await mockUSDC.connect(user1).approve(await market.getAddress(), THOUSAND_USDC);
    await mockUSDC.connect(user2).approve(await market.getAddress(), THOUSAND_USDC);
  });

  describe("Deployment", function () {
    it("should set correct collateral token", async function () {
      expect(await market.collateral()).to.equal(await mockUSDC.getAddress());
    });

    it("should set correct oracle", async function () {
      // The market oracle must be the SimpleOracle contract address
      expect(await market.oracle()).to.equal(await oracle.getAddress());
    });

    it("should set correct question", async function () {
      expect(await market.question()).to.equal("Will BTC reach $100k?");
    });

    it("should start unresolved", async function () {
      expect(await market.resolved()).to.equal(false);
    });
  });

  describe("Trading - buyYes", function () {
    it("should allow buying YES with valid amount", async function () {
      await expect(market.connect(user1).buyYes(HUNDRED_USDC))
        .to.emit(market, "Bought")
        .withArgs(user1.address, true, HUNDRED_USDC);

      expect(await market.yesStake(user1.address)).to.equal(HUNDRED_USDC);
      expect(await market.totalYes()).to.equal(HUNDRED_USDC);
    });

    it("should fail with zero amount", async function () {
      await expect(market.connect(user1).buyYes(0))
        .to.be.revertedWithCustomError(market, "Market__AmountZero");
    });

    it("should fail after market expiry", async function () {
      await time.increase(24 * 60 * 60 + 1);
      await expect(market.connect(user1).buyYes(HUNDRED_USDC))
        .to.be.revertedWithCustomError(market, "Market__MarketClosed");
    });

    it("should fail if user has insufficient allowance", async function () {
      // owner has USDC (initial supply) but no approval set for market
      await expect(
        market.connect(owner).buyYes(HUNDRED_USDC)
      ).to.be.revertedWith("Allowance exceeded");
    });
  });

  describe("Trading - buyNo", function () {
    it("should allow buying NO with valid amount", async function () {
      await expect(market.connect(user1).buyNo(HUNDRED_USDC))
        .to.emit(market, "Bought")
        .withArgs(user1.address, false, HUNDRED_USDC);

      expect(await market.noStake(user1.address)).to.equal(HUNDRED_USDC);
      expect(await market.totalNo()).to.equal(HUNDRED_USDC);
    });

    it("should fail with zero amount", async function () {
      await expect(market.connect(user1).buyNo(0))
        .to.be.revertedWithCustomError(market, "Market__AmountZero");
    });

    it("should fail after market expiry", async function () {
      await time.increase(24 * 60 * 60 + 1);
      await expect(market.connect(user1).buyNo(HUNDRED_USDC))
        .to.be.revertedWithCustomError(market, "Market__MarketClosed");
    });
  });

  describe("Resolution", function () {
    beforeEach(async function () {
      await market.connect(user1).buyYes(HUNDRED_USDC);
      await market.connect(user2).buyNo(HUNDRED_USDC);
    });

    it("should allow oracle to resolve with YES via resolveMarket()", async function () {
      await time.increase(24 * 60 * 60 + 1);
      const marketAddr = await market.getAddress();

      // owner calls oracle.resolveMarket() → oracle calls market.resolve()
      await expect(oracle.connect(owner).resolveMarket(marketAddr, true))
        .to.emit(market, "Resolved")
        .withArgs(true);

      expect(await market.resolved()).to.equal(true);
      expect(await market.outcomeYes()).to.equal(true);
    });

    it("should allow oracle to resolve with NO via resolveMarket()", async function () {
      await time.increase(24 * 60 * 60 + 1);
      const marketAddr = await market.getAddress();

      await expect(oracle.connect(owner).resolveMarket(marketAddr, false))
        .to.emit(market, "Resolved")
        .withArgs(false);

      expect(await market.resolved()).to.equal(true);
      expect(await market.outcomeYes()).to.equal(false);
    });

    it("should allow oracle to resolve via resolveYes()", async function () {
      await time.increase(24 * 60 * 60 + 1);
      const marketAddr = await market.getAddress();

      await expect(oracle.connect(owner).resolveYes(marketAddr))
        .to.emit(market, "Resolved")
        .withArgs(true);

      expect(await market.resolved()).to.equal(true);
    });

    it("should allow oracle to resolve via resolveNo()", async function () {
      await time.increase(24 * 60 * 60 + 1);
      const marketAddr = await market.getAddress();

      await expect(oracle.connect(owner).resolveNo(marketAddr))
        .to.emit(market, "Resolved")
        .withArgs(false);

      expect(await market.resolved()).to.equal(true);
    });

    it("should fail if non-owner tries to call oracle.resolveMarket", async function () {
      await time.increase(24 * 60 * 60 + 1);
      const marketAddr = await market.getAddress();

      await expect(
        oracle.connect(user1).resolveMarket(marketAddr, true)
      ).to.be.revertedWithCustomError(oracle, "OwnableUnauthorizedAccount");
    });

    it("should fail if anyone calls market.resolve() directly (not oracle contract)", async function () {
      await time.increase(24 * 60 * 60 + 1);
      // Even owner calling market.resolve() directly must fail — only oracle contract is authorized
      await expect(market.connect(owner).resolve(true))
        .to.be.revertedWithCustomError(market, "Market__NotOracle");
      await expect(market.connect(user1).resolve(true))
        .to.be.revertedWithCustomError(market, "Market__NotOracle");
    });

    it("should fail before expiry", async function () {
      const marketAddr = await market.getAddress();
      // Oracle tries to resolve before expiry — market.resolve() reverts with Market__NotExpired
      await expect(
        oracle.connect(owner).resolveMarket(marketAddr, true)
      ).to.be.revertedWithCustomError(market, "Market__NotExpired");
    });

    it("should fail if already resolved", async function () {
      await time.increase(24 * 60 * 60 + 1);
      const marketAddr = await market.getAddress();

      await oracle.connect(owner).resolveMarket(marketAddr, true);
      // Second call fails at oracle level with "Already resolved"
      await expect(
        oracle.connect(owner).resolveMarket(marketAddr, false)
      ).to.be.revertedWith("Already resolved");
    });

    it("oracle should also store resolution data", async function () {
      await time.increase(24 * 60 * 60 + 1);
      const marketAddr = await market.getAddress();

      await oracle.connect(owner).resolveMarket(marketAddr, true);
      expect(await oracle.isResolved(marketAddr)).to.equal(true);
      expect(await oracle.getOutcome(marketAddr)).to.equal(true);
    });
  });

  describe("Claiming winnings", function () {
    beforeEach(async function () {
      await market.connect(user1).buyYes(HUNDRED_USDC);
      await market.connect(user2).buyNo(HUNDRED_USDC);
    });

    it("should allow winner to claim full pool when YES wins", async function () {
      await time.increase(24 * 60 * 60 + 1);
      await oracle.connect(owner).resolveMarket(await market.getAddress(), true);

      const user1BalanceBefore = await mockUSDC.balanceOf(user1.address);

      await expect(market.connect(user1).claim())
        .to.emit(market, "Claimed")
        .withArgs(user1.address, ethers.parseUnits("200", USDC_DECIMALS));

      const user1BalanceAfter = await mockUSDC.balanceOf(user1.address);
      expect(user1BalanceAfter - user1BalanceBefore).to.equal(
        ethers.parseUnits("200", USDC_DECIMALS)
      );
    });

    it("should fail if market not resolved", async function () {
      await expect(market.connect(user1).claim())
        .to.be.revertedWithCustomError(market, "Market__NotResolved");
    });

    it("should fail if already claimed", async function () {
      await time.increase(24 * 60 * 60 + 1);
      await oracle.connect(owner).resolveMarket(await market.getAddress(), true);

      await market.connect(user1).claim();
      await expect(market.connect(user1).claim())
        .to.be.revertedWithCustomError(market, "Market__AlreadyClaimed");
    });

    it("should fail if no winning stake", async function () {
      await time.increase(24 * 60 * 60 + 1);
      await oracle.connect(owner).resolveMarket(await market.getAddress(), true);

      // user2 only has NO stake, outcome is YES — no winning stake
      await expect(market.connect(user2).claim())
        .to.be.revertedWithCustomError(market, "Market__NoWinningStake");
    });

    it("should work correctly when NO wins", async function () {
      await time.increase(24 * 60 * 60 + 1);
      await oracle.connect(owner).resolveMarket(await market.getAddress(), false);

      const user2BalanceBefore = await mockUSDC.balanceOf(user2.address);

      await expect(market.connect(user2).claim())
        .to.emit(market, "Claimed")
        .withArgs(user2.address, ethers.parseUnits("200", USDC_DECIMALS));

      const user2BalanceAfter = await mockUSDC.balanceOf(user2.address);
      expect(user2BalanceAfter - user2BalanceBefore).to.equal(
        ethers.parseUnits("200", USDC_DECIMALS)
      );
    });
  });

  describe("View functions", function () {
    beforeEach(async function () {
      await market.connect(user1).buyYes(HUNDRED_USDC);
      await market.connect(user2).buyNo(HUNDRED_USDC);
    });

    it("getUserStake should return correct stakes", async function () {
      const [yes, no] = await market.getUserStake(user1.address);
      expect(yes).to.equal(HUNDRED_USDC);
      expect(no).to.equal(0);
    });

    it("getPoolSizes should return correct pool sizes", async function () {
      const [yesPool, noPool] = await market.getPoolSizes();
      expect(yesPool).to.equal(HUNDRED_USDC);
      expect(noPool).to.equal(HUNDRED_USDC);
    });

    it("getPotentialPayout should return 0 before resolution", async function () {
      const payout = await market.getPotentialPayout(user1.address);
      expect(payout).to.equal(0);
    });

    it("getPotentialPayout should return correct payout after resolution", async function () {
      await time.increase(24 * 60 * 60 + 1);
      await oracle.connect(owner).resolveMarket(await market.getAddress(), true);

      const payout = await market.getPotentialPayout(user1.address);
      // user1 staked 100, totalYes=100, pool=200 → payout = (100*200)/100 = 200
      expect(payout).to.equal(ethers.parseUnits("200", USDC_DECIMALS));
    });
  });
});

describe("MarketFactory", function () {
  let mockUSDC: any;
  let oracle: any;
  let factory: any;
  let owner: any;
  let user1: any;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();

    const SimpleOracle = await ethers.getContractFactory("SimpleOracle");
    oracle = await SimpleOracle.deploy();
    await oracle.waitForDeployment();

    const MarketFactory = await ethers.getContractFactory("MarketFactory");
    factory = await MarketFactory.deploy(
      await mockUSDC.getAddress(),
      await oracle.getAddress()
    );
    await factory.waitForDeployment();
  });

  describe("Creating markets", function () {
    it("should create a new market and emit event", async function () {
      const expiry = (await time.latest()) + 7 * 24 * 60 * 60;
      await expect(factory.createMarket(expiry, "Test question?"))
        .to.emit(factory, "MarketCreated");
    });

    it("should fail with past expiry", async function () {
      const pastExpiry = (await time.latest()) - 100;
      await expect(
        factory.createMarket(pastExpiry, "Test question?")
      ).to.be.revertedWithCustomError(factory, "Factory__InvalidExpiry");
    });

    it("should fail with empty question", async function () {
      const expiry = (await time.latest()) + 7 * 24 * 60 * 60;
      await expect(
        factory.createMarket(expiry, "")
      ).to.be.revertedWithCustomError(factory, "Factory__QuestionTooLong");
    });

    it("should fail with question exceeding 200 chars", async function () {
      const expiry = (await time.latest()) + 7 * 24 * 60 * 60;
      const longQuestion = "A".repeat(201);
      await expect(
        factory.createMarket(expiry, longQuestion)
      ).to.be.revertedWithCustomError(factory, "Factory__QuestionTooLong");
    });
  });

  describe("Helper functions", function () {
    it("getOracle should return oracle address", async function () {
      expect(await factory.getOracle()).to.equal(await oracle.getAddress());
    });

    it("getCollateral should return collateral address", async function () {
      expect(await factory.getCollateral()).to.equal(await mockUSDC.getAddress());
    });
  });
});

describe("MockUSDC", function () {
  let mockUSDC: any;
  let owner: any;
  let user1: any;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
  });

  it("should have correct decimals (6)", async function () {
    expect(await mockUSDC.decimals()).to.equal(6);
  });

  it("should have correct name and symbol", async function () {
    expect(await mockUSDC.name()).to.equal("USD Coin");
    expect(await mockUSDC.symbol()).to.equal("USDC");
  });

  it("should mint initial supply to owner", async function () {
    const ownerBalance = await mockUSDC.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseUnits("1000000", 6));
  });

  it("should allow owner to mint to other addresses", async function () {
    const mintAmount = ethers.parseUnits("1000", 6);
    await mockUSDC.mint(user1.address, mintAmount);
    expect(await mockUSDC.balanceOf(user1.address)).to.equal(mintAmount);
  });

  it("should allow owner to burn from addresses", async function () {
    const mintAmount = ethers.parseUnits("1000", 6);
    await mockUSDC.mint(user1.address, mintAmount);
    await mockUSDC.burn(user1.address, mintAmount);
    expect(await mockUSDC.balanceOf(user1.address)).to.equal(0);
  });

  it("should transfer tokens correctly", async function () {
    const amount = ethers.parseUnits("100", 6);
    await mockUSDC.transfer(user1.address, amount);
    expect(await mockUSDC.balanceOf(user1.address)).to.equal(amount);
  });

  it("should approve and transferFrom correctly", async function () {
    const amount = ethers.parseUnits("100", 6);
    await mockUSDC.approve(user1.address, amount);
    await mockUSDC.connect(user1).transferFrom(owner.address, user1.address, amount);
    expect(await mockUSDC.balanceOf(user1.address)).to.equal(amount);
  });
});

describe("SimpleOracle (with real market)", function () {
  let oracle: any;
  let mockUSDC: any;
  let factory: any;
  let market: any;
  let owner: any;
  let user1: any;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();

    const SimpleOracle = await ethers.getContractFactory("SimpleOracle");
    oracle = await SimpleOracle.deploy();
    await oracle.waitForDeployment();

    const MarketFactory = await ethers.getContractFactory("MarketFactory");
    factory = await MarketFactory.deploy(
      await mockUSDC.getAddress(),
      await oracle.getAddress()
    );
    await factory.waitForDeployment();

    // Deploy a real market so oracle can call market.resolve()
    const latestBlock = await time.latest();
    const expiry = latestBlock + 24 * 60 * 60;
    const tx = await factory.createMarket(expiry, "Oracle test market?");
    const receipt = await tx.wait();
    const marketCreatedEvent = receipt?.logs.find((log: any) => {
      try { return log.fragment?.name === "MarketCreated"; } catch { return false; }
    });
    market = await ethers.getContractAt("PredictionMarket", marketCreatedEvent.args.market);

    // Advance past expiry so oracle can resolve
    await time.increase(24 * 60 * 60 + 1);
  });

  it("should allow owner to resolve market with YES via resolveYes", async function () {
    const marketAddr = await market.getAddress();

    await expect(oracle.resolveYes(marketAddr))
      .to.emit(oracle, "MarketResolved");

    expect(await oracle.isResolved(marketAddr)).to.equal(true);
    expect(await oracle.getOutcome(marketAddr)).to.equal(true);
    expect(await market.resolved()).to.equal(true);
  });

  it("should allow owner to resolve market with NO via resolveNo", async function () {
    const marketAddr = await market.getAddress();

    await expect(oracle.resolveNo(marketAddr))
      .to.emit(oracle, "MarketResolved");

    expect(await oracle.isResolved(marketAddr)).to.equal(true);
    expect(await oracle.getOutcome(marketAddr)).to.equal(false);
    expect(await market.resolved()).to.equal(true);
  });

  it("should allow owner to resolve with generic resolveMarket function", async function () {
    const marketAddr = await market.getAddress();
    await oracle.resolveMarket(marketAddr, true);
    expect(await oracle.isResolved(marketAddr)).to.equal(true);
    expect(await market.resolved()).to.equal(true);
  });

  it("should fail if non-owner tries to resolve", async function () {
    const marketAddr = await market.getAddress();
    await expect(
      oracle.connect(user1).resolveYes(marketAddr)
    ).to.be.revertedWithCustomError(oracle, "OwnableUnauthorizedAccount");
  });

  it("should fail if market already resolved", async function () {
    const marketAddr = await market.getAddress();
    await oracle.resolveYes(marketAddr);
    await expect(oracle.resolveNo(marketAddr)).to.be.revertedWith(
      "Already resolved"
    );
  });

  it("getOutcome should revert for unresolved market", async function () {
    const marketAddr = await market.getAddress();
    await expect(oracle.getOutcome(marketAddr)).to.be.revertedWith(
      "Not resolved"
    );
  });
});