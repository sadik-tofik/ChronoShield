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
  CONSTANTS,
  fetchOnChainHealthFactor,
  evaluateFailClosedGates,
  getOperatorAccount,
} from './config.mjs';

const HEDGE_AMOUNT = 2n * USDC_UNIT; // 2 sets ($2 collateral)

async function checkOrderBookDepth(marketId) {
  try {
    const ob = await ex.client.fetchOrderBook(marketId);
    const asks = ob?.asks || [];
    const bids = ob?.bids || [];
    return {
      hasLiquidity: asks.length + bids.length > 0,
      asksCount: asks.length,
      bidsCount: bids.length,
    };
  } catch (err) {
    return { hasLiquidity: false, asksCount: 0, bidsCount: 0 };
  }
}

async function runDaemon() {
  console.log("=========================================================================");
  console.log("  CHRONOSHIELD: AUTONOMOUS GUARDIAN KEEPER DAEMON");
  console.log("=========================================================================\n");

  console.log("[1/4] Checking borrower on-chain health factor...");
  const hf = await fetchOnChainHealthFactor();
  console.log(`      Current Health Factor: ${hf.toFixed(3)}`);

  if (hf >= LIQUIDATION_WARNING_THRESHOLD) {
    console.log(`\n[STATUS NORMAL] Health factor ${hf.toFixed(3)} >= ${LIQUIDATION_WARNING_THRESHOLD}. No hedge required.`);
    return;
  }

  console.log(`\n[LIQUIDATION WARNING] HF ${hf.toFixed(3)} breached threshold ${LIQUIDATION_WARNING_THRESHOLD}!`);

  console.log("\n[2/4] Discovering active binary event markets...");
  const now = Math.floor(Date.now() / 1000);
  let target = null;

  try {
    const markets = await ex.client.listBinaryMarkets({ limit: 50 });
    const active = (markets || []).filter((m) => Number(m.expiry || 0) > now + 30);
    if (active.length > 0) {
      active.sort((a, b) => Number(b.expiry || 0) - Number(a.expiry || 0));
      target = active[0];
    }
  } catch (err) {
    console.warn(`[WARN] Market discovery via indexer failed: ${err.message}`);
  }

  if (!target) {
    try {
      const marketJsonPath = path.join(__dirname, '../market.json');
      if (fs.existsSync(marketJsonPath)) {
        const mJson = JSON.parse(fs.readFileSync(marketJsonPath, 'utf8'));
        target = {
          poolAddress: mJson.pool,
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

  console.log("\n[3.5/4] Executing Fail-Closed Policy Gate Check...");
  let operatorAddress;
  try {
    operatorAddress = getOperatorAccount()?.address;
  } catch {
    operatorAddress = null;
  }

  const gateCheck = evaluateFailClosedGates({
    expiry: target.expiry,
    depth,
    hedgeAmount: HEDGE_AMOUNT,
    operatorAddress,
    expectedOperator: '0x9C488445198E074Cf355F0B3ad48dD7c18c6EDE1'
  });

  gateCheck.results.forEach((r) => {
    const icon = r.passed ? "✔ PASS" : "✖ FAIL";
    console.log(`      [${icon}] ${r.gate.padEnd(28)} : ${r.detail}`);
  });

  if (!gateCheck.allPassed) {
    console.error("\n[FAIL-CLOSED POLICY TRIGGERED] One or more safety gates failed. Aborting hedge execution.");
    return;
  }
  console.log("      All safety gates verified. Authorization unlocked.");

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
