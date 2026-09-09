// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockLendingPosition {
    address public immutable owner;
    uint256 public collateralUsd;
    uint256 public borrowedDebtUsd;
    uint256 public constant LIQUIDATION_THRESHOLD_BPS = 8500; // 85.00%
    uint256 public constant BPS_DIVISOR = 10000;

    event CollateralShockApplied(uint256 previousCollateral, uint256 newCollateral, uint256 newHealthFactor);
    event CollateralRestored(uint256 restoredCollateral, uint256 newHealthFactor);

    constructor() {
        owner = msg.sender;
        collateralUsd = 2000 * 1e18;      // $2,000 baseline
        borrowedDebtUsd = 1250 * 1e18;    // $1,250 baseline
    }

    function getHealthFactor() public view returns (uint256) {
        if (borrowedDebtUsd == 0) return type(uint256).max;
        return (collateralUsd * LIQUIDATION_THRESHOLD_BPS * 1e18) / (borrowedDebtUsd * BPS_DIVISOR);
    }

    function applyShock(uint256 shockPercent) external {
        require(shockPercent <= 50, "Capped at 50%");
        uint256 dropAmount = (collateralUsd * shockPercent) / 100;
        uint256 prev = collateralUsd;
        collateralUsd -= dropAmount;
        emit CollateralShockApplied(prev, collateralUsd, getHealthFactor());
    }

    function resetPosition() external {
        collateralUsd = 2000 * 1e18;
        borrowedDebtUsd = 1250 * 1e18;
        emit CollateralRestored(collateralUsd, getHealthFactor());
    }

    function injectPayout(uint256 recoveryUsd) external {
        collateralUsd += recoveryUsd;
        emit CollateralRestored(collateralUsd, getHealthFactor());
    }
}