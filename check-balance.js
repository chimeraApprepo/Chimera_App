const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545');
const address = '0x3710FEbef97cC9705b273C93f2BEB9aDf091Ffc9';

async function checkBalance() {
  console.log('=== BSC Testnet Balance Check ===\n');
  console.log('Address:', address);
  console.log('Network: BSC Testnet (Chain ID: 97)\n');
  
  try {
    const balance = await provider.getBalance(address);
    const bnb = ethers.formatEther(balance);
    
    console.log('Balance:', bnb, 'tBNB');
    
    if (parseFloat(bnb) >= 0.05) {
      console.log('\n✅ READY! Wallet is funded. Phase 1 can begin.');
      return true;
    } else if (parseFloat(bnb) > 0) {
      console.log('\n⚠️  Some BNB received, but might need more (recommended: 0.1 tBNB)');
      return false;
    } else {
      console.log('\n❌ Wallet is empty. Waiting for faucet...');
      return false;
    }
  } catch (error) {
    console.error('Error checking balance:', error.message);
    return false;
  }
}

checkBalance();
