const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const PlatformIntegration = require('./platformIntegration');
const WalletGenerator = require('./walletGenerator');

class LaunchTradingManager {
  constructor(config = {}) {
    this.connection = new Connection(config.rpcUrl || 'https://api.mainnet-beta.solana.com');
    this.platformIntegration = new PlatformIntegration();
    this.walletGenerator = new WalletGenerator();
    
    this.loadedWallets = [];
    this.currentToken = null;
    this.platform = null;
    this.tradingStats = {
      totalTrades: 0,
      totalVolume: 0,
      totalProfit: 0,
      totalFees: 0,
      successfulTrades: 0,
      failedTrades: 0
    };
  }

  // Load wallets from encrypted file
  async loadWallets(filename, password) {
    console.log(`🔓 Loading wallets from ${filename}...`);
    
    try {
      const walletData = await this.walletGenerator.loadWalletsFromFile(filename, password);
      
      // Convert loaded data to usable wallet objects
      this.loadedWallets = walletData.wallets.map(walletInfo => {
        const privateKeyArray = Buffer.from(walletInfo.privateKey, 'base64');
        const keypair = require('@solana/web3.js').Keypair.fromSecretKey(privateKeyArray);
        
        return {
          id: walletInfo.id,
          name: walletInfo.name,
          address: walletInfo.address,
          privateKey: walletInfo.privateKey,
          mnemonic: walletInfo.mnemonic,
          keypair: keypair,
          balance: 0,
          tokenBalance: 0,
          trades: [],
          profit: 0
        };
      });

      console.log(`✅ Loaded ${this.loadedWallets.length} wallets successfully`);
      
      // Check balances
      await this.updateAllBalances();
      
      return this.loadedWallets;
    } catch (error) {
      throw new Error(`Failed to load wallets: ${error.message}`);
    }
  }

  // Set target token for trading
  setToken(tokenAddress, platform = 'pump.fun') {
    this.currentToken = tokenAddress;
    this.platform = platform;
    console.log(`🎯 Target set: ${tokenAddress} on ${platform}`);
  }

  // Update all wallet balances
  async updateAllBalances() {
    console.log('💳 Updating wallet balances...');
    
    for (const wallet of this.loadedWallets) {
      wallet.balance = await this.walletGenerator.getWalletBalance(wallet.address);
    }
    
    const totalBalance = this.loadedWallets.reduce((sum, w) => sum + w.balance, 0);
    console.log(`💰 Total balance across all wallets: ${totalBalance.toFixed(4)} SOL`);
  }

