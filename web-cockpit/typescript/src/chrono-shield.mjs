import { ex, pub, me, ONE, COLLATERAL } from "./client.mjs";
import { probabilityToPrice } from "@somnia-chain/markets-sdk";

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

  // Filter explicitly for Trading status and at least 45 seconds of runtime left
  const live = (markets || []).filter(
    (m) => m.status === "Trading" && Number(m.expiry || 0) > now + 45
  );

  if (live.length === 0) return null;

  // Pick the contract that resolves soonest
  live.sort((a, b) => Number(a.expiry) - Number(b.expiry));
  return live[0];
}

async function executeHedge(hedgeAmountContracts, market) {
  const pool = market.poolAddress || market.pool;
  const now = Math.floor(Date.now() / 1000);
  const timeLeft = Number(market.expiry) - now;

  console.log(`\n>>> [TRIGGER] Executing automated ChronoShield DOWN-Hedge...`);
  console.log(`Target Pool: ${pool}`);
  console.log(`Asset: ${market.asset || market.symbol} | Time to Expiry: ${timeLeft}s`);

  const quantity = BigInt(Math.max(1, Math.round(hedgeAmountContracts))) * ONE;
  console.log(`Hedge Target: ${Number(quantity) / 1e6} DOWN contracts`);

  try {
    console.log("Attempting orderbook fill (BUY_NO IOC)...");
    const order = await ex.trader.placeOrder({
      pool,
      side: "BUY_NO",
      price: probabilityToPrice(0.99),
      quantity,
      orderType: 2,
    });

    console.log(">>> [HEDGE EXECUTED VIA ORDERBOOK]");
    if (order.fills?.length) {
      for (const fill of order.fills) {
        console.log(`Filled: ${Number(fill.quantityFilled) / 1e6} DOWN @ ${Number(fill.fillPrice) / 1e6} tUSDC`);
      }
    }
  } catch (err) {
    if (
      err.message?.includes("ImmediateOrCancelNoFill") ||
      err.shortMessage?.includes("ImmediateOrCancelNoFill")
    ) {
      console.log("No resting counterparty on orderbook for IOC fill.");
      console.log("Executing Protocol-Level Mint fallback (mintSet)...");

      const mintTx = await ex.trader.mintSet({
        pool,
        amount: quantity,
      });

      console.log(`>>> [HEDGE SECURED VIA PROTOCOL MINT]`);
      console.log(`Transaction Hash: ${mintTx.hash}`);
      console.log(`Secured ${Number(quantity) / 1e6} DOWN contracts directly into wallet.`);
    } else {
      console.error("Hedge execution failed:", err.shortMessage || err.message);
    }
  }
}

async function runShield() {
  console.log("==================================================");
  console.log("   ChronoShield Autonomous Keeper Daemon v0.1.0   ");
  console.log("==================================================");
  console.log("Connected Operator Address:", me);

  let hf = calculateHealthFactor(position);
  console.log(`Current Position: Collateral=$${position.collateralUsd} | Debt=$${position.borrowedDebtUsd}`);
  console.log(`Initial Health Factor: ${hf.toFixed(3)} [Status: SAFE]\n`);

  console.log("[SIMULATION] Market volatility detected: Collateral value drops 25%...");
  position.collateralUsd = 1500;
  hf = calculateHealthFactor(position);
  console.log(`Recalculated Health Factor: ${hf.toFixed(3)}`);

  if (hf < 1.15) {
    console.log(`[ALERT] Health factor (${hf.toFixed(3)}) breached safety threshold (1.15)!`);
    console.log("Locating live short-cadence binary market on Shannon...");

    const targetMarket = await getLiveTradingMarket();
    if (!targetMarket) {
      console.log("No active binary market matching criteria right now.");
      process.exit(0);
    }

    await executeHedge(2, targetMarket);
  } else {
    console.log("Health factor remains safe. No hedge required.");
  }

  process.exit(0);
}

runShield().catch((err) => {
  console.error("Keeper error:", err);
  process.exit(1);
});
