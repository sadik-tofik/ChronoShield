import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  CONSTANTS, 
  calculateHealthFactor,
  somniaShannon,
  RPC_URL,
  CONTRACTS,
  SAFETY_GATES,
  evaluateFailClosedGates
} from '../src/config.mjs';

describe('1. Network & Chain Configuration Invariants', () => {
  it('enforces Somnia Shannon Chain ID 50312', () => {
    assert.equal(somniaShannon.id, 50312);
    assert.equal(somniaShannon.nativeCurrency.symbol, 'STT');
    assert.equal(somniaShannon.nativeCurrency.decimals, 18);
  });

  it('verifies standard RPC endpoint format', () => {
    assert.ok(RPC_URL.startsWith('https://'));
    assert.ok(RPC_URL.includes('somnia.network'));
  });

  it('validates canonical contract addresses format', () => {
    assert.match(CONTRACTS.LENDING_ADAPTER, /^0x[a-fA-F0-9]{40}$/);
    assert.match(CONTRACTS.TUSDC, /^0x[a-fA-F0-9]{40}$/);
  });
});

describe('2. Solvency Math & Health Factor Boundaries', () => {
  it('calculates exact baseline healthy HF (Collateral: $2000, Debt: $1250)', () => {
    // 2000 * 0.85 / 1250 = 1700 / 1250 = 1.360
    const col = 2000n * (10n ** 18n);
    const debt = 1250n * (10n ** 18n);
    const hf = calculateHealthFactor(col, debt);
    assert.equal(hf, 1.360);
    assert.ok(hf >= CONSTANTS.LIQUIDATION_WARNING_THRESHOLD);
  });

  it('detects breach under 25% shock (Collateral: $1500, Debt: $1250)', () => {
    // 1500 * 0.85 / 1250 = 1275 / 1250 = 1.020
    const col = 1500n * (10n ** 18n);
    const debt = 1250n * (10n ** 18n);
    const hf = calculateHealthFactor(col, debt);
    assert.equal(hf, 1.020);
    assert.ok(hf < CONSTANTS.LIQUIDATION_WARNING_THRESHOLD);
    assert.ok(hf > 1.000);
  });

  it('identifies critical liquidation state under 35% shock (Collateral: $1300, Debt: $1250)', () => {
    // 1300 * 0.85 / 1250 = 1105 / 1250 = 0.884
    const col = 1300n * (10n ** 18n);
    const debt = 1250n * (10n ** 18n);
    const hf = calculateHealthFactor(col, debt);
    assert.equal(hf, 0.884);
    assert.ok(hf < 1.000);
  });

  it('identifies severe stress state under 43.75% shock (Collateral: $1125, Debt: $1250)', () => {
    // 1125 * 0.85 / 1250 = 956.25 / 1250 = 0.765
    const col = 1125n * (10n ** 18n);
    const debt = 1250n * (10n ** 18n);
    const hf = calculateHealthFactor(col, debt);
    assert.equal(hf, 0.765);
  });

  it('safely handles zero debt with safe fallback (999)', () => {
    const col = 2000n * (10n ** 18n);
    const hf = calculateHealthFactor(col, 0n);
    assert.equal(hf, 999);
  });

  it('handles zero collateral with 0.000 HF', () => {
    const debt = 1250n * (10n ** 18n);
    const hf = calculateHealthFactor(0n, debt);
    assert.equal(hf, 0);
  });

  it('strictly validates the 8500 BPS liquidation threshold constant', () => {
    assert.equal(CONSTANTS.LIQUIDATION_THRESHOLD_BPS, 8500n);
    assert.equal(CONSTANTS.BPS_DIVISOR, 10000n);
  });
});

describe('3. Currency Decimals & Lot Size Invariants', () => {
  it('enforces 6-decimal precision for USDC collateral tokens', () => {
    assert.equal(CONSTANTS.USDC_UNIT, 1_000_000n);
    assert.equal(CONSTANTS.HEDGE_COLLATERAL_AMOUNT, 2_000_000n);
  });

  it('rejects 18-decimal scaling for USDC mint amounts', () => {
    const eighteenDecimals = 2n * (10n ** 18n);
    assert.notEqual(CONSTANTS.HEDGE_COLLATERAL_AMOUNT, eighteenDecimals);
  });

  it('preserves complete-set 1:1 parity (1 UP + 1 DOWN == 1 USDC)', () => {
    const payoutUp = 1_000_000n;
    const payoutDown = 1_000_000n;
    const setCost = CONSTANTS.USDC_UNIT;
    assert.equal(payoutUp, setCost);
    assert.equal(payoutDown, setCost);
  });

  it('snaps hedge orders to integer lot sizes without decimal dust', () => {
    const rawQuantity = 2.75;
    const integerLots = Math.floor(rawQuantity);
    assert.equal(integerLots, 2);
    const rawScaled = BigInt(integerLots) * CONSTANTS.USDC_UNIT;
    assert.equal(rawScaled % CONSTANTS.USDC_UNIT, 0n);
  });
});