  // Buy token with specific wallet
  async buyToken(walletId, amountSOL, options = {}) {
    if (!this.currentToken || !this.platform) {
      throw new Error('Token and platform must be set first');
    }

    const wallet = this.getWalletById(walletId);
    if (!wallet) {
      throw new Error(`Wallet ${walletId} not found`);
    }

    if (wallet.balance < amountSOL) {
      throw new Error(`Insufficient balance. Wallet has ${wallet.balance.toFixed(4)} SOL, need ${amountSOL} SOL`);
    }

    console.log(`🟢 BUY: Wallet ${wallet.name} buying ${amountSOL} SOL of ${this.currentToken}`);

    try {
      const result = await this.platformIntegration.executeTrade(
        this.platform,
        this.currentToken,
        wallet,
        true, // isBuy
        amountSOL
      );

      if (result.success) {
        // Record trade
        const trade = {
          type: 'buy',
          amount: amountSOL,
          timestamp: Date.now(),
          signature: result.signature,
          platform: this.platform,
          fee: result.fee || 0,
          priceImpact: result.impact || 0
        };

        wallet.trades.push(trade);
        this.tradingStats.totalTrades++;
        this.tradingStats.totalVolume += amountSOL;
        this.tradingStats.totalFees += trade.fee;
        this.tradingStats.successfulTrades++;

        // Update balance
        wallet.balance -= amountSOL;

        console.log(`✅ Buy successful: ${result.signature}`);
        return { success: true, trade, result };
      } else {
        this.tradingStats.failedTrades++;
        throw new Error(`Trade failed: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ Buy failed: ${error.message}`);
      throw error;
    }
  }

  // Sell token with specific wallet
  async sellToken(walletId, percentage = 100, options = {}) {
    if (!this.currentToken || !this.platform) {
      throw new Error('Token and platform must be set first');
    }

    const wallet = this.getWalletById(walletId);
    if (!wallet) {
      throw new Error(`Wallet ${walletId} not found`);
    }

    if (wallet.tokenBalance === 0) {
      throw new Error(`Wallet ${wallet.name} has no tokens to sell`);
    }

    const sellAmount = (wallet.tokenBalance * percentage) / 100;
    
    console.log(`🔴 SELL: Wallet ${wallet.name} selling ${percentage}% (${sellAmount} tokens) of ${this.currentToken}`);

    try {
      const result = await this.platformIntegration.executeTrade(
        this.platform,
        this.currentToken,
        wallet,
        false, // isSell
        sellAmount
      );

      if (result.success) {
        // Record trade
        const solReceived = result.amount || sellAmount * 0.95; // Estimate
        const trade = {
          type: 'sell',
          amount: sellAmount,
          solReceived: solReceived,
          percentage: percentage,
          timestamp: Date.now(),
          signature: result.signature,
          platform: this.platform,
          fee: result.fee || 0,
          priceImpact: result.impact || 0
        };

        wallet.trades.push(trade);
        this.tradingStats.totalTrades++;
        this.tradingStats.totalVolume += solReceived;
        this.tradingStats.totalFees += trade.fee;
        this.tradingStats.successfulTrades++;

        // Update balances
        wallet.tokenBalance -= sellAmount;
        wallet.balance += solReceived;

        // Calculate profit
        const totalBought = wallet.trades
          .filter(t => t.type === 'buy')
          .reduce((sum, t) => sum + t.amount, 0);
        const totalSold = wallet.trades
          .filter(t => t.type === 'sell')
          .reduce((sum, t) => sum + t.solReceived, 0);
        
        wallet.profit = totalSold - totalBought;

        console.log(`✅ Sell successful: ${result.signature} | Profit: ${wallet.profit.toFixed(4)} SOL`);
        return { success: true, trade, result, profit: wallet.profit };
      } else {
        this.tradingStats.failedTrades++;
        throw new Error(`Sell failed: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ Sell failed: ${error.message}`);
      throw error;
    }
  }

  // Buy with multiple wallets (coordinated launch buying)
  async coordinatedBuy(walletIds, amountPerWallet, options = {}) {
    console.log(`🚀 Coordinated buy: ${walletIds.length} wallets, ${amountPerWallet} SOL each`);
    
    const results = [];
    const delay = options.delay || 1000; // 1 second delay between buys
    
    for (const walletId of walletIds) {
      try {
        const result = await this.buyToken(walletId, amountPerWallet, options);
        results.push({ walletId, success: true, result });
        
        // Delay between purchases for organic feel
        if (delay > 0) {
          await this.sleep(delay + Math.random() * 2000); // Random 0-2s additional delay
        }
      } catch (error) {
        console.error(`Wallet ${walletId} buy failed:`, error.message);
        results.push({ walletId, success: false, error: error.message });
      }
    }

    const successful = results.filter(r => r.success).length;
    console.log(`✅ Coordinated buy completed: ${successful}/${walletIds.length} successful`);
    
    return results;
  }

  // Sell all tokens from multiple wallets
  async sellAll(walletIds = null, percentage = 100, options = {}) {
    const walletsToSell = walletIds ? 
      walletIds.map(id => this.getWalletById(id)).filter(w => w) :
      this.loadedWallets.filter(w => w.tokenBalance > 0);

    console.log(`💸 Selling ${percentage}% from ${walletsToSell.length} wallets`);
    
    const results = [];
    const delay = options.delay || 500; // 500ms delay between sells
    
    for (const wallet of walletsToSell) {
      try {
        const result = await this.sellToken(wallet.id, percentage, options);
        results.push({ walletId: wallet.id, success: true, result });
        
        if (delay > 0) {
          await this.sleep(delay + Math.random() * 1000);
        }
      } catch (error) {
        console.error(`Wallet ${wallet.id} sell failed:`, error.message);
        results.push({ walletId: wallet.id, success: false, error: error.message });
      }
    }

    const successful = results.filter(r => r.success).length;
    const totalProfit = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.result?.profit || 0), 0);

    console.log(`✅ Mass sell completed: ${successful}/${walletsToSell.length} successful`);
    console.log(`💰 Total profit: ${totalProfit.toFixed(4)} SOL`);
    
    return { results, totalProfit, successful };
  }

