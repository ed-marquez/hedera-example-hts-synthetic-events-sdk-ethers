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

const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);
const client = Client.forTestnet().setOperator(operatorId, operatorKey);
client.setDefaultMaxTransactionFee(new Hbar(100));

const provider = new ethers.providers.JsonRpcProvider("https://testnet.hashio.io/api");

async function main() {
	// STEP 1 ===================================
	console.log(`\nSTEP 1 ===================================\n`);
	console.log(`- Creating Hedera accounts and HTS token...\n`);

	const initBalance = new Hbar(10);
	const treasuryKey = PrivateKey.generateED25519();
	const [treasurySt, treasuryId] = await accountCreateFcn(treasuryKey, initBalance, client);
	console.log(`- Treasury's account: https://hashscan.io/testnet/account/${treasuryId}`);
	const aliceKey = PrivateKey.generateED25519();
	const [aliceSt, aliceId] = await accountCreateFcn(aliceKey, initBalance, client);
	console.log(`- Alice's account: https://hashscan.io/testnet/account/${aliceId}`);

	// Create HTS token
	const [tokenId, tokenInfo] = await htsTokens.createFtFcn("HBAR ROCKS", "HROCK", 100, treasuryId, treasuryKey, client);
	const tokenAddress = tokenId.toSolidityAddress();
	console.log(`\n- Token ID: ${tokenId}`);
	console.log(`- Token Address: ${tokenAddress}`);
	console.log(`- Initial token supply: ${tokenInfo.totalSupply.low}`);

	const tokenContract = new ethers.Contract(tokenAddress, abi_ERC20, provider);

	// STEP 2 ===================================
	console.log(`\nSTEP 2 ===================================\n`);
	console.log(`- Subscribe to Transfer events...\n`);
	
	tokenContract.on("Transfer", (from, to, amount, event) => {
		console.log(`\n-NEW TRANSFER EVENT: ====================`);
		console.log(`From: ${from}, To: ${to}, Amount: ${amount.toString()}`);

		// You can also access the full event object if needed
		// console.log(`-EVENT DETAILS (OPTIONAL): ====================`);
		// console.log(event);
	});

	// STEP 3 ===================================
	console.log(`\nSTEP 3 ===================================\n`);
	console.log(`- Perform Transfers: (Treasury => Alice) + (A=>T) + (T=>A) & listen to events...\n`);

	await queries.balanceCheckerFcn(treasuryId, tokenId, client);
	await queries.balanceCheckerFcn(aliceId, tokenId, client);

	let tBal = 5;
	let [transferFtRx, transferFtTx] = await htsTokens.transferFtFcn(tokenId, treasuryId, aliceId, tBal, treasuryKey, client);
	console.log(`\n- Transfer1 status: ${transferFtRx.status}`);
	console.log(`- https://hashscan.io/testnet/transaction/${transferFtTx.transactionId}\n`);

	tBal = 3;
	[transferFtRx, transferFtTx] = await htsTokens.transferFtFcn(tokenId, aliceId, treasuryId, tBal, aliceKey, client);
	console.log(`\n- Transfer2 status: ${transferFtRx.status}`);
	console.log(`- https://hashscan.io/testnet/transaction/${transferFtTx.transactionId}\n`);

	tBal = 1;
	[transferFtRx, transferFtTx] = await htsTokens.transferFtFcn(tokenId, treasuryId, aliceId, tBal, treasuryKey, client);
	console.log(`\n- Transfer3 status: ${transferFtRx.status}`);
	console.log(`- https://hashscan.io/testnet/transaction/${transferFtTx.transactionId}\n`);


	setTimeout(()=>{	
		console.log(`
====================================================
🎉🎉 THE END - NOW JOIN: https://hedera.com/discord
====================================================\n`);},5000);
}
main();
