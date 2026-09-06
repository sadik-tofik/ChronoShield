import { ex, me } from "./client.mjs";

const marketId = "0x00000000000000000000000000000000000000000000000000000000000150de";

console.log("=== ChronoShield Automated Settlement Claimer ===");
console.log(`Checking Market ID: ${marketId}`);
console.log(`Beneficiary Address: ${me}\n`);

async function pollAndClaim() {
  let mo = null;

  while (true) {
    try {
      mo = await ex.client.getMarketOnchain(marketId);
      const isSettled = mo.finalized || mo.isResolved || mo.isVoided;
      
      console.log(`[Status: ${mo.status}] Finalized: ${mo.finalized} | Resolved: ${mo.isResolved} | Voided: ${mo.isVoided}`);

      if (isSettled) break;

      console.log("Waiting for oracle resolution... Checking again in 12s.");
      await new Promise((r) => setTimeout(r, 12_000));
    } catch (err) {
      console.log(`[RPC Glitch] ${err.shortMessage || err.message}. Retrying in 5s...`);
      await new Promise((r) => setTimeout(r, 5_000));
    }
  }

  console.log("\n>>> Market has settled on-chain!");
  const winner = Number(mo.winningOutcome); // 0 = UP, 1 = DOWN
  console.log(`Outcome result: ${winner === 1 ? "1 (DOWN - Hedge Won!)" : "0 (UP)"}`);

  const downBalance = await ex.client.getOutcomeBalance({
    outcomeToken: mo.outcomeToken,
    account: me,
    id: BigInt(mo.noId),
  });

  console.log(`Your DOWN token balance: ${Number(downBalance) / 1e6}`);

  if (winner === 1 && downBalance > 0n) {
    console.log("Submitting redemption transaction...");
    const claimTx = await ex.trader.redeem({
      marketId,
      outcomeIdx: 1,
      amount: downBalance,
    });
    console.log(`>>> [RECOVERY COMPLETE] Transaction Hash: ${claimTx.hash}`);
    console.log(`Successfully recovered ${Number(downBalance) / 1e6} tUSDC to restore collateral.`);
  } else if (mo.isVoided) {
    console.log("Market voided. Claiming 50% refund...");
    const claimTx = await ex.trader.redeem({ marketId, outcomeIdx: 1, amount: downBalance });
    console.log(`Refund claimed: ${claimTx.hash}`);
  } else {
    console.log("Market resolved UP. Downside hedge expired out-of-the-money.");
  }

  process.exit(0);
}

pollAndClaim().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
