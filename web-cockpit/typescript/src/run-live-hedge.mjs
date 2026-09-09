import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAddress } from 'viem';
import { ex } from './client.mjs';
import { CONSTANTS, getOperatorAccount } from './config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("=========================================================================");
console.log("  CHRONOSHIELD LIVE EXECUTION PIPELINE (MANUAL ENTRY POINT)");
console.log("=========================================================================\n");

// Safety Check: Verify operator wallet credentials
try {
  const account = getOperatorAccount();
  console.log(`[AUTH] Operator authenticated: ${account.address}`);
} catch (err) {
  console.error(`[FATAL] Authentication check failed: ${err.message}`);
  console.error("Please ensure .env contains a valid OPERATOR_PRIVATE_KEY.");
  process.exit(1);
}

// 1. Discover active markets via SDK
console.log("\n[1/2] Querying DreamDEX Indexer for active markets...");
let target = null;
const now = Math.floor(Date.now() / 1000);

try {
  const markets = await ex.client.listBinaryMarkets({ limit: 100 });
  const live = (markets || [])
    .filter((m) => Number(m.expiry || 0) > now + 30)
    .sort((a, b) => Number(b.expiry || 0) - Number(a.expiry || 0));

  if (live.length > 0) target = live[0];
} catch (err) {
  console.warn("Indexer query warning:", err.message);
}

// Fallback to market.json cache if indexer returned nothing
if (!target) {
  try {
    const cached = JSON.parse(fs.readFileSync(path.join(__dirname, '../market.json'), 'utf8'));
    if (cached.pool && cached.marketId) {
      target = { pool: cached.pool, marketId: cached.marketId, expiry: cached.expiry || now + 300 };
    }
  } catch {}
}

if (!target) {
  console.error("[ERROR] No unexpired market available on DreamDEX indexer.");
  process.exit(1);
}

const poolAddr = getAddress(target.poolAddress || target.pool);
const marketId = target.marketId;
const minsLeft = Math.max(1, Math.round((Number(target.expiry || now + 60) - now) / 60));

console.log(`      Selected Market ID:   ${marketId}`);
console.log(`      Selected Target Pool: ${poolAddr}`);
console.log(`      Time Remaining:       ~${minsLeft}m`);

// Synchronize market.json
fs.writeFileSync(path.join(__dirname, '../market.json'), JSON.stringify({
  pool: poolAddr,
  marketId: marketId,
  expiry: target.expiry,
  updatedAt: new Date().toISOString()
}, null, 2));
console.log("      market.json synchronized.\n");

// 2. Submit mintSet with proper 6-decimal units
console.log(`[2/2] Submitting mintSet({ pool: ${poolAddr.slice(0, 10)}..., amount: ${CONSTANTS.HEDGE_COLLATERAL_AMOUNT} }) to Somnia Shannon...`);

try {
  const mintTx = await ex.trader.mintSet({
    pool: poolAddr,
    amount: CONSTANTS.HEDGE_COLLATERAL_AMOUNT,
  });

  const txHash = mintTx?.hash || mintTx;
  console.log("\n=========================================================================");
  console.log("  SUCCESS: COMPLETE-SET HEDGE DEPLOYED ON-CHAIN");
  console.log("=========================================================================");
  console.log(`  Target Pool:      ${poolAddr}`);
  console.log(`  Collateral Paid:  2 tUSDC (6 decimals)`);
  console.log(`  Transaction Hash: ${txHash}`);
  console.log(`  Shannon Explorer: https://shannon-explorer.somnia.network/tx/${txHash}`);
  console.log("=========================================================================\n");
  process.exit(0);
} catch (err) {
  console.error("\n[FATAL] mintSet execution error:", err.message);
  process.exit(1);
}
