import { ex, COLLATERAL } from "./client.mjs";

console.log("Querying DreamDEX Indexer (unconstrained query)...");

try {
  // Query without the 'status' enum to bypass the database enum error
  const markets = await ex.client.listBinaryMarkets({
    limit: 50,
  });

  const now = Math.floor(Date.now() / 1000);
  console.log(`Fetched ${markets?.length || 0} total markets from indexer.\n`);

  if (!markets || markets.length === 0) {
    console.log("Indexer returned 0 records.");
    process.exit(0);
  }

  // Filter for markets that haven't expired yet
  const live = markets.filter((m) => {
    const exp = Number(m.expiry || 0);
    return exp > now;
  });

  console.log(`Total Live Markets: ${live.length}`);

  for (const m of live) {
    const intervalSec = Number(m.intervalSec || m.interval || 0);
    const minsLeft = Math.round((Number(m.expiry) - now) / 60);
    console.log(
      `[${intervalSec}s / ${(intervalSec / 60).toFixed(1)}m] ${m.asset || m.symbol} | ` +
      `Expires in: ${minsLeft}m | Pool: ${m.poolAddress || m.pool} | MarketId: ${m.marketId}`
    );
  }
} catch (err) {
  console.error("Indexer query failed:", err);
}
