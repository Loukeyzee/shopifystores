#!/usr/bin/env node

/**
 * 🔐 Secure Wallet Generator Example
 * 
 * This example shows how to:
 * 1. Generate secure wallets for token launch trading
 * 2. Load and use wallets for coordinated buying/selling
 * 3. Manage launch trading operations safely
 * 
 * SECURITY NOTICE:
 * - All wallets are generated locally
 * - Private keys never leave your machine
 * - Files are encrypted with your password
 * - Nothing is stored on external servers
 */

const WalletGenerator = require('../src/services/walletGenerator');
const LaunchTradingManager = require('../src/services/launchTradingManager');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class WalletGeneratorExample {
  constructor() {
    this.walletGenerator = new WalletGenerator();
    this.tradingManager = new LaunchTradingManager();
  }

  async run() {
    console.log(`
🔐 Secure Wallet Generator - Example Usage
==========================================

This example will demonstrate:
✅ Generating secure launch trading wallets
✅ Creating a master developer wallet  
✅ Loading wallets for token trading
✅ Coordinated buying and selling
✅ Profit management

⚠️  SECURITY REMINDER: 
- Keep passwords safe and separate from wallet files
- Backup wallet files in multiple secure locations
- Never share private keys or seed phrases
- Test with small amounts first

Press Enter to continue...`);

    await this.waitForEnter();
    await this.demonstrateWalletGeneration();
    await this.demonstrateLaunchTrading();
    
    console.log(`
🎉 Example completed successfully!

Key takeaways:
✅ Wallets generated completely offline and secure
✅ Easy coordinated trading for token launches  
✅ Built-in profit management and reporting
✅ Cross-platform compatibility (Windows, Mac, Linux)

Next steps:
1. Generate your own wallets with custom settings
2. Fund master wallet with SOL for operations
3. Load wallets in GUI or integrate into your bot
4. Execute profitable token launch strategies

Happy trading! 🚀
`);

    rl.close();
  }

  async demonstrateWalletGeneration() {
    console.log(`
📂 Step 1: Wallet Generation
============================`);

    // Generate master wallet
    console.log('\n👑 Generating master developer wallet...');
    const masterResult = await this.walletGenerator.generateMasterWallet('example_password_123');
    
    console.log(`✅ Master wallet created!`);
    console.log(`   Address: ${masterResult.wallet.address}`);
    console.log(`   File: ${masterResult.filename}`);
    console.log(`   🔒 Encrypted and saved securely`);

    // Generate launch trading wallets
    console.log('\n🎯 Generating 5 launch trading wallets...');
    const launchResult = await this.walletGenerator.generateLaunchWallets(5, 'example_password_123');
    
    console.log(`✅ ${launchResult.totalGenerated} launch wallets created!`);
    console.log(`   File: ${launchResult.filename}`);
    console.log(`   🔒 All wallets encrypted with your password`);

    // Show first wallet as example
    const firstWallet = launchResult.wallets[0];
    console.log(`\nExample wallet:`);
    console.log(`   Address: ${firstWallet.address}`);
    console.log(`   Seed: ${firstWallet.mnemonic.split(' ').slice(0, 4).join(' ')}... (12 words total)`);

    // Security audit
    console.log('\n🛡️ Security Audit:');
    const audit = this.walletGenerator.securityAudit();
    console.log(`   Entropy: ${audit.entropy}`);
    console.log(`   Mnemonic: ${audit.mnemonicStrength}`);
    console.log(`   Encryption: ${audit.encryption}`);
    console.log(`   Storage: ${audit.storage}`);

    await this.waitForEnter();
  }

  async demonstrateLaunchTrading() {
    console.log(`
🚀 Step 2: Launch Trading Demo
==============================`);

    try {
      // Load wallets for trading (simulated)
      console.log('\n📁 Loading wallets for trading...');
      
      // In real usage, you'd load from the encrypted file:
      // const wallets = await this.tradingManager.loadWallets('launch_wallets_file.json', 'your_password');
      
      // For demo, we'll create mock wallets
      const mockWallets = this.createMockWallets();
      console.log(`✅ Loaded ${mockWallets.length} wallets for trading`);

      // Display wallet status
      console.log('\n💳 Wallet Status:');
      mockWallets.forEach((wallet, index) => {
        console.log(`   ${wallet.name}: ${wallet.balance.toFixed(4)} SOL | Profit: ${wallet.profit.toFixed(4)} SOL`);
      });

      // Set target token
      const targetToken = 'DEMO1234567890abcdef'; // Demo token address
      console.log(`\n🎯 Setting target token: ${targetToken}`);
      console.log(`   Platform: pump.fun`);

      // Simulate coordinated buy
      console.log('\n🟢 DEMO: Coordinated Buy Operation');
      console.log('   Strategy: 5 wallets buying 0.1 SOL each with 1-3 second delays');
      
      for (let i = 0; i < mockWallets.length; i++) {
        const wallet = mockWallets[i];
        const delay = Math.random() * 2000 + 1000; // 1-3 second delay
        
        await this.sleep(200); // Demo delay
        console.log(`   🟢 ${wallet.name} buying 0.1 SOL... ✅ Success!`);
        
        // Update mock balances
        wallet.balance -= 0.1;
        wallet.tokenBalance += 1000; // Mock tokens received
      }

      console.log(`   ✅ Coordinated buy completed: 5/5 successful`);

      // Simulate profit taking
      console.log('\n💰 DEMO: Profit Taking (50% sell)');
      let totalProfit = 0;
      
      for (let i = 0; i < mockWallets.length; i++) {
        const wallet = mockWallets[i];
        await this.sleep(100);
        
        const sellAmount = wallet.tokenBalance * 0.5;
        const solReceived = sellAmount * 0.0002; // Mock price increase
        const profit = solReceived - 0.05; // Profit vs original 0.1 SOL buy
        
        wallet.tokenBalance -= sellAmount;
        wallet.balance += solReceived;
        wallet.profit += profit;
        totalProfit += profit;
        
        console.log(`   🔴 ${wallet.name} sold 50% for ${solReceived.toFixed(4)} SOL | Profit: ${profit.toFixed(4)} SOL`);
      }

      console.log(`   ✅ Mass sell completed | Total profit: ${totalProfit.toFixed(4)} SOL`);

      // Show final statistics
      console.log('\n📊 Final Trading Statistics:');
      console.log(`   Total Wallets: ${mockWallets.length}`);
      console.log(`   Total Profit: ${totalProfit.toFixed(4)} SOL`);
      console.log(`   Success Rate: 100%`);
      console.log(`   Wallets with Tokens: ${mockWallets.filter(w => w.tokenBalance > 0).length}`);

      // Withdrawal simulation
      console.log('\n💸 DEMO: Profit Withdrawal');
      const masterAddress = 'DEMO_MASTER_WALLET_ADDRESS';
      console.log(`   Withdrawing profits to master wallet: ${masterAddress}`);
      
      let totalWithdrawn = 0;
      mockWallets.forEach(wallet => {
        const withdrawAmount = Math.max(0, wallet.balance - 0.01); // Keep 0.01 SOL for fees
        totalWithdrawn += withdrawAmount;
        console.log(`   💸 Withdrew ${withdrawAmount.toFixed(4)} SOL from ${wallet.name}`);
      });

      console.log(`   ✅ Total withdrawn: ${totalWithdrawn.toFixed(4)} SOL`);

    } catch (error) {
      console.error('Demo error:', error.message);
    }

    await this.waitForEnter();
  }

  createMockWallets() {
    return [
      { name: 'LaunchWallet_1', balance: 0.2, tokenBalance: 0, profit: 0 },
      { name: 'LaunchWallet_2', balance: 0.2, tokenBalance: 0, profit: 0 },
      { name: 'LaunchWallet_3', balance: 0.2, tokenBalance: 0, profit: 0 },
      { name: 'LaunchWallet_4', balance: 0.2, tokenBalance: 0, profit: 0 },
      { name: 'LaunchWallet_5', balance: 0.2, tokenBalance: 0, profit: 0 }
    ];
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  waitForEnter() {
    return new Promise(resolve => {
      rl.question('', () => resolve());
    });
  }
}

// Run the example
if (require.main === module) {
  const example = new WalletGeneratorExample();
  example.run().catch(console.error);
}

module.exports = WalletGeneratorExample;