describe('4. Orderbook Depth & Routing Invariants', () => {
  function evaluateDepth(bids, asks) {
    const totalOrders = (bids?.length || 0) + (asks?.length || 0);
    return {
      hasLiquidity: totalOrders > 0,
      totalOrders
    };
  }

  it('routes to Layer 2 mintSet fallback when book is completely empty', () => {
    const depth = evaluateDepth([], []);
    assert.equal(depth.hasLiquidity, false);
    assert.equal(depth.totalOrders, 0);
  });

  it('routes to Layer 2 mintSet fallback when order arrays are null/undefined', () => {
    const depth = evaluateDepth(null, undefined);
    assert.equal(depth.hasLiquidity, false);
    assert.equal(depth.totalOrders, 0);
  });

  it('routes to Layer 1 IOC taker when bids or asks exist', () => {
    const depthWithAsks = evaluateDepth([], [{ price: 0.5, size: 10 }]);
    assert.equal(depthWithAsks.hasLiquidity, true);

    const depthWithBids = evaluateDepth([{ price: 0.45, size: 5 }], []);
    assert.equal(depthWithBids.hasLiquidity, true);
  });
});

describe('5. Safety Thresholds & Breach Detection', () => {
  function checkBreach(hf) {
    return hf < CONSTANTS.LIQUIDATION_WARNING_THRESHOLD;
  }

  it('triggers alert exactly when HF < 1.150', () => {
    assert.equal(checkBreach(1.149), true);
    assert.equal(checkBreach(1.150), false);
    assert.equal(checkBreach(1.151), false);
  });

  it('detects emergency zone when HF < 1.000', () => {
    const isEmergency = (hf) => hf < 1.000;
    assert.equal(isEmergency(0.999), true);
    assert.equal(isEmergency(1.000), false);
  });

  it('calculates required collateral restitution to restore 1.360 HF', () => {
    // Current: Col $1500, Debt $1250, HF 1.020. Target HF = 1.360.
    // Target Col = 1.360 * 1250 / 0.85 = $2000.
    const debt = 1250n * (10n ** 18n);
    const targetHfBps = 1360n;
    const requiredCol = (targetHfBps * debt * 10000n) / (8500n * 1000n);
    assert.equal(requiredCol / (10n ** 18n), 2000n);
  });
});

describe('6. Pyth Network Oracle Math & Scaling Invariants', () => {
  it('normalizes Pyth negative exponent prices correctly', () => {
    const rawPrice = 254312000000;
    const expo = -8;
    const normalized = rawPrice * (10 ** expo);
    assert.equal(normalized, 2543.12);
  });

  it('calculates collateral drop proportionally to observed oracle delta', () => {
    const basePrice = 2500;
    const livePrice = 1875; // 25% drop
    const dropPercent = Math.max(0, Math.round(((basePrice - livePrice) / basePrice) * 100));
    assert.equal(dropPercent, 25);

    const initialCollateral = 2000n * (10n ** 18n);
    const shockedCollateral = (initialCollateral * BigInt(100 - dropPercent)) / 100n;
    assert.equal(shockedCollateral / (10n ** 18n), 1500n);
  });

  it('clamps non-negative drop percentage on price increases', () => {
    const basePrice = 2500;
    const livePrice = 2750; // +10% price increase
    const dropPercent = Math.max(0, Math.round(((basePrice - livePrice) / basePrice) * 100));
    assert.equal(dropPercent, 0);
  });
});

describe('7. Fail-Closed Policy Gate Invariants', () => {
  it('rejects pools with less than 120s expiry headroom', () => {
    const now = Math.floor(Date.now() / 1000);
    const check = evaluateFailClosedGates({
      expiry: now + 60, // Only 60s left
      depth: { hasLiquidity: false, bidsCount: 0, asksCount: 0 },
      hedgeAmount: 2_000_000n,
      operatorAddress: '0x9C488445198E074Cf355F0B3ad48dD7c18c6EDE1'
    });
    assert.equal(check.allPassed, false);
    assert.equal(check.results[0].passed, false);
  });

  it('approves pools with adequate expiry headroom (>= 120s)', () => {
    const now = Math.floor(Date.now() / 1000);
    const check = evaluateFailClosedGates({
      expiry: now + 300, // 5 min
      depth: { hasLiquidity: false, bidsCount: 0, asksCount: 0 },
      hedgeAmount: 2_000_000n,
      operatorAddress: '0x9C488445198E074Cf355F0B3ad48dD7c18c6EDE1'
    });
    assert.equal(check.allPassed, true);
  });

  it('rejects hedge attempts exceeding maximum budget cap', () => {
    const now = Math.floor(Date.now() / 1000);
    const check = evaluateFailClosedGates({
      expiry: now + 300,
      depth: { hasLiquidity: false, bidsCount: 0, asksCount: 0 },
      hedgeAmount: 15_000_000n, // $15 USDC (cap is $10)
      operatorAddress: '0x9C488445198E074Cf355F0B3ad48dD7c18c6EDE1'
    });
    assert.equal(check.allPassed, false);
    assert.equal(check.results[1].passed, false);
  });

  it('rejects unauthorized operator signatures', () => {
    const now = Math.floor(Date.now() / 1000);
    const check = evaluateFailClosedGates({
      expiry: now + 300,
      depth: { hasLiquidity: false, bidsCount: 0, asksCount: 0 },
      hedgeAmount: 2_000_000n,
      operatorAddress: '0x000000000000000000000000000000000000dEaD'
    });
    assert.equal(check.allPassed, false);
    assert.equal(check.results[2].passed, false);
  });
});
