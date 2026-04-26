import { expect } from "chai";
import { ethers, network } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("PredictionMarket", function () {
  let mockUSDC: any;
  let oracle: any;
  let factory: any;
  let market: any;
  let owner: any;
  let user1: any;
  let user2: any;
  let oracleSigner: any;

  const USDC_DECIMALS = 6;
  const ONE_USDC = ethers.parseUnits("1", USDC_DECIMALS);
  const HUNDRED_USDC = ethers.parseUnits("100", USDC_DECIMALS);
  const THOUSAND_USDC = ethers.parseUnits("1000", USDC_DECIMALS);

  beforeEach(async function () {
    [owner, user1, user2, oracleSigner] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();

    // Deploy SimpleOracle
    const SimpleOracle = await ethers.getContractFactory("SimpleOracle");
    oracle = await SimpleOracle.deploy();
    await oracle.waitForDeployment();

    // Deploy MarketFactory
    const MarketFactory = await ethers.getContractFactory("MarketFactory");
    factory = await MarketFactory.deploy(
      await mockUSDC.getAddress(),
      await oracle.getAddress()
    );
    await factory.waitForDeployment();

    // Create a test market with 1 day expiry
    const expiry = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
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
      await expect(market.connect(user1).buyYes(0)).to.be.revertedWith(
        "Market__AmountZero()"
      );
    });

    it("should fail after market expiry", async function () {
      // Fast forward time past expiry
      await time.increase(24 * 60 * 60 + 1);

      await expect(market.connect(user1).buyYes(HUNDRED_USDC)).to.be.revertedWith(
        "Market__MarketClosed()"
      );
    });

    it("should fail if transfer fails", async function () {
      // Try to buy without approval - should fail
      const userWithoutApproval = owner;
      await expect(
        market.connect(userWithoutApproval).buyYes(HUNDRED_USDC)
      ).to.be.revertedWith("Market__TransferFailed()");
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
      await expect(market.connect(user1).buyNo(0)).to.be.revertedWith(
        "Market__AmountZero()"
      );
    });

    it("should fail after market expiry", async function () {
      await time.increase(24 * 60 * 60 + 1);

      await expect(market.connect(user1).buyNo(HUNDRED_USDC)).to.be.revertedWith(
        "Market__MarketClosed()"
      );
    });
  });

  describe("Resolution", function () {
    beforeEach(async function () {
      // User1 buys YES, User2 buys NO
      await market.connect(user1).buyYes(HUNDRED_USDC);
      await market.connect(user2).buyNo(HUNDRED_USDC);
    });

    it("should allow oracle to resolve with YES", async function () {
      await time.increase(24 * 60 * 60 + 1);

      await expect(market.connect(owner).resolve(true))
        .to.emit(market, "Resolved")
        .withArgs(true);

      expect(await market.resolved()).to.equal(true);
      expect(await market.outcomeYes()).to.equal(true);
    });

    it("should allow oracle to resolve with NO", async function () {
      await time.increase(24 * 60 * 60 + 1);

      await expect(market.connect(owner).resolve(false))
        .to.emit(market, "Resolved")
        .withArgs(false);

      expect(await market.resolved()).to.equal(true);
      expect(await market.outcomeYes()).to.equal(false);
    });

    it("should fail if not called by oracle", async function () {
      await time.increase(24 * 60 * 60 + 1);

      await expect(market.connect(user1).resolve(true)).to.be.revertedWith(
        "Market__NotOracle()"
      );
    });

    it("should fail before expiry", async function () {
      await expect(market.connect(owner).resolve(true)).to.be.revertedWith(
        "Market__NotExpired()"
      );
    });

    it("should fail if already resolved", async function () {
      await time.increase(24 * 60 * 60 + 1);

      await market.connect(owner).resolve(true);
      await expect(market.connect(owner).resolve(false)).to.be.revertedWith(
        "Market__AlreadyResolved()"
      );
    });
  });

  describe("Claiming winnings", function () {
    beforeEach(async function () {
      // User1 buys YES (100 USDC), User2 buys NO (100 USDC)
      await market.connect(user1).buyYes(HUNDRED_USDC);
      await market.connect(user2).buyNo(HUNDRED_USDC);
    });

    it("should allow winner to claim full pool", async function () {
      // Resolve with YES (user1 wins)
      await time.increase(24 * 60 * 60 + 1);
      await market.connect(owner).resolve(true);

      const user1BalanceBefore = await mockUSDC.balanceOf(user1.address);

      // User1 claims - should get 200 USDC (their 100 + user2's 100)
      await expect(market.connect(user1).claim())
        .to.emit(market, "Claimed")
        .withArgs(user1.address, ethers.parseUnits("200", USDC_DECIMALS));

      const user1BalanceAfter = await mockUSDC.balanceOf(user1.address);
      expect(user1BalanceAfter - user1BalanceBefore).to.equal(
        ethers.parseUnits("200", USDC_DECIMALS)
      );
    });

    it("should fail if market not resolved", async function () {
      await expect(market.connect(user1).claim()).to.be.revertedWith(
        "Market__NotResolved()"
      );
    });

    it("should fail if already claimed", async function () {
      await time.increase(24 * 60 * 60 + 1);
      await market.connect(owner).resolve(true);

      await market.connect(user1).claim();
      await expect(market.connect(user1).claim()).to.be.revertedWith(
        "Market__AlreadyClaimed()"
      );
    });

    it("should fail if no winning stake", async function () {
      await time.increase(24 * 60 * 60 + 1);
      await market.connect(owner).resolve(true);

      // user2 has NO stake, trying to claim on YES outcome
      await expect(market.connect(user2).claim()).to.be.revertedWith(
        "Market__NoWinningStake()"
      );
    });

    it("should work correctly when NO wins", async function () {
      // Resolve with NO (user2 wins)
      await time.increase(24 * 60 * 60 + 1);
      await market.connect(owner).resolve(false);

      const user2BalanceBefore = await mockUSDC.balanceOf(user2.address);

      // User2 claims - should get 200 USDC
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
      await market.connect(owner).resolve(true);

      const payout = await market.getPotentialPayout(user1.address);
      // User1 staked 100, total YES = 100, total pool = 200
      // Payout = (100 * 200) / 100 = 200
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
    it("should create a new market", async function () {
      const expiry = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

      await expect(factory.createMarket(expiry, "Test question?"))
        .to.emit(factory, "MarketCreated");

      const markets = await factory.getOracle();
      expect(markets).to.equal(await oracle.getAddress());
    });

    it("should fail with past expiry", async function () {
      const pastExpiry = Math.floor(Date.now() / 1000) - 100;

      await expect(
        factory.createMarket(pastExpiry, "Test question?")
      ).to.be.revertedWith("Factory__InvalidExpiry()");
    });

    it("should fail with empty question", async function () {
      const expiry = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

      await expect(factory.createMarket(expiry, "")).to.be.revertedWith(
        "Factory__QuestionTooLong()"
      );
    });
  });

  describe("Helper functions", function () {
    it("getOracle should return oracle address", async function () {
      expect(await factory.getOracle()).to.equal(await oracle.getAddress());
    });

    it("getCollateral should return collateral address", async function () {
      expect(await factory.getCollateral()).to.equal(
        await mockUSDC.getAddress()
      );
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
});

describe("SimpleOracle", function () {
  let oracle: any;
  let owner: any;
  let user1: any;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const SimpleOracle = await ethers.getContractFactory("SimpleOracle");
    oracle = await SimpleOracle.deploy();
    await oracle.waitForDeployment();
  });

  it("should allow owner to resolve market with YES", async function () {
    const marketAddress = user1.address; // Using user1 address as mock market

    await expect(oracle.resolveYes(marketAddress))
      .to.emit(oracle, "MarketResolved")
      .withArgs(marketAddress, true, await time.latest());

    expect(await oracle.isResolved(marketAddress)).to.equal(true);
    expect(await oracle.getOutcome(marketAddress)).to.equal(true);
  });

  it("should allow owner to resolve market with NO", async function () {
    const marketAddress = user1.address;

    await expect(oracle.resolveNo(marketAddress))
      .to.emit(oracle, "MarketResolved")
      .withArgs(marketAddress, false, await time.latest());

    expect(await oracle.isResolved(marketAddress)).to.equal(true);
    expect(await oracle.getOutcome(marketAddress)).to.equal(false);
  });

  it("should allow owner to resolve with generic resolve function", async function () {
    const marketAddress = user1.address;

    await oracle.resolve(marketAddress, true);
    expect(await oracle.isResolved(marketAddress)).to.equal(true);
  });

  it("should fail if non-owner tries to resolve", async function () {
    const marketAddress = user1.address;

    await expect(
      oracle.connect(user1).resolve(marketAddress, true)
    ).to.be.revertedWithCustomError(oracle, "OwnableUnauthorizedAccount");
  });

  it("should fail if market already resolved", async function () {
    const marketAddress = user1.address;

    await oracle.resolveYes(marketAddress);
    await expect(oracle.resolveNo(marketAddress)).to.be.revertedWith(
      "Already resolved"
    );
  });
});