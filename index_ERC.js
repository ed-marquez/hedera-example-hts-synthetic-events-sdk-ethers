console.clear();

import { createRequire } from "module";
const require = createRequire(import.meta.url);
require("dotenv").config();

import { Client, AccountId, PrivateKey, Hbar } from "@hashgraph/sdk";
import { ethers } from "ethers";
import abi_ERC20 from "./abi_ERC20.js";

import accountCreateFcn from "./utils/accountCreate.js";
import * as queries from "./utils/queries.js";
import * as htsTokens from "./utils/tokenOperations.js";

const treasuryId = AccountId.fromString(process.env.OPERATOR_ID);
const treasuryKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);
const client = Client.forTestnet().setOperator(treasuryId, treasuryKey);
client.setDefaultMaxTransactionFee(new Hbar(100));

const provider = new ethers.providers.JsonRpcProvider("https://testnet.hashio.io/api");
const signer = new ethers.Wallet(process.env.OPERATOR_PVKEY_HEX, provider)

async function main() {
	// STEP 1 ===================================
	console.log(`\nSTEP 1 ===================================\n`);
	console.log(`- Creating Hedera accounts and HTS token...\n`);

	console.log(`- Treasury's account: https://hashscan.io/testnet/account/${treasuryId}`);

	const initBalance = new Hbar(10);
	const aliceKey = PrivateKey.generateED25519();
	const [aliceSt, aliceId] = await accountCreateFcn(aliceKey, initBalance, client);
	console.log(`- Alice's account: https://hashscan.io/testnet/account/${aliceId}`);

	// Create HTS token
	const [tokenId, tokenInfo] = await htsTokens.createFtFcn("HBAR ROCKS", "HROCK", 100, treasuryId, treasuryKey, client);
	const tokenAddress = tokenId.toSolidityAddress();
	console.log(`\n- Token ID: ${tokenId}`);
	console.log(`- Token Address: ${tokenAddress}`);
	console.log(`- Initial token supply: ${tokenInfo.totalSupply.low}`);

	const tokenContract = new ethers.Contract(tokenAddress, abi_ERC20, signer);

	// STEP 2 ===================================
	console.log(`\nSTEP 2 ===================================\n`);
	console.log(`- Subscribe to Transfer events...\n`);
	

	tokenContract.on("Transfer", (from, to, amount, event) => {
		console.log(`\n-NEW TRANSFER EVENT: ====================`);
		console.log(`From: ${from}, To: ${to}, Amount: ${amount.toString()}\n`);
		
		// You can also access the full event object if needed
		// console.log(`-EVENT DETAILS (OPTIONAL): ====================`);
		// console.log(event);
	});
	
	// STEP 3 ===================================
	console.log(`\nSTEP 3 ===================================\n`);
	console.log(`- Perform Transfers: (Treasury => Alice) + (T=>A) + (T=>A) & listen to events...\n`);
	
	await queries.balanceCheckerFcn(treasuryId, tokenId, client);
	await queries.balanceCheckerFcn(aliceId, tokenId, client);
	
	let gasLim = 4000000;
	let tBal = [5, 3, 1];

	for (let i = 0; i < 3; i++) {
		let transferFtTx = await tokenContract.transfer(aliceId.toSolidityAddress(), tBal[i], { gasLimit: gasLim});
		let transferFtRx = await transferFtTx.wait();
		let transferFtTxHash = transferFtRx.transactionHash;
		console.log(`\n- Transfer${i+1} status: ${transferFtRx.status}`);
		console.log(`- https://hashscan.io/testnet/tx/${transferFtTxHash}\n`);
	}

	setTimeout(()=>{	
		console.log(`
====================================================
🎉🎉 THE END - NOW JOIN: https://hedera.com/discord
====================================================\n`);},5000);

}
main();
