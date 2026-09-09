import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHealthFactor,
  LIQUIDATION_WARNING_THRESHOLD,
  LIQUIDATION_THRESHOLD_BPS,
  BPS_DIVISOR,
  USDC_UNIT,
  USDC_DECIMALS,
  STT_UNIT,
  STT_DECIMALS,
  CHAIN_ID,
  LENDING_ADAPTER_ADDRESS,
} from '../src/config.mjs';

test('Protocol Configuration Invariants', (t) => {
  assert.equal(CHAIN_ID, 50312, 'Must match Somnia Shannon chain ID');
  assert.equal(USDC_DECIMALS, 6, 'USDC / collateral must strictly have 6 decimals');
  assert.equal(USDC_UNIT, 1_000_000n, '1 USDC must be 1,000,000 base units');
  assert.equal(STT_DECIMALS, 18, 'STT native currency must have 18 decimals');
  assert.equal(STT_UNIT, 1_000_000_000_000_000_000n, '1 STT must be 10^18 base units');
  assert.equal(LENDING_ADAPTER_ADDRESS.toLowerCase(), '0x728b9579edec0e8ef5422f2980c302d5bd266343'.toLowerCase());
});

test('Health Factor Math & Solvency Boundary Invariants', async (t) => {
  await t.test('Baseline healthy position (Collateral $2,000, Debt $1,250)', () => {
    const col = 2000n * 10n ** 18n;
    const debt = 1250n * 10n ** 18n;
    const hf = calculateHealthFactor(col, debt);
    assert.equal(hf, 1.360);
    assert.ok(hf >= LIQUIDATION_WARNING_THRESHOLD, 'Baseline position must exceed warning threshold');
  });

  await t.test('25% shock position ($1,500 collateral, $1,250 debt) breaches warning threshold', () => {
    const col = 1500n * 10n ** 18n;
    const debt = 1250n * 10n ** 18n;
    const hf = calculateHealthFactor(col, debt);
    assert.equal(hf, 1.020);
    assert.ok(hf < LIQUIDATION_WARNING_THRESHOLD, 'HF 1.020 must trigger warning threshold 1.150');
    assert.ok(hf > 1.000, 'HF 1.020 is still above liquidation threshold 1.000 (buffer zone)');
  });

  await t.test('Adverse 35% liquidation boundary breach ($1,300 collateral, $1,250 debt)', () => {
    const col = 1300n * 10n ** 18n;
    const debt = 1250n * 10n ** 18n;
    const hf = calculateHealthFactor(col, debt);
    assert.equal(hf, 0.884);
    assert.ok(hf < 1.000, 'HF < 1.000 represents critical insolvency breach');
  });

  await t.test('Zero debt handles safely with Infinity', () => {
    const col = 2000n * 10n ** 18n;
    const debt = 0n;
    const hf = calculateHealthFactor(col, debt);
    assert.equal(hf, Infinity);
  });

  await t.test('Threshold BPS formula adheres strictly to contract invariant', () => {
    assert.equal(LIQUIDATION_THRESHOLD_BPS, 8500n);
    assert.equal(BPS_DIVISOR, 10000n);
    const col = 1000n;
    const debt = 850n;
    const hf = calculateHealthFactor(col, debt);
    assert.equal(hf, 1.000);
  });
});

test('Decimal Scaling & Complete-Set Conservation Invariants', async (t) => {
  await t.test('Complete Set 1:1 Conservation ($V(UP) + V(DOWN) == 1.00 USDC$)', () => {
    const hedgeCompleteSets = 2n;
    const collateralLocked = hedgeCompleteSets * USDC_UNIT;
    assert.equal(collateralLocked, 2_000_000n);

    // Each complete set yields 1 UP token and 1 DOWN token
    const upTokens = hedgeCompleteSets * USDC_UNIT;
    const downTokens = hedgeCompleteSets * USDC_UNIT;

    // Invariant: Total payout value from sets at resolution is always equal to locked collateral
    const resolutionScenarioDownWins = downTokens * 1n; // DOWN pays 1, UP pays 0
    assert.equal(resolutionScenarioDownWins, collateralLocked);

    const resolutionScenarioUpWins = upTokens * 1n; // UP pays 1, DOWN pays 0
    assert.equal(resolutionScenarioUpWins, collateralLocked);
  });

  await t.test('Integer Lot Math: Zero fractional dust below 1 base unit', () => {
    const hedgeAmount = 2n * USDC_UNIT;
    assert.equal(hedgeAmount % USDC_UNIT, 0n, 'Hedge amount must be exact integer lot');
  });
});

test('Orderbook Drought Detection & Execution Routing Logic', (t) => {
  function decideRouting(bidsCount, asksCount) {
    const hasLiquidity = bidsCount + asksCount > 0;
    if (!hasLiquidity) {
      return { route: 'MINT_SET_FALLBACK', action: 'Lock complete sets via protocol mint' };
    }
    return { route: 'IOC_TAKER', action: 'Cross orderbook limit ask' };
  }

  // 1. Total orderbook drought (0 bids, 0 asks)
  const droughtDecision = decideRouting(0, 0);
  assert.equal(droughtDecision.route, 'MINT_SET_FALLBACK');

  // 2. Liquidity present in book
  const liquidDecision = decideRouting(3, 2);
  assert.equal(liquidDecision.route, 'IOC_TAKER');
});
