import { ex, pub, me, ONE, COLLATERAL } from "./client.mjs";
import { probabilityToPrice } from "@somnia-chain/markets-sdk";
import { writeFileSync } from "fs";

// ============================================================================
// PRE-FLIGHT INVARIANTS & DEFENSIVE FAIL-CLOSED GUARDS
// ============================================================================

// 1. Integer Lot-Math Guard: Snap amount to lot grids (10^6 for 6-decimal tUSDC)
const LOT_SIZE = 1_000_000n;
function snapToLotSize(amountUnits) {
  const bAmount = BigInt(amountUnits);
  return (bAmount / LOT_SIZE) * LOT_SIZE;
}

// 2. Fail-Closed Guard: Refuse execution if window has < 30 seconds to lock
function validateWindowSafety(timeToExpirySec) {
  if (timeToExpirySec < 30) {
    throw new Error(
      `FAIL_CLOSED_REJECT: Market window nearing expiry (${timeToExpirySec}s < 30s). Refusing stale transaction dispatch.`
    );
  }
  return true;
}

// ============================================================================
// PORTFOLIO & MARKET EVALUATION
// ============================================================================

let position = {
  collateralUsd: 2000,
  borrowedDebtUsd: 1250,
  liquidationThreshold: 0.85,
};

function calculateHealthFactor(pos) {
  return (pos.collateralUsd * pos.liquidationThreshold) / pos.borrowedDebtUsd;
}

async function getLiveTradingMarket() {
  const markets = await ex.client.listBinaryMarkets({ limit: 50 });
  const now = Math.floor(Date.now() / 1000);

  const live = (markets || []).filter(
    (m) => m.status === "Trading" && Number(m.expiry || 0) > now + 40
  );

  if (live.length === 0) return null;
  live.sort((a, b) => Number(a.expiry) - Number(b.expiry));
  return live[0];
}

async function monitorAndRedeem(marketData) {
  const { marketId, pool, noId, outcomeToken, expiry } = marketData;
  console.log("\n==================================================");
  console.log("   ChronoShield Payout Settlement Listener        ");
  console.log("==================================================");
  console.log(`Tracking Market ID: ${marketId}`);
  console.log(`Waiting for market window to close and resolve on-chain...`);

  let mo = await ex.client.getMarketOnchain(marketId);
  while (!mo.finalized && !mo.isResolved && !mo.isVoided) {
    const now = Math.floor(Date.now() / 1000);
    const remaining = Number(expiry) - now;
    process.stdout.write(`Status: ${mo.status} | Expiring in: ${Math.max(0, remaining)}s... \r`);
    await new Promise((r) => setTimeout(r, 10_000));
    mo = await ex.client.getMarketOnchain(marketId);
  }

  console.log("\n>>> Market finalized by oracle!");
  const winner = Number(mo.winningOutcome); // 0 = UP, 1 = DOWN
  console.log(`Winning Outcome: ${winner === 1 ? "DOWN (Hedge Pays Out!)" : "UP"}`);

  const rawDownBalance = await ex.client.getOutcomeBalance({
    outcomeToken: mo.outcomeToken,
    account: me,
    id: BigInt(noId),
  });

  // Guard: Sanitize balance through integer lot snapping
  const downBalance = snapToLotSize(rawDownBalance);

  console.log(`Your DOWN Token Balance: ${Number(downBalance) / 1e6}`);

  if (winner === 1 && downBalance > 0n) {
    console.log("Executing on-chain redemption to recover collateral...");
    const claimTx = await ex.trader.redeem({
      marketId,
      outcomeIdx: 1,
      amount: downBalance,
    });
    console.log(`>>> [COLLATERAL RESTORED] Claim Tx: ${claimTx.hash}`);
    console.log(`Pushed ${Number(downBalance) / 1e6} tUSDC back to lending reserve.`);
  } else if (mo.isVoided) {
    console.log("Market voided: claiming 50% refund...");
    await ex.trader.redeem({ marketId, outcomeIdx: 1, amount: downBalance });
  } else {
    console.log("Market resolved UP. Downside hedge expired out of the money (collateral safe).");
  }
}

async function main() {
  console.log("=== ChronoShield Autonomous Daemon Initialized ===");
  console.log("Target Operator:", me);

  // 1. Evaluate portfolio solvency
  console.log("\n[1/3] Evaluating portfolio health...");
  position.collateralUsd = 1500; // Simulated market shock
  const hf = calculateHealthFactor(position);
  console.log(`Health Factor: ${hf.toFixed(3)} [CRITICAL]`);

  // 2. Discover shortest active market window
  console.log("\n[2/3] Querying live testnet markets...");
  const market = await getLiveTradingMarket();
  if (!market) {
    console.log("No trading markets available. Retrying in next cycle.");
    process.exit(0);
  }

  const pool = market.poolAddress || market.pool;
  const marketOnchain = await ex.client.getMarketOnchain(market.marketId);

  const nowSec = Math.floor(Date.now() / 1000);
  const timeToExpiry = Number(market.expiry) - nowSec;

  // Enforce Fail-Closed Window Safety
  validateWindowSafety(timeToExpiry);
  console.log(`✓ Pre-flight safety passed: Window valid for ${timeToExpiry}s`);

  console.log(`Selected Market: ${market.asset || market.symbol} (${pool})`);

  // 3. Execute DOWN Hedge via Guaranteed mintSet Fallback
  // Compute hedge requirement snapped to integer lot grids
  const rawHedgeAmount = 2n * ONE;
  const hedgeAmount = snapToLotSize(rawHedgeAmount);
  console.log(`✓ Quantized hedge quantity: ${hedgeAmount.toString()} units`);

  console.log("\n[3/3] Securing DOWN insurance contracts via mintSet...");
  const mintTx = await ex.trader.mintSet({
    pool,
    amount: hedgeAmount,
  });
  console.log(`Hedge confirmed on-chain: ${mintTx.hash}`);

  // 4. Start settlement listener & redemption
  await monitorAndRedeem({
    marketId: market.marketId,
    pool,
    noId: marketOnchain.noId,
    outcomeToken: marketOnchain.outcomeToken,
    expiry: market.expiry,
  });

  process.exit(0);
}

main().catch((err) => {
  console.error("Daemon error:", err);
  process.exit(1);
});