import fs from 'fs';
import { createWalletClient, http, defineChain, parseAbi, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const somniaShannon = defineChain({
  id: 50312,
  name: 'Somnia Shannon Testnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: { default: { http: ['https://dream-rpc.somnia.network'] } },
});

const LENDING_ADAPTER = "0x728b9579edec0e8ef5422f2980c302d5bd266343";
const envText = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const pkMatch = envText.match(/OPERATOR_PRIVATE_KEY=(0x[a-fA-F0-9]{64}|[a-fA-F0-9]{64})/);
const rawKey = pkMatch ? pkMatch[1] : process.env.OPERATOR_PRIVATE_KEY;

if (!rawKey) {
  console.error("Missing OPERATOR_PRIVATE_KEY in .env");
  process.exit(1);
}

const account = privateKeyToAccount(rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`);
const client = createWalletClient({
  account,
  chain: somniaShannon,
  transport: http('https://dream-rpc.somnia.network'),
}).extend(publicActions);

const shockPercent = process.argv[2] ? BigInt(process.argv[2]) : 25n;
console.log(`Applying ${shockPercent}% collateral shock to ${LENDING_ADAPTER}...`);

const abi = parseAbi(['function applyShock(uint256 shockPercent) external']);

const hash = await client.writeContract({
  address: LENDING_ADAPTER,
  abi,
  functionName: 'applyShock',
  args: [shockPercent],
});

console.log(`Shock transaction broadcasted: ${hash}`);
const receipt = await client.waitForTransactionReceipt({ hash });
console.log(`Confirmed in Block #${receipt.blockNumber}! Position is now stressed.`);
