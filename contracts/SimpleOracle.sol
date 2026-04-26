// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev Simple Oracle for resolving prediction markets
 * - Only owner can resolve markets
 * - Stores resolution data for each market
 */
contract SimpleOracle is Ownable {
    // Mapping from market address to resolution status and outcome
    struct MarketResolution {
        bool resolved;
        bool outcomeYes;
        uint256 timestamp;
    }

    mapping(address => MarketResolution) public resolutions;

    event MarketResolved(address indexed market, bool outcomeYes, uint256 timestamp);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Resolve a market with YES outcome
     */
    function resolveYes(address market) external onlyOwner {
        _resolve(market, true);
    }

    /**
     * @dev Resolve a market with NO outcome
     */
    function resolveNo(address market) external onlyOwner {
        _resolve(market, false);
    }

    /**
     * @dev Resolve a market with specified outcome
     */
    function resolve(address market, bool outcomeYes) external onlyOwner {
        _resolve(market, outcomeYes);
    }

    /**
     * @dev Internal resolve function
     */
    function _resolve(address market, bool outcomeYes) internal {
        require(market != address(0), "Invalid market address");
        require(!resolutions[market].resolved, "Already resolved");

        resolutions[market] = MarketResolution({
            resolved: true,
            outcomeYes: outcomeYes,
            timestamp: block.timestamp
        });

        emit MarketResolved(market, outcomeYes, block.timestamp);
    }

    /**
     * @dev Check if a market is resolved
     */
    function isResolved(address market) external view returns (bool) {
        return resolutions[market].resolved;
    }

    /**
     * @dev Get the outcome of a resolved market
     */
    function getOutcome(address market) external view returns (bool) {
        require(resolutions[market].resolved, "Not resolved");
        return resolutions[market].outcomeYes;
    }
}