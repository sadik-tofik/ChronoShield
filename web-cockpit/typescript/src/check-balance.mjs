import { pub, me, COLLATERAL } from "./client.mjs";
import { erc20Abi, formatUnits, formatEther } from "viem";

async function check() {
  console.log("Checking balances for:", me);

  // 1. Gas balance
  const stt = await pub.getBalance({ address: me });
  console.log(`Native Gas: ${formatEther(stt)} STT`);

  // 2. Collateral balance
  const usdc = await pub.readContract({
    address: COLLATERAL,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [me],
  });
  console.log(`Collateral: ${formatUnits(usdc, 6)} tUSDC`);
}

check().catch(console.error);
