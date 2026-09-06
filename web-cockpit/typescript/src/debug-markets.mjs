import { ex } from "./client.mjs";

const now = Math.floor(Date.now() / 1000);
const markets = await ex.client.listBinaryMarkets({ limit: 10 });
console.log(`Current unix timestamp: ${now}`);
for (const m of (markets || [])) {
  const exp = Number(m.expiry || 0);
  console.log(`Asset: ${m.asset || m.symbol} | Expiry: ${exp} | Diff (sec): ${exp - now} | Status: ${m.status}`);
}
process.exit(0);
