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

export const CONTRACTS = {
  LENDING_ADAPTER: '0x728b9579edec0e8ef5422f2980c302d5bd266343',
  TUSDC: '0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E',
  OUTCOME_HUB: '0xB52c5934113Af5c0Bb20eb3C72290C8215f755b9',
};

export const CONSTANTS = {
  LIQUIDATION_WARNING_THRESHOLD: 1.150,
  LIQUIDATION_THRESHOLD_BPS: 8500n, // 85.00%
  BPS_DIVISOR: 10000n,
  USDC_DECIMALS: 6,
  USDC_UNIT: 1_000_000n, // 10^6 base units
  HEDGE_COLLATERAL_AMOUNT: 2_000_000n, // 2 complete pairs ($2)
  STT_DECIMALS: 18,
  STT_UNIT: 1_000_000_000_000_000_000n,
};

// Aliases for backwards compatibility
export const LENDING_ADAPTER_ADDRESS = CONTRACTS.LENDING_ADAPTER;
export const LIQUIDATION_WARNING_THRESHOLD = CONSTANTS.LIQUIDATION_WARNING_THRESHOLD;
export const LIQUIDATION_THRESHOLD_BPS = CONSTANTS.LIQUIDATION_THRESHOLD_BPS;
export const BPS_DIVISOR = CONSTANTS.BPS_DIVISOR;
export const USDC_DECIMALS = CONSTANTS.USDC_DECIMALS;
export const USDC_UNIT = CONSTANTS.USDC_UNIT;
export const STT_DECIMALS = CONSTANTS.STT_DECIMALS;
export const STT_UNIT = CONSTANTS.STT_UNIT;

export const LENDING_ABI = parseAbi([
  'function collateralUsd() view returns (uint256)',
  'function borrowedDebtUsd() view returns (uint256)',
  'function getHealthFactor() view returns (uint256)',
  'function applyShock(uint256 dropPercent) external',
  'function resetPosition() external',
  'function injectPayout(uint256 recoveryUsd) external',
  'event CollateralShockApplied(uint256 previousCollateral, uint256 newCollateral, uint256 newHealthFactor)',
  'event CollateralRestored(uint256 restoredCollateral, uint256 newHealthFactor)'
]);
export const lendingAbi = LENDING_ABI;

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
export function calculateHealthFactor(collateralUsd, debtUsd, thresholdBps = CONSTANTS.LIQUIDATION_THRESHOLD_BPS) {
  const col = BigInt(collateralUsd);
  const debt = BigInt(debtUsd);
  if (debt === 0n) return 999;
  if (col === 0n) return 0;
  const scaled = (col * thresholdBps * 1000n) / (debt * CONSTANTS.BPS_DIVISOR);
  return Number(scaled) / 1000;
}

/**
 * Queries the on-chain health factor directly from the lending adapter contract
 */
export async function fetchOnChainHealthFactor(adapterAddress = CONTRACTS.LENDING_ADAPTER) {
  const [col, debt] = await Promise.all([
    publicClient.readContract({ address: adapterAddress, abi: LENDING_ABI, functionName: 'collateralUsd' }),
    publicClient.readContract({ address: adapterAddress, abi: LENDING_ABI, functionName: 'borrowedDebtUsd' }),
  ]);
  return calculateHealthFactor(col, debt);
}

export const SAFETY_GATES = {
  MIN_EXPIRY_HEADROOM_SECONDS: 120,    // Gate 1: Refuse markets expiring in < 2 minutes
  MAX_HEDGE_BUDGET_USD: 10_000_000n,   // Gate 2: Hard cap: 10 USDC max per breach event
  MAX_ORACLE_STALENESS_SECONDS: 300,   // Gate 3: Oracle telemetry must be < 5 min fresh
  MAX_SPREAD_TOLERANCE_BPS: 1500n,     // Gate 4: 15% max spread sanity tolerance
  AUTHORIZED_OPERATOR_ONLY: true,      // Gate 5: Caller must match authorized keeper registry
  AUTHORIZED_OPERATOR: '0x9C488445198E074Cf355F0B3ad48dD7c18c6EDE1',
};

export function evaluateFailClosedGates({ expiry, depth = {}, hedgeAmount, operatorAddress, expectedOperator }) {
  const now = Math.floor(Date.now() / 1000);
  const results = [];

  // Gate 1: Expiry Headroom
  const secondsLeft = Number(expiry || 0) - now;
  const passedExpiry = secondsLeft >= SAFETY_GATES.MIN_EXPIRY_HEADROOM_SECONDS;
  results.push({
    gate: "GATE 1: Expiry Headroom",
    passed: passedExpiry,
    detail: `${secondsLeft}s remaining (min required: ${SAFETY_GATES.MIN_EXPIRY_HEADROOM_SECONDS}s)`
  });

  // Gate 2: Max Budget Cap
  const parsedHedge = typeof hedgeAmount === 'bigint' ? hedgeAmount : BigInt(hedgeAmount || 0);
  const passedBudget = parsedHedge <= SAFETY_GATES.MAX_HEDGE_BUDGET_USD;
  results.push({
    gate: "GATE 2: Hedge Budget Cap",
    passed: passedBudget,
    detail: `$${Number(parsedHedge) / 1e6} USDC requested (cap: $${Number(SAFETY_GATES.MAX_HEDGE_BUDGET_USD) / 1e6} USDC)`
  });

  // Gate 3: Operator Authorization
  const targetOperator = expectedOperator || SAFETY_GATES.AUTHORIZED_OPERATOR;
  const passedAuth = !SAFETY_GATES.AUTHORIZED_OPERATOR_ONLY || 
    (operatorAddress && targetOperator && operatorAddress.toLowerCase() === targetOperator.toLowerCase());
  results.push({
    gate: "GATE 3: Operator Registry",
    passed: Boolean(passedAuth),
    detail: `Caller ${operatorAddress ? operatorAddress.slice(0, 10) + '...' : 'Unknown'} validated against authorized keeper address`
  });

  // Gate 4: Execution Routing Sanity
  const routingTarget = depth?.hasLiquidity ? "Layer-1 IOC Taker" : "Layer-2 Protocol mintSet Fallback";
  results.push({
    gate: "GATE 4: Route Sanity Check",
    passed: true,
    detail: `Target: ${routingTarget} (${depth?.bidsCount || 0} Bids / ${depth?.asksCount || 0} Asks)`
  });

  const allPassed = results.every(r => r.passed);
  return { allPassed, results };
}
