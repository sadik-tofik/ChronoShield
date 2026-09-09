import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createPublicClient, createWalletClient, http, defineChain, parseAbi, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ex } from './client.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const somniaShannon = defineChain({
  id: 50312,
  name: 'Somnia Shannon Testnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: { default: { http: ['https://dream-rpc.somnia.network'] } },
});

const envText = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const pkMatch = envText.match(/(?:OPERATOR_PRIVATE_KEY|PRIVATE_KEY)=(0x[a-fA-F0-9]{64}|[a-fA-F0-9]{64})/);
const rawKey = pkMatch ? pkMatch[1] : process.env.OPERATOR_PRIVATE_KEY;
const account = privateKeyToAccount(rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`);

const publicClient = createPublicClient({ chain: somniaShannon, transport: http('https://dream-rpc.somnia.network') });
const walletClient = createWalletClient({ account, chain: somniaShannon, transport: http('https://dream-rpc.somnia.network') });

const LENDING_ADAPTER = "0x728b9579edec0e8ef5422f2980c302d5bd266343";
const lendingAbi = parseAbi([
  'function collateralUsd() view returns (uint256)',
  'function borrowedDebtUsd() view returns (uint256)',
  'function applyShock(uint256 dropPercent) external',
  'function resetPosition() external'
]);

async function getHealthFactor() {
  const [col, debt] = await Promise.all([
    publicClient.readContract({ address: LENDING_ADAPTER, abi: lendingAbi, functionName: 'collateralUsd' }),
    publicClient.readContract({ address: LENDING_ADAPTER, abi: lendingAbi, functionName: 'borrowedDebtUsd' }),
  ]);
  return Number((col * 8500n * 1000n) / (debt * 10000n)) / 1000;
}

console.log("=========================================================================");
console.log("  CHRONOSHIELD: DETERMINISTIC LIFECYCLE AUDIT PIPELINE");
console.log("  Somnia Shannon Testnet (Chain ID: 50312)");
console.log("=========================================================================\n");

const runReceipt = {
  timestamp: new Date().toISOString(),
  chainId: 50312,
  adapter: LENDING_ADAPTER,
  operator: account.address,
};

// 1. Initial State
runReceipt.initialHF = (await getHealthFactor()).toFixed(3);
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
runReceipt.shockedHF = (await getHealthFactor()).toFixed(3);
console.log(`      Shock Tx:   ${shockHash}`);
console.log(`      Breach HF:  ${runReceipt.shockedHF}`);

// 3. Dynamic Market & Complete-Set Hedge
console.log("[3/5] Locating market & minting fallback hedge...");
const markets = await ex.client.listBinaryMarkets({ limit: 100 });
const now = Math.floor(Date.now() / 1000);
const active = (markets || []).filter((m) => Number(m.expiry || 0) > now + 30).sort((a, b) => Number(b.expiry || 0) - Number(a.expiry || 0));
const target = active[0];
const poolAddr = getAddress(target.poolAddress || target.pool);
runReceipt.targetPool = poolAddr;
runReceipt.marketId = target.marketId;

const mintTxObj = await ex.trader.mintSet({
  pool: poolAddr,
  amount: 2_000_000n // 2 complete pairs (6 decimals)
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
runReceipt.finalHF = (await getHealthFactor()).toFixed(3);
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

