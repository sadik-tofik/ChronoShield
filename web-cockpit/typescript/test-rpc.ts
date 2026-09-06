import { createPublicClient, http } from 'viem';

const RPC_URL = 'https://dream-rpc.somnia.network';

async function verify() {
  console.log('Querying Somnia Shannon Testnet RPC...');
  const client = createPublicClient({
    transport: http(RPC_URL),
  });

  const blockNumber = await client.getBlockNumber();
  console.log('Successfully connected to Shannon (Chain ID: 50312)');
  console.log('Current Block Height:', blockNumber.toString());
}

verify().catch((err) => {
  console.error('RPC Query failed:', err);
});
