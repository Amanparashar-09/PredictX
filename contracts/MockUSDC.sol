// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Mock USDC Token for testing prediction market
 * - Fixed supply of 1,000,000 USDC for testing
 * - Simple Ownable implementation without OpenZeppelin
 */
contract MockUSDC {
    string public constant name = "USD Coin";
    string public constant symbol = "USDC";
    uint8 public constant decimals = 6;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 public constant totalSupply = 1_000_000 * 10**decimals;

    address public owner;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        _balances[owner] = totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(_balances[from] >= amount, "Insufficient balance");
        require(_allowances[from][msg.sender] >= amount, "Allowance exceeded");
        
        _balances[from] -= amount;
        _balances[to] += amount;
        _allowances[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }

    function allowance(address owner_, address spender) external view returns (uint256) {
        return _allowances[owner_][spender];
    }

    /**
     * @dev Mint tokens to a specific address (only owner)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    /**
     * @dev Burn tokens from a specific address
     */
    function burn(address from, uint256 amount) external onlyOwner {
        require(_balances[from] >= amount, "Insufficient balance");
        _balances[from] -= amount;
        emit Transfer(from, address(0), amount);
    }
}