import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPublicClient, createWalletClient, http, defineChain, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { config as dotenvConfig } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from current dir or root if available
for (const envPath of [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
]) {
  if (fs.existsSync(envPath)) {
    dotenvConfig({ path: envPath });
    break;
  }
}

export const CHAIN_ID = 50312;
export const RPC_URL = process.env.RPC_URL || 'https://dream-rpc.somnia.network';
export const EXPLORER_URL = 'https://shannon-explorer.somnia.network';

export const somniaShannon = defineChain({
  id: CHAIN_ID,
  name: 'Somnia Shannon Testnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: EXPLORER_URL },
  },
});

export const LENDING_ADAPTER_ADDRESS = '0x728b9579edec0e8ef5422f2980c302d5bd266343';
export const LIQUIDATION_WARNING_THRESHOLD = 1.150;
export const LIQUIDATION_THRESHOLD_BPS = 8500n; // 85.00%
export const BPS_DIVISOR = 10000n;

// Decimals & Unit Constants
export const USDC_DECIMALS = 6;
export const USDC_UNIT = 1_000_000n; // 10^6 base units
export const STT_DECIMALS = 18;
export const STT_UNIT = 1_000_000_000_000_000_000n; // 10^18 base units

export const lendingAbi = parseAbi([
  'function collateralUsd() view returns (uint256)',
  'function borrowedDebtUsd() view returns (uint256)',
  'function getHealthFactor() view returns (uint256)',
  'function applyShock(uint256 dropPercent) external',
  'function resetPosition() external',
  'function injectPayout(uint256 recoveryUsd) external',
  'event CollateralShockApplied(uint256 previousCollateral, uint256 newCollateral, uint256 newHealthFactor)',
  'event CollateralRestored(uint256 restoredCollateral, uint256 newHealthFactor)'
]);

export function getRawPrivateKey() {
  const envVal = process.env.OPERATOR_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (envVal && envVal !== '0x...' && envVal.length >= 64) {
    return envVal.startsWith('0x') ? envVal : `0x${envVal}`;
  }
  const localEnvPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(localEnvPath)) {
    const text = fs.readFileSync(localEnvPath, 'utf8');
    const match = text.match(/(?:OPERATOR_PRIVATE_KEY|PRIVATE_KEY)=(0x[a-fA-F0-9]{64}|[a-fA-F0-9]{64})/);
    if (match) return match[1].startsWith('0x') ? match[1] : `0x${match[1]}`;
  }
  return null;
}

export function getOperatorAccount() {
  const key = getRawPrivateKey();
  if (!key) {
    throw new Error('Missing OPERATOR_PRIVATE_KEY or PRIVATE_KEY in environment/.env');
  }
  return privateKeyToAccount(key);
}

export const publicClient = createPublicClient({
  chain: somniaShannon,
  transport: http(RPC_URL),
});

export function getWalletClient() {
  const account = getOperatorAccount();
  return createWalletClient({
    account,
    chain: somniaShannon,
    transport: http(RPC_URL),
  });
}

/**
 * Pure invariant calculation: Health Factor (HF)
 * HF = (CollateralUsd * ThresholdBps) / (DebtUsd * BpsDivisor)
 */
export function calculateHealthFactor(collateralUsd, debtUsd, thresholdBps = LIQUIDATION_THRESHOLD_BPS) {
  const col = BigInt(collateralUsd);
  const debt = BigInt(debtUsd);
  if (debt === 0n) return Infinity;
  const scaled = (col * thresholdBps * 1000n) / (debt * BPS_DIVISOR);
  return Number(scaled) / 1000;
}

/**
 * Queries the on-chain health factor directly from the lending adapter contract
 */
export async function fetchOnChainHealthFactor(adapterAddress = LENDING_ADAPTER_ADDRESS) {
  const [col, debt] = await Promise.all([
    publicClient.readContract({ address: adapterAddress, abi: lendingAbi, functionName: 'collateralUsd' }),
    publicClient.readContract({ address: adapterAddress, abi: lendingAbi, functionName: 'borrowedDebtUsd' }),
  ]);
  return calculateHealthFactor(col, debt);
}
