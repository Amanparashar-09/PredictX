// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev Interface for calling resolve on a PredictionMarket contract
 */
interface IPredictionMarket {
    function resolve(bool outcomeYes) external;
}

/**
 * @dev SimpleOracle — resolves prediction markets on-chain
 * - Only owner can resolve markets
 * - Stores resolution data locally AND calls market.resolve() on the target contract
 */
contract SimpleOracle is Ownable {
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
        _resolveMarket(market, true);
    }

    /**
     * @dev Resolve a market with NO outcome
     */
    function resolveNo(address market) external onlyOwner {
        _resolveMarket(market, false);
    }

    /**
     * @dev Resolve a market with specified outcome.
     *      Stores resolution locally AND calls market.resolve() on-chain.
     */
    function resolveMarket(address market, bool outcomeYes) external onlyOwner {
        _resolveMarket(market, outcomeYes);
    }

    /**
     * @dev Internal resolution — records result and triggers market contract
     */
    function _resolveMarket(address market, bool outcomeYes) internal {
        require(market != address(0), "Invalid market address");
        require(!resolutions[market].resolved, "Already resolved");

        resolutions[market] = MarketResolution({
            resolved: true,
            outcomeYes: outcomeYes,
            timestamp: block.timestamp
        });

        emit MarketResolved(market, outcomeYes, block.timestamp);

        // Trigger the market contract — this is what actually unlocks claims
        IPredictionMarket(market).resolve(outcomeYes);
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