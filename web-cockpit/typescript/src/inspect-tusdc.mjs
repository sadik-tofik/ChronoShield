import { createPublicClient, createWalletClient, http, parseAbi, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { somniaTestnet } from "viem/chains";
import { config } from "dotenv";

// Load .env variables
config({ path: new URL("../../.env", import.meta.url) });

const RPC_URL = process.env.RPC_URL || "https://dream-rpc.somnia.network";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const COLLATERAL = "0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E";

const account = privateKeyToAccount(PRIVATE_KEY);
const pub = createPublicClient({
  chain: somniaTestnet,
  transport: http(RPC_URL),
});

const wallet = createWalletClient({
  account,
  chain: somniaTestnet,
  transport: http(RPC_URL),
});

console.log("Checking tUSDC on-chain functions for:", COLLATERAL);
console.log("Caller address:", account.address);

const candidateSigs = [
  "function faucet()",
  "function drip()",
  "function mint(address to, uint256 amount)",
  "function mint(uint256 amount)",
  "function claim()",
];

async function run() {
  for (const sig of candidateSigs) {
    const fnName = sig.split(" ")[1].split("(")[0];
    const abi = parseAbi([sig]);
    
    let args = [];
    if (sig.includes("address to, uint256 amount")) {
      args = [account.address, parseUnits("100", 6)];
    } else if (sig.includes("uint256 amount")) {
      args = [parseUnits("100", 6)];
    }

    try {
      console.log(`Testing: ${fnName}...`);
      await pub.simulateContract({
        address: COLLATERAL,
        abi,
        functionName: fnName,
        args,
        account: account.address,
      });

      console.log(`>>> SUCCESS! Function ${fnName} is open. Minting 100 tUSDC...`);
      const hash = await wallet.writeContract({
        address: COLLATERAL,
        abi,
        functionName: fnName,
        args,
      });
      console.log("Transaction submitted! Hash:", hash);
      return;
    } catch (err) {
      console.log(`- ${fnName} reverted or does not exist.`);
    }
  }

  console.log("\nResult: No open public mint found on the contract.");
}

run().catch((err) => console.error("Script error:", err));
