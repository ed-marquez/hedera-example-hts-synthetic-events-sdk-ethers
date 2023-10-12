# Try it on GitPod: 
## 💻 [Click here](https://gitpod.io#https://github.com/ed-marquez/hedera-example-hts-synthetic-events-sdk-ethers)

## Background:
As of [v0.79, Mirror nodes](https://docs.hedera.com/hedera/networks/release-notes/mirror-node#v0.79) now generate contract log events for non-EVM HAPI transactions. These "synthetic" events increase alignment between HTS and ERC standards and facilitate integrations with EVM tools, like The Graph.
Events are generated for HAPI transactions like: `CryptoTransfer, CryptoApproveAllowance, CryptoDeleteAllowance, TokenMint, TokenWipe, and TokenBurn`.

<img width="384" alt="image" src="https://github.com/ed-marquez/hedera-example-hts-synthetic-events-sdk-ethers/assets/72571340/c0f1b326-27d2-43fc-b145-7f64240a54e9">
