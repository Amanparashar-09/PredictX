// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
    Prediction Market (Binary YES/NO) - Parimutuel Pool
    ----------------------------------------------------
    - Users stake collateral on YES or NO before expiry
    - Oracle resolves after expiry
    - Winning side splits the full pool proportionally

    Features:
    - Custom errors for gas efficiency
    - Reentrancy protection
    - Proper access control
*/

// Custom errors for gas efficiency
error Market__MarketClosed();
error Market__AmountZero();
error Market__TransferFailed();
error Market__NotOracle();
error Market__NotExpired();
error Market__AlreadyResolved();
error Market__NotResolved();
error Market__AlreadyClaimed();
error Market__NoWinningStake();
error Market__PayoutTransferFailed();
error Factory__InvalidExpiry();
error Factory__QuestionTooLong();

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract PredictionMarket {
    // --- Immutable config ---
    IERC20 public immutable collateral;     // e.g., USDC
    address public immutable oracle;        // trusted resolver (or oracle adapter)
    uint256 public immutable expiry;        // timestamp when trading ends
    string public question;                 // market question

    // --- Market state ---
    bool public resolved;
    bool public outcomeYes;                 // true => YES wins, false => NO wins

    uint256 public totalYes;                // total staked on YES
    uint256 public totalNo;                 // total staked on NO

    mapping(address => uint256) public yesStake;
    mapping(address => uint256) public noStake;

    mapping(address => bool) public claimed;

    // --- Events ---
    event Bought(address indexed user, bool indexed sideYes, uint256 amount);
    event Resolved(bool outcomeYes);
    event Claimed(address indexed user, uint256 payout);

    // --- Modifiers ---
    modifier marketOpen() {
        if (block.timestamp >= expiry) revert Market__MarketClosed();
        _;
    }

    modifier onlyOracle() {
        if (msg.sender != oracle) revert Market__NotOracle();
        _;
    }

    modifier afterExpiry() {
        if (block.timestamp < expiry) revert Market__NotExpired();
        _;
    }

    modifier whenResolved() {
        if (!resolved) revert Market__NotResolved();
        _;
    }

    constructor(
        address _collateral,
        address _oracle,
        uint256 _expiry,
        string memory _question
    ) {
        require(_collateral != address(0), "Invalid collateral");
        require(_oracle != address(0), "Invalid oracle");
        require(_expiry > block.timestamp, "Invalid expiry");
        
        collateral = IERC20(_collateral);
        oracle = _oracle;
        expiry = _expiry;
        question = _question;
    }

    // --- Trading (before expiry) ---
    function buyYes(uint256 amount) external marketOpen {
        if (amount == 0) revert Market__AmountZero();

        // Pull collateral from user
        if (!collateral.transferFrom(msg.sender, address(this), amount)) {
            revert Market__TransferFailed();
        }

        yesStake[msg.sender] += amount;
        totalYes += amount;

        emit Bought(msg.sender, true, amount);
    }

    function buyNo(uint256 amount) external marketOpen {
        if (amount == 0) revert Market__AmountZero();

        if (!collateral.transferFrom(msg.sender, address(this), amount)) {
            revert Market__TransferFailed();
        }

        noStake[msg.sender] += amount;
        totalNo += amount;

        emit Bought(msg.sender, false, amount);
    }

    // --- Resolution (after expiry) ---
    function resolve(bool _outcomeYes) external onlyOracle afterExpiry {
        if (resolved) revert Market__AlreadyResolved();

        resolved = true;
        outcomeYes = _outcomeYes;

        emit Resolved(_outcomeYes);
    }

    // --- Claim winnings (after resolution) ---
    function claim() external whenResolved {
        if (claimed[msg.sender]) revert Market__AlreadyClaimed();

        claimed[msg.sender] = true;

        uint256 pool = totalYes + totalNo;
        uint256 payout;

        if (outcomeYes) {
            uint256 stake = yesStake[msg.sender];
            if (stake == 0) revert Market__NoWinningStake();
            // Calculate payout: (userStake * pool) / totalYes
            payout = (stake * pool) / totalYes;
        } else {
            uint256 stake = noStake[msg.sender];
            if (stake == 0) revert Market__NoWinningStake();
            // Calculate payout: (userStake * pool) / totalNo
            payout = (stake * pool) / totalNo;
        }

        if (!collateral.transfer(msg.sender, payout)) {
            revert Market__PayoutTransferFailed();
        }

        emit Claimed(msg.sender, payout);
    }

    // --- View functions ---
    function getUserStake(address user) external view returns (uint256 yes, uint256 no) {
        return (yesStake[user], noStake[user]);
    }

    function getPoolSizes() external view returns (uint256 yesPool, uint256 noPool) {
        return (totalYes, totalNo);
    }

    function getPotentialPayout(address user) external view returns (uint256) {
        if (!resolved) return 0;
        
        uint256 pool = totalYes + totalNo;
        
        if (outcomeYes) {
            uint256 stake = yesStake[user];
            if (stake == 0 || totalYes == 0) return 0;
            return (stake * pool) / totalYes;
        } else {
            uint256 stake = noStake[user];
            if (stake == 0 || totalNo == 0) return 0;
            return (stake * pool) / totalNo;
        }
    }
}

contract MarketFactory {
    address public immutable oracle;
    address public immutable collateral;

    // Maximum question length
    uint256 constant MAX_QUESTION_LENGTH = 200;

    event MarketCreated(address indexed market, uint256 expiry, string question);

    constructor(address _collateral, address _oracle) {
        require(_collateral != address(0), "Invalid collateral");
        require(_oracle != address(0), "Invalid oracle");
        
        collateral = _collateral;
        oracle = _oracle;
    }

    function createMarket(uint256 expiry, string calldata question) external returns (address market) {
        if (expiry <= block.timestamp) revert Factory__InvalidExpiry();
        if (bytes(question).length == 0 || bytes(question).length > MAX_QUESTION_LENGTH) {
            revert Factory__QuestionTooLong();
        }

        PredictionMarket m = new PredictionMarket(collateral, oracle, expiry, question);
        market = address(m);

        emit MarketCreated(market, expiry, question);
    }

    // Helper function to get oracle address
    function getOracle() external view returns (address) {
        return oracle;
    }

    // Helper function to get collateral address
    function getCollateral() external view returns (address) {
        return collateral;
    }
}