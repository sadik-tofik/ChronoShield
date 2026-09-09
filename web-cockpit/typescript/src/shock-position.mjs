import { LENDING_ADAPTER_ADDRESS, lendingAbi, publicClient, getWalletClient } from './config.mjs';

const shockPercent = process.argv[2] ? BigInt(process.argv[2]) : 25n;
console.log(`Applying ${shockPercent}% collateral shock to ${LENDING_ADAPTER_ADDRESS}...`);

const walletClient = getWalletClient();
const hash = await walletClient.writeContract({
  address: LENDING_ADAPTER_ADDRESS,
  abi: lendingAbi,
  functionName: 'applyShock',
  args: [shockPercent],
});

console.log(`Shock transaction broadcasted: ${hash}`);
const receipt = await publicClient.waitForTransactionReceipt({ hash });
console.log(`Confirmed in Block #${receipt.blockNumber}! Position is now stressed.`);
