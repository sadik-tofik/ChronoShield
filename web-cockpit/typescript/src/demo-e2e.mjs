import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createPublicClient, createWalletClient, http, defineChain, parseAbi, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ex } from './client.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  CHAIN_ID,
  LENDING_ADAPTER_ADDRESS,
  lendingAbi,
  publicClient,
  getWalletClient,
  getOperatorAccount,
  fetchOnChainHealthFactor,
  USDC_UNIT,
  evaluateFailClosedGates,
} from './config.mjs';

const account = getOperatorAccount();
const walletClient = getWalletClient();
const LENDING_ADAPTER = LENDING_ADAPTER_ADDRESS;

console.log("=========================================================================");
console.log("  CHRONOSHIELD: END-TO-END VERIFIED TESTNET AUDIT RUN");
console.log("  Network: Somnia Shannon Testnet (Chain ID: 50312)");
console.log(`  Adapter: ${LENDING_ADAPTER}`);
console.log(`  Keeper:  ${account.address}`);
console.log("=========================================================================\n");

const runReceipt = {
  timestamp: new Date().toISOString(),
  chainId: 50312,
  adapter: LENDING_ADAPTER,
  operator: account.address,
};

// 1. Initial State
runReceipt.initialHF = (await fetchOnChainHealthFactor()).toFixed(3);
console.log(`[1/5] Initial Health Factor: ${runReceipt.initialHF}`);

// 2. Shock
console.log("[2/5] Triggering 25% collateral shock...");
const shockHash = await walletClient.writeContract({
  address: LENDING_ADAPTER,
  abi: lendingAbi,
  functionName: 'applyShock',
  args: [25n]
});
await publicClient.waitForTransactionReceipt({ hash: shockHash });
runReceipt.shockTx = shockHash;
runReceipt.shockedHF = (await fetchOnChainHealthFactor()).toFixed(3);
console.log(`      Shock Tx:   ${shockHash}`);
console.log(`      Breach HF:  ${runReceipt.shockedHF}`);

// 2.5 Pre-Flight Fail-Closed Policy Gate Check
console.log("\n[2.5/5] Pre-Flight Fail-Closed Policy Gate Check...");
const markets = await ex.client.listBinaryMarkets({ limit: 100 });
const now = Math.floor(Date.now() / 1000);
const active = (markets || []).filter((m) => Number(m.expiry || 0) > now + 30).sort((a, b) => Number(b.expiry || 0) - Number(a.expiry || 0));
const target = active[0];
const poolAddr = getAddress(target.poolAddress || target.pool);
runReceipt.targetPool = poolAddr;
runReceipt.marketId = target.marketId;

const gateCheck = evaluateFailClosedGates({
  expiry: target.expiry,
  depth: { hasLiquidity: false, bidsCount: 0, asksCount: 0 },
  hedgeAmount: 2n * USDC_UNIT,
  operatorAddress: account.address,
  expectedOperator: '0x9C488445198E074Cf355F0B3ad48dD7c18c6EDE1'
});

gateCheck.results.forEach((r) => {
  const icon = r.passed ? "✔ PASS" : "✖ FAIL";
  console.log(`      [${icon}] ${r.gate.padEnd(28)} : ${r.detail}`);
});

if (!gateCheck.allPassed) {
  throw new Error("[FAIL-CLOSED POLICY TRIGGERED] One or more safety gates failed. Aborting hedge.");
}
console.log("      All safety gates verified. Authorization unlocked.\n");
runReceipt.safetyGates = "PASS (4/4 GATES VERIFIED)";

// 3. Complete-Set Hedge Mint
console.log("[3/5] Executing complete-set fallback hedge...");
const mintTxObj = await ex.trader.mintSet({
  pool: poolAddr,
  amount: 2n * USDC_UNIT // 2 complete pairs (6 decimals)
});
const mintTx = mintTxObj?.hash || mintTxObj;
await publicClient.waitForTransactionReceipt({ hash: mintTx });
runReceipt.mintHedgeTx = mintTx;
console.log(`      Hedge Tx:   ${mintTx}`);

// 4. Reset Position
console.log("[4/5] Restoring collateral on-chain...");
const resetHash = await walletClient.writeContract({
  address: LENDING_ADAPTER,
  abi: lendingAbi,
  functionName: 'resetPosition'
});
await publicClient.waitForTransactionReceipt({ hash: resetHash });
runReceipt.resetTx = resetHash;
runReceipt.finalHF = (await fetchOnChainHealthFactor()).toFixed(3);
console.log(`      Reset Tx:   ${resetHash}`);
console.log(`      Final HF:   ${runReceipt.finalHF}`);

// 5. Seal Cryptographic Receipt
const receiptJson = JSON.stringify(runReceipt, Object.keys(runReceipt).sort(), 2);
const sha256 = crypto.createHash('sha256').update(receiptJson).digest('hex');
runReceipt.sha256 = sha256;

const receiptsDir = path.join(__dirname, '../../../receipts');
if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir, { recursive: true });
const timestampFile = new Date().toISOString().replace(/[:.]/g, '-');
const filePath = path.join(receiptsDir, `run-${timestampFile}.json`);
fs.writeFileSync(filePath, JSON.stringify(runReceipt, null, 2));

console.log("\n=========================================================================");
console.log("  AUDIT RECEIPT SEALED & RECORDED");
console.log("=========================================================================");
console.log(`  File:        ${filePath}`);
console.log(`  SHA-256:     ${sha256}`);
console.log("=========================================================================\n");

process.exit(0);

