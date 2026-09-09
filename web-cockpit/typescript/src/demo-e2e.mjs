import { execSync } from 'child_process';

function run(cmd, desc) {
  console.log(`\n\x1b[36m>>> [STEP] ${desc}\x1b[0m`);
  console.log(`\x1b[90m$ ${cmd}\x1b[0m\n`);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Step failed: ${err.message}`);
    process.exit(1);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

console.log("=========================================================================");
console.log("  CHRONOSHIELD: END-TO-END AUTONOMOUS GUARDIAN SHOWCASE");
console.log("  Somnia Shannon Testnet | DreamDEX Protocol Integration");
console.log("=========================================================================");

// 1. Initial State Check
run("node src/keeper-daemon.mjs", "1. Checking initial healthy solvency state");

await sleep(3000);

// 2. Collateral Shock
run("node src/shock-position.mjs 25", "2. Triggering 25% on-chain collateral shock");

await sleep(3000);

// 3. Autonomous Keeper Execution
run("node src/keeper-daemon.mjs", "3. Keeper detecting breach and executing mintSet hedge");

await sleep(3000);

// 4. Reset Back to Normal
run(
  `node -e "
import fs from 'fs';
import { createWalletClient, http, defineChain, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const somniaShannon = defineChain({
  id: 50312,
  name: 'Somnia Shannon Testnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: { default: { http: ['https://dream-rpc.somnia.network'] } },
});

const envText = fs.readFileSync('.env', 'utf8');
const pkMatch = envText.match(/(?:OPERATOR_PRIVATE_KEY|PRIVATE_KEY)=(0x[a-fA-F0-9]{64}|[a-fA-F0-9]{64})/);
const account = privateKeyToAccount(pkMatch[1].startsWith('0x') ? pkMatch[1] : '0x' + pkMatch[1]);
const client = createWalletClient({ account, chain: somniaShannon, transport: http('https://dream-rpc.somnia.network') });

const abi = parseAbi(['function resetPosition() external']);
const hash = await client.writeContract({
  address: '0x728b9579edec0e8ef5422f2980c302d5bd266343',
  abi,
  functionName: 'resetPosition'
});
console.log('Position restored tx:', hash);
"`,
  "4. Resetting on-chain collateral back to $2,000 baseline"
);

await sleep(3000);

// 5. Final Standby Confirmation
run("node src/keeper-daemon.mjs", "5. Verifying guardian returns to standby");

console.log("\n\x1b[32m=========================================================================");
console.log("  SHOWCASE COMPLETE: ALL ON-CHAIN STATES SUCCESSFULLY DEMONSTRATED");
console.log("=========================================================================\x1b[0m\n");
