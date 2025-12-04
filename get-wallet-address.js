const { ethers } = require('ethers');

const privateKey = '0x124b7b6e11fedf9561bcd558d5ed35c9d3c6eec7249ef86648c77f988c4f3814';
const wallet = new ethers.Wallet(privateKey);

console.log('=== Facilitator Wallet Info ===');
console.log('Private Key:', privateKey);
console.log('Public Address:', wallet.address);
console.log('\n✅ This is your facilitator wallet address!');
console.log('Fund this address with testnet BNB from the faucet.');