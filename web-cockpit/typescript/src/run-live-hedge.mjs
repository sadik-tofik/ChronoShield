import fs from 'fs';
import { getAddress } from 'viem';
import { ex } from './client.mjs';

// USDC / Collateral uses 6 decimals (1 USDC = 1_000_000n)
const USDC_UNIT = 1_000_000n;
const HEDGE_AMOUNT = 2n * USDC_UNIT; // 2 Complete Sets ($2 collateral locked)

console.log("=========================================================================");
console.log("  CHRONOSHIELD LIVE EXECUTION PIPELINE");
console.log("=========================================================================\n");

// 1. Discover active markets directly via SDK
console.log("[1/2] Querying DreamDEX Indexer via SDK (listBinaryMarkets)...");

const markets = await ex.client.listBinaryMarkets({ limit: 50 });
const now = Math.floor(Date.now() / 1000);

if (!markets || markets.length === 0) {
  console.error("Indexer returned 0 records.");
  process.exit(1);
}

// Pick active market with at least 120s remaining, longest expiry first
const live = markets
  .filter((m) => {
    const exp = Number(m.expiry || 0);
    return exp > now + 120;
  })
  .sort((a, b) => Number(b.expiry || 0) - Number(a.expiry || 0));

if (live.length === 0) {
  console.error("[ERROR] No active market found with > 2 minutes lifetime remaining.");
  process.exit(1);
}

const best = live[0];
const poolAddr = getAddress(best.poolAddress || best.pool);
const marketId = best.marketId;
const minsLeft = Math.round((Number(best.expiry) - now) / 60);

console.log(`      Selected Market ID:   ${marketId}`);
console.log(`      Selected Target Pool: ${poolAddr}`);
console.log(`      Asset / Lifespan:     ${best.asset || best.symbol || 'Binary'} (${minsLeft}m remaining)`);

// Update market.json
fs.writeFileSync('./market.json', JSON.stringify({
  pool: poolAddr,
  marketId: marketId,
  yesId: best.yesId || null,
  noId: best.noId || null,
  expiry: best.expiry,
  updatedAt: new Date().toISOString()
}, null, 2));
console.log("      market.json synchronized.\n");

// 2. Submit mintSet with proper 6-decimal units
console.log(`[2/2] Submitting mintSet({ pool: ${poolAddr.slice(0, 10)}..., amount: ${HEDGE_AMOUNT} }) to Somnia Shannon...`);

try {
  const mintTx = await ex.trader.mintSet({
    pool: poolAddr,
    amount: HEDGE_AMOUNT,
  });

  const txHash = mintTx?.hash || mintTx;
  console.log("\n=========================================================================");
  console.log("  SUCCESS: COMPLETE-SET HEDGE DEPLOYED ON-CHAIN");
  console.log("=========================================================================");
  console.log(`  Target Pool:      ${poolAddr}`);
  console.log(`  Collateral Paid:  2 tUSDC`);
  console.log(`  Transaction Hash: ${txHash}`);
  console.log(`  Shannon Explorer: https://shannon-explorer.somnia.network/tx/${txHash}`);
  console.log("=========================================================================\n");
} catch (err) {
  console.error("\nmintSet execution error:", err.message);
}