  // Withdraw profits to main wallet
  async withdrawProfits(mainWalletAddress, options = {}) {
    console.log(`💸 Withdrawing profits to ${mainWalletAddress}...`);
    
    const results = [];
    const minBalance = options.minBalance || 0.01; // Keep 0.01 SOL for fees
    
    for (const wallet of this.loadedWallets) {
      const availableBalance = wallet.balance - minBalance;
      
      if (availableBalance > 0.001) { // Only withdraw if > 0.001 SOL
        try {
          const transaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: wallet.keypair.publicKey,
              toPubkey: new PublicKey(mainWalletAddress),
              lamports: Math.floor(availableBalance * LAMPORTS_PER_SOL)
            })
          );

          const signature = await this.connection.sendTransaction(transaction, [wallet.keypair]);
          
          results.push({
            wallet: wallet.name,
            amount: availableBalance,
            signature: signature,
            success: true
          });

          wallet.balance = minBalance;
          console.log(`✅ Withdrew ${availableBalance.toFixed(4)} SOL from ${wallet.name}`);
        } catch (error) {
          console.error(`❌ Failed to withdraw from ${wallet.name}:`, error.message);
          results.push({
            wallet: wallet.name,
            amount: availableBalance,
            error: error.message,
            success: false
          });
        }
      }
    }

    const totalWithdrawn = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.amount, 0);

    console.log(`💰 Total withdrawn: ${totalWithdrawn.toFixed(4)} SOL`);
    return { results, totalWithdrawn };
  }

  // Get wallet by ID
  getWalletById(walletId) {
    return this.loadedWallets.find(w => w.id === walletId);
  }

  // Get trading statistics
  getTradingStats() {
    const totalProfit = this.loadedWallets.reduce((sum, w) => sum + w.profit, 0);
    
    return {
      ...this.tradingStats,
      totalProfit: totalProfit,
      averageProfit: totalProfit / Math.max(this.loadedWallets.length, 1),
      successRate: (this.tradingStats.successfulTrades / Math.max(this.tradingStats.totalTrades, 1)) * 100,
      walletsLoaded: this.loadedWallets.length,
      walletsWithTokens: this.loadedWallets.filter(w => w.tokenBalance > 0).length,
      totalSOLBalance: this.loadedWallets.reduce((sum, w) => sum + w.balance, 0)
    };
  }

  // Get wallet details
  getWalletDetails() {
    return this.loadedWallets.map(wallet => ({
      id: wallet.id,
      name: wallet.name,
      address: wallet.address,
      balance: wallet.balance,
      tokenBalance: wallet.tokenBalance,
      profit: wallet.profit,
      totalTrades: wallet.trades.length,
      lastTrade: wallet.trades.length > 0 ? wallet.trades[wallet.trades.length - 1] : null
    }));
  }

  // Emergency sell all tokens
  async emergencySellAll() {
    console.log('🚨 EMERGENCY SELL ALL TOKENS');
    
    const walletsWithTokens = this.loadedWallets.filter(w => w.tokenBalance > 0);
    
    if (walletsWithTokens.length === 0) {
      console.log('No tokens to sell');
      return;
    }

    // Sell everything immediately with minimal delays
    const results = await this.sellAll(
      walletsWithTokens.map(w => w.id),
      100, // 100% sell
      { delay: 100 } // Minimal delay
    );

    console.log(`🚨 Emergency sell completed: ${results.successful}/${walletsWithTokens.length} wallets`);
    return results;
  }

  // Set up profit-taking strategy
  async setupProfitTaking(targetProfitPercent = 100, stopLossPercent = -20) {
    console.log(`📊 Setting up profit taking: +${targetProfitPercent}% target, ${stopLossPercent}% stop loss`);
    
    const monitorInterval = setInterval(async () => {
      try {
        for (const wallet of this.loadedWallets) {
          if (wallet.tokenBalance > 0) {
            const currentProfit = this.calculateWalletProfitPercent(wallet);
            
            if (currentProfit >= targetProfitPercent) {
              console.log(`🎯 Profit target hit for ${wallet.name}: ${currentProfit.toFixed(2)}%`);
              await this.sellToken(wallet.id, 100);
            } else if (currentProfit <= stopLossPercent) {
              console.log(`🛑 Stop loss triggered for ${wallet.name}: ${currentProfit.toFixed(2)}%`);
              await this.sellToken(wallet.id, 100);
            }
          }
        }
      } catch (error) {
        console.error('Profit taking error:', error.message);
      }
    }, 30000); // Check every 30 seconds

    return monitorInterval;
  }

  // Calculate wallet profit percentage
  calculateWalletProfitPercent(wallet) {
    const totalBought = wallet.trades
      .filter(t => t.type === 'buy')
      .reduce((sum, t) => sum + t.amount, 0);
    
    if (totalBought === 0) return 0;
    
    return (wallet.profit / totalBought) * 100;
  }

  // Fund wallets from master wallet
  async fundWalletsFromMaster(masterWalletFile, masterPassword, amountPerWallet = 0.1) {
    console.log('💰 Funding wallets from master wallet...');
    
    // Load master wallet
    const masterData = await this.walletGenerator.loadWalletsFromFile(masterWalletFile, masterPassword);
    const masterWalletInfo = masterData.wallet;
    
    // Create master wallet object
    const privateKeyArray = Buffer.from(masterWalletInfo.privateKey, 'base64');
    const masterKeypair = require('@solana/web3.js').Keypair.fromSecretKey(privateKeyArray);
    const masterWallet = {
      keypair: masterKeypair,
      address: masterWalletInfo.address
    };

    // Fund all loaded wallets
    const results = await this.walletGenerator.fundWallets(
      masterWallet,
      this.loadedWallets,
      amountPerWallet
    );

    // Update balances after funding
    await this.updateAllBalances();

    return results;
  }

  // Sleep utility
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate trading report
  generateTradingReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.getTradingStats(),
      wallets: this.getWalletDetails(),
      topPerformers: this.loadedWallets
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5)
        .map(w => ({
          name: w.name,
          profit: w.profit,
          profitPercent: this.calculateWalletProfitPercent(w)
        })),
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  // Generate trading recommendations
  generateRecommendations() {
    const stats = this.getTradingStats();
    const recommendations = [];

    if (stats.successRate < 70) {
      recommendations.push('Consider adjusting trading strategy - success rate below 70%');
    }

    if (stats.totalProfit < 0) {
      recommendations.push('Overall position is at loss - consider risk management');
    }

    const walletsWithLargeBalance = this.loadedWallets.filter(w => w.balance > 1);
    if (walletsWithLargeBalance.length > 0) {
      recommendations.push('Consider withdrawing excess SOL from funded wallets');
    }

    if (stats.walletsWithTokens === 0) {
      recommendations.push('No active token positions - ready for next launch');
    }

    return recommendations;
  }
}

module.exports = LaunchTradingManager;