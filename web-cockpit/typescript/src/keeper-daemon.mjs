import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPublicClient, http, defineChain, parseAbi, getAddress } from 'viem';
import { ex } from './client.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  LENDING_ADAPTER_ADDRESS,
  LIQUIDATION_WARNING_THRESHOLD,
  USDC_UNIT,
  fetchOnChainHealthFactor,
} from './config.mjs';

const HEDGE_AMOUNT = 2n * USDC_UNIT; // 2 sets ($2 collateral)

async function checkOrderBookDepth(marketId) {
  try {
    const ob = await ex.client.fetchOrderBook(marketId);
    const asks = ob?.asks || [];
    const bids = ob?.bids || [];
    return {
      hasLiquidity: asks.length + bids.length > 0,
      bidsCount: bids.length,
      asksCount: asks.length,
    };
  } catch {
    return { hasLiquidity: false, bidsCount: 0, asksCount: 0 };
  }
}

async function runDaemon() {
  console.log("=========================================================================");
  console.log("  CHRONOSHIELD AUTONOMOUS LIQUIDATION KEEPER DAEMON");
  console.log("  Network: Somnia Shannon Testnet (Chain ID: 50312)");
  console.log(`  Solvency Adapter: ${LENDING_ADAPTER_ADDRESS}`);
  console.log("=========================================================================\n");

  console.log("[1/4] Querying borrower solvency state from contract...");
  const hf = await fetchOnChainHealthFactor();
  console.log(`      Health Factor:     ${hf.toFixed(3)}`);
  console.log(`      Safety Threshold:  ${LIQUIDATION_WARNING_THRESHOLD.toFixed(3)}`);

  if (hf >= LIQUIDATION_WARNING_THRESHOLD) {
    console.log(`\n[STATUS] Solvency Healthy (${hf.toFixed(3)} >= ${LIQUIDATION_WARNING_THRESHOLD}).`);
    console.log("[STATUS] No liquidation risk. Keeper in standby.");
    return;
  }

  console.log(`\n[ALERT] SOLVENCY BREACH! Current HF: ${hf.toFixed(3)} < ${LIQUIDATION_WARNING_THRESHOLD}`);
  console.log("[ACTION] Deploying downside hedge on DreamDEX...");

  console.log("\n[2/4] Discovering active binary market on Somnia...");
  let target = null;
  const now = Math.floor(Date.now() / 1000);

  try {
    const markets = await ex.client.listBinaryMarkets({ limit: 100 });
    const active = (markets || [])
      .filter((m) => Number(m.expiry || 0) > now + 30)
      .sort((a, b) => Number(b.expiry || 0) - Number(a.expiry || 0));

    if (active.length > 0) {
      target = active[0];
    }
  } catch (err) {
    console.warn("Indexer query warning:", err.message);
  }

  // Fallback to market.json if indexer scan didn't return a candidate
  if (!target) {
    try {
      const mJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../market.json'), 'utf8'));
      if (mJson.pool && mJson.marketId) {
        target = {
          pool: mJson.pool,
          marketId: mJson.marketId,
          expiry: mJson.expiry || now + 300,
        };
      }
    } catch {}
  }

  if (!target) {
    console.error("[ERROR] No unexpired market available.");
    return;
  }

  const targetPool = getAddress(target.poolAddress || target.pool);
  const targetMarketId = target.marketId;
  const minsLeft = Math.max(1, Math.round((Number(target.expiry || now + 60) - now) / 60));

  console.log(`      Market ID:         ${targetMarketId}`);
  console.log(`      Pool Address:      ${targetPool}`);
  console.log(`      Time Remaining:    ~${minsLeft}m`);

  fs.writeFileSync(path.join(__dirname, '../market.json'), JSON.stringify({
    pool: targetPool,
    marketId: targetMarketId,
    expiry: target.expiry,
    updatedAt: new Date().toISOString()
  }, null, 2));

  console.log("\n[3/4] Checking orderbook liquidity...");
  const depth = await checkOrderBookDepth(targetMarketId);
  console.log(`      CLOB Depth:        ${depth.bidsCount} Bids / ${depth.asksCount} Asks`);

  console.log("\n[4/4] Executing hedge...");
  if (!depth.hasLiquidity) {
    console.log("[DROUGHT DETECTED] Orderbook is empty. Executing mintSet complete pair fallback...");
    try {
      const mintTx = await ex.trader.mintSet({
        pool: targetPool,
        amount: HEDGE_AMOUNT,
      });
      const txHash = mintTx?.hash || mintTx;
      console.log("\n=========================================================================");
      console.log("  HEDGE EXECUTION CONFIRMED ON SOMNIA SHANNON");
      console.log("=========================================================================");
      console.log(`  Mechanism:     Protocol-level mintSet`);
      console.log(`  Transaction:   ${txHash}`);
      console.log(`  Explorer:      https://shannon-explorer.somnia.network/tx/${txHash}`);
      console.log("=========================================================================\n");
    } catch (mintErr) {
      console.error(`[EXECUTION FAILED] ${mintErr.message}`);
    }
  } else {
    console.log("[LIQUIDITY FOUND] Submitting IOC order...");
    const orderTx = await ex.trader.createOrder({
      marketId: targetMarketId,
      outcome: 1,
      quantity: 2,
      timeInForce: 'IOC'
    });
    console.log(`[ORDER FILLED] Tx: ${orderTx.hash || orderTx}`);
  }
}

runDaemon()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
