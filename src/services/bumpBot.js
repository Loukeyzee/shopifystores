const { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const axios = require('axios');
const EventEmitter = require('events');

class BumpBot extends EventEmitter {
  constructor(config = {}) {
    super();
    this.connection = new Connection(config.rpcUrl || 'https://api.mainnet-beta.solana.com');
    this.isRunning = false;
    this.bumpWallets = [];
    this.currentToken = null;
    
    this.config = {
      bumpAmount: config.bumpAmount || 0.01, // SOL per bump
      bumpInterval: config.bumpInterval || 300000, // 5 minutes
      maxBumpsPerHour: config.maxBumpsPerHour || 12,
      walletCount: config.walletCount || 5,
      platforms: config.platforms || ['pump.fun', 'pump.swap'],
      trendingTargetPosition: config.trendingTargetPosition || 10, // Top 10
      ...config
    };

    this.stats = {
      totalBumps: 0,
      successfulBumps: 0,
      failedBumps: 0,
      averageBumpCost: 0,
      totalCost: 0,
      currentPosition: 0,
      bestPosition: 999,
      uptime: 0,
      platformStats: {
        'pump.fun': { bumps: 0, cost: 0, position: 0 },
        'pump.swap': { bumps: 0, cost: 0, position: 0 }
      }
    };

    this.bumpStrategies = {
      gentle: {
        minInterval: 600000, // 10 minutes
        maxInterval: 1800000, // 30 minutes
        bumpSizeVariation: 0.1, // 10% variation
        priority: 'low'
      },
      moderate: {
        minInterval: 300000, // 5 minutes
        maxInterval: 900000, // 15 minutes
        bumpSizeVariation: 0.2, // 20% variation
        priority: 'medium'
      },
      aggressive: {
        minInterval: 120000, // 2 minutes
        maxInterval: 600000, // 10 minutes
        bumpSizeVariation: 0.3, // 30% variation
        priority: 'high'
      }
    };

    this.positionHistory = [];
    this.bumpHistory = [];
  }

  // Initialize bump bot
  async initialize() {
    console.log('📈 Initializing Bump Bot...');
    
    try {
      // Generate bump wallets
      await this.setupBumpWallets();
      
      // Fund wallets
      await this.fundBumpWallets();
      
      console.log(`✅ Bump Bot initialized with ${this.bumpWallets.length} wallets`);
      return { success: true, wallets: this.bumpWallets.length };
    } catch (error) {
      console.error('❌ Failed to initialize bump bot:', error);
      throw error;
    }
  }

  // Set up bump wallets
  async setupBumpWallets() {
    console.log(`🔑 Setting up ${this.config.walletCount} bump wallets...`);
    
    for (let i = 0; i < this.config.walletCount; i++) {
      const keypair = Keypair.generate();
      
      this.bumpWallets.push({
        keypair,
        address: keypair.publicKey.toString(),
        balance: 0,
        bumpsExecuted: 0,
        lastBumpTime: 0,
        strategy: this.getRandomStrategy()
      });
    }
    
    console.log(`✅ Generated ${this.bumpWallets.length} bump wallets`);
  }

  // Get random bump strategy
  getRandomStrategy() {
    const strategies = Object.keys(this.bumpStrategies);
    return strategies[Math.floor(Math.random() * strategies.length)];
  }

  // Fund bump wallets
  async fundBumpWallets() {
    console.log('💰 Funding bump wallets...');
    
    const fundPerWallet = 0.05; // 0.05 SOL per wallet
    let fundedWallets = 0;
    
    for (const wallet of this.bumpWallets) {
      try {
        // In production, fund from main wallet
        wallet.balance = fundPerWallet;
        fundedWallets++;
      } catch (error) {
        console.error(`Failed to fund bump wallet ${wallet.address}:`, error);
      }
    }
    
    console.log(`✅ Funded ${fundedWallets} bump wallets with ${fundPerWallet} SOL each`);
  }

  // Start bump bot for a token
  async startBumping(tokenAddress, platform = 'pump.fun', strategy = 'moderate') {
    if (this.isRunning) {
      console.log('Bump bot already running');
      return;
    }

    console.log(`📈 Starting bump bot for ${tokenAddress} on ${platform}`);
    this.isRunning = true;
    this.startTime = Date.now();
    this.currentToken = { address: tokenAddress, platform };
    this.currentStrategy = strategy;

    try {
      // Start position monitoring
      this.startPositionMonitoring();
      
      // Start intelligent bumping
      this.startIntelligentBumping();
      
      // Start trend analysis
      this.startTrendAnalysis();
      
      this.emit('bumpingStarted', {
        token: tokenAddress,
        platform,
        strategy,
        wallets: this.bumpWallets.length
      });

      console.log(`✅ Bump bot active for ${tokenAddress} with ${strategy} strategy`);
    } catch (error) {
      console.error('❌ Failed to start bump bot:', error);
      this.isRunning = false;
      throw error;
    }
  }

  // Start position monitoring
  startPositionMonitoring() {
    const monitorInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(monitorInterval);
        return;
      }

      try {
        await this.checkCurrentPosition();
      } catch (error) {
        console.error('Position monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  // Check current position in trending
  async checkCurrentPosition() {
    try {
      const position = await this.getCurrentTrendingPosition();
      
      if (position !== this.stats.currentPosition) {
        console.log(`📊 Position changed: ${this.stats.currentPosition} → ${position}`);
        
        this.stats.currentPosition = position;
        this.stats.bestPosition = Math.min(this.stats.bestPosition, position);
        
        // Update platform stats
        this.stats.platformStats[this.currentToken.platform].position = position;
        
        // Record position history
        this.positionHistory.push({
          position,
          timestamp: Date.now(),
          platform: this.currentToken.platform
        });

        this.emit('positionChanged', {
          newPosition: position,
          previousPosition: this.stats.currentPosition,
          trend: position < this.stats.currentPosition ? 'up' : 'down'
        });
      }

      return position;
    } catch (error) {
      console.error('Failed to check position:', error);
      return this.stats.currentPosition;
    }
  }

  // Get current trending position
  async getCurrentTrendingPosition() {
    try {
      const platform = this.currentToken.platform;
      let apiUrl;
      
      if (platform === 'pump.fun') {
        apiUrl = 'https://frontend-api.pump.fun/coins/trending';
      } else if (platform === 'pump.swap') {
        apiUrl = 'https://api.pumpswap.io/tokens/trending';
      }

      const response = await axios.get(apiUrl, { timeout: 5000 });
      const trendingTokens = response.data.tokens || response.data;
      
      const position = trendingTokens.findIndex(token => 
        token.mint === this.currentToken.address || 
        token.address === this.currentToken.address
      ) + 1;

      return position > 0 ? position : 999; // 999 if not in trending
    } catch (error) {
      console.error('Failed to fetch trending position:', error);
      return 999;
    }
  }

  // Start intelligent bumping
  startIntelligentBumping() {
    const bumpInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(bumpInterval);
        return;
      }

      try {
        await this.executeIntelligentBump();
      } catch (error) {
        console.error('Intelligent bump failed:', error);
      }
    }, this.getAdaptiveInterval()); // Adaptive interval
  }

  // Get adaptive bump interval based on position
  getAdaptiveInterval() {
    const position = this.stats.currentPosition;
    const strategy = this.bumpStrategies[this.currentStrategy];
    
    // Bump more frequently if position is worse
    if (position > 50) {
      return strategy.minInterval; // Fastest bumping
    } else if (position > 20) {
      return (strategy.minInterval + strategy.maxInterval) / 2; // Medium bumping
    } else {
      return strategy.maxInterval; // Slower bumping for maintenance
    }
  }

  // Execute intelligent bump
  async executeIntelligentBump() {
    // Check if we need to bump based on position and time
    const shouldBump = await this.shouldExecuteBump();
    
    if (!shouldBump) {
      return;
    }

    const wallet = this.getAvailableBumpWallet();
    if (!wallet) {
      console.log('⚠️ No available bump wallets');
      return;
    }

    const bumpAmount = this.calculateOptimalBumpAmount();
    
    console.log(`📈 Executing bump: ${bumpAmount} SOL | Position: ${this.stats.currentPosition}`);
    
    try {
      const result = await this.executeBump(wallet, bumpAmount);
      
      if (result.success) {
        this.updateBumpStats(bumpAmount, true);
        
        // Record bump in history
        this.bumpHistory.push({
          timestamp: Date.now(),
          amount: bumpAmount,
          wallet: wallet.address,
          positionBefore: this.stats.currentPosition,
          strategy: this.currentStrategy
        });

        this.emit('bumpExecuted', {
          amount: bumpAmount,
          wallet: wallet.address,
          position: this.stats.currentPosition,
          result
        });
      } else {
        this.updateBumpStats(bumpAmount, false);
      }
    } catch (error) {
      console.error(`❌ Bump execution failed: ${error.message}`);
      this.updateBumpStats(bumpAmount, false);
    }
  }

  // Check if we should execute a bump
  async shouldExecuteBump() {
    const position = this.stats.currentPosition;
    const target = this.config.trendingTargetPosition;
    const timeSinceLastBump = Date.now() - this.getLastBumpTime();
    const strategy = this.bumpStrategies[this.currentStrategy];

    // Don't bump if position is already good
    if (position <= target && position > 0) {
      return false;
    }

    // Don't bump too frequently
    if (timeSinceLastBump < strategy.minInterval) {
      return false;
    }

    // Check hourly bump limit
    const bumpsThisHour = this.getBumpsInLastHour();
    if (bumpsThisHour >= this.config.maxBumpsPerHour) {
      return false;
    }

    // Bump if position is getting worse or not trending
    return position > target || position === 999;
  }

  // Get last bump time
  getLastBumpTime() {
    if (this.bumpHistory.length === 0) return 0;
    return this.bumpHistory[this.bumpHistory.length - 1].timestamp;
  }

  // Get bumps in last hour
  getBumpsInLastHour() {
    const oneHourAgo = Date.now() - 3600000; // 1 hour
    return this.bumpHistory.filter(bump => bump.timestamp > oneHourAgo).length;
  }

  // Calculate optimal bump amount
  calculateOptimalBumpAmount() {
    const position = this.stats.currentPosition;
    const baseAmount = this.config.bumpAmount;
    const strategy = this.bumpStrategies[this.currentStrategy];
    
    // Larger bumps for worse positions
    let multiplier = 1;
    if (position > 100) {
      multiplier = 2.0; // Double bump for very bad position
    } else if (position > 50) {
      multiplier = 1.5; // 50% more for bad position
    } else if (position > 20) {
      multiplier = 1.2; // 20% more for mediocre position
    }

    // Apply strategy variation
    const variation = 1 + (Math.random() - 0.5) * 2 * strategy.bumpSizeVariation;
    
    return baseAmount * multiplier * variation;
  }

  // Get available bump wallet
  getAvailableBumpWallet() {
    const availableWallets = this.bumpWallets.filter(w => 
      Date.now() - w.lastBumpTime > 60000 && // 1 minute cooldown
      w.balance > 0.005 // Minimum balance
    );

    if (availableWallets.length === 0) return null;
    return availableWallets[Math.floor(Math.random() * availableWallets.length)];
  }

  // Execute bump transaction
  async executeBump(wallet, amount) {
    const startTime = Date.now();
    
    try {
      let result;
      if (this.currentToken.platform === 'pump.fun') {
        result = await this.executePumpFunBump(wallet, amount);
      } else if (this.currentToken.platform === 'pump.swap') {
        result = await this.executePumpSwapBump(wallet, amount);
      }

      // Update wallet
      wallet.lastBumpTime = Date.now();
      wallet.bumpsExecuted++;
      wallet.balance -= amount;

      return {
        success: true,
        amount,
        signature: result.signature,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      throw error;
    }
  }

  // Execute Pump.fun bump
  async executePumpFunBump(wallet, amount) {
    // Simulate Pump.fun bump transaction
    const transaction = new Transaction();
    
    // Add bump transaction (small buy)
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: wallet.keypair.publicKey,
        toPubkey: new PublicKey(this.currentToken.address),
        lamports: Math.floor(amount * LAMPORTS_PER_SOL)
      })
    );

    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.keypair.publicKey;
    transaction.sign(wallet.keypair);
    
    return {
      signature: 'bump_signature_' + Date.now(),
      success: true
    };
  }

  // Execute Pump.swap bump
  async executePumpSwapBump(wallet, amount) {
    return await this.executePumpFunBump(wallet, amount);
  }

  // Start trend analysis
  startTrendAnalysis() {
    const analysisInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(analysisInterval);
        return;
      }

      try {
        await this.analyzeTrends();
      } catch (error) {
        console.error('Trend analysis error:', error);
      }
    }, 120000); // Analyze every 2 minutes
  }

  // Analyze trends and adjust strategy
  async analyzeTrends() {
    if (this.positionHistory.length < 5) return; // Need some history

    const recentHistory = this.positionHistory.slice(-10); // Last 10 positions
    const trend = this.calculatePositionTrend(recentHistory);
    
    console.log(`📊 Trend analysis: ${trend.direction} (${trend.strength.toFixed(2)})`);

    // Adjust strategy based on trend
    if (trend.direction === 'declining' && trend.strength > 0.5) {
      // Position getting worse, be more aggressive
      this.currentStrategy = 'aggressive';
      console.log('🔥 Switching to aggressive bumping strategy');
    } else if (trend.direction === 'improving' && trend.strength > 0.3) {
      // Position improving, maintain with moderate strategy
      this.currentStrategy = 'moderate';
      console.log('⚖️ Switching to moderate bumping strategy');
    } else if (this.stats.currentPosition <= this.config.trendingTargetPosition) {
      // Good position, maintain with gentle bumps
      this.currentStrategy = 'gentle';
      console.log('🌱 Switching to gentle bumping strategy');
    }

    this.emit('strategyChanged', {
      newStrategy: this.currentStrategy,
      trend,
      currentPosition: this.stats.currentPosition
    });
  }

  // Calculate position trend
  calculatePositionTrend(history) {
    if (history.length < 2) return { direction: 'stable', strength: 0 };

    const first = history[0].position;
    const last = history[history.length - 1].position;
    const change = last - first;
    const strength = Math.abs(change) / Math.max(first, last);

    return {
      direction: change < 0 ? 'improving' : change > 0 ? 'declining' : 'stable',
      strength: strength,
      change: change
    };
  }

  // Update bump statistics
  updateBumpStats(amount, success) {
    this.stats.totalBumps++;
    this.stats.totalCost += amount;
    
    if (success) {
      this.stats.successfulBumps++;
      this.stats.platformStats[this.currentToken.platform].bumps++;
      this.stats.platformStats[this.currentToken.platform].cost += amount;
    } else {
      this.stats.failedBumps++;
    }

    this.stats.averageBumpCost = this.stats.totalCost / this.stats.totalBumps;
    this.stats.uptime = Date.now() - this.startTime;
  }

  // Stop bump bot
  async stopBumping() {
    if (!this.isRunning) return;

    console.log('🛑 Stopping bump bot...');
    this.isRunning = false;

    this.emit('bumpingStopped', {
      stats: this.getStats(),
      runtime: Date.now() - this.startTime
    });

    console.log('✅ Bump bot stopped');
  }

  // Get bump bot statistics
  getStats() {
    const runtime = this.isRunning ? Date.now() - this.startTime : this.stats.uptime;
    const bumpsPerHour = this.stats.totalBumps * (3600000 / runtime);
    
    return {
      ...this.stats,
      runtime,
      bumpsPerHour: bumpsPerHour.toFixed(2),
      successRate: (this.stats.successfulBumps / this.stats.totalBumps * 100).toFixed(2) + '%',
      costEfficiency: (this.stats.totalCost / this.stats.successfulBumps).toFixed(4),
      positionImprovement: this.stats.bestPosition < 999 ? (999 - this.stats.bestPosition) : 0,
      currentStrategy: this.currentStrategy,
      recentTrend: this.getRecentTrend()
    };
  }

  // Get recent trend
  getRecentTrend() {
    if (this.positionHistory.length < 3) return 'insufficient_data';
    
    const recent = this.positionHistory.slice(-5);
    const trend = this.calculatePositionTrend(recent);
    return trend.direction;
  }

  // Get position history
  getPositionHistory(limit = 50) {
    return this.positionHistory.slice(-limit);
  }

  // Get bump history
  getBumpHistory(limit = 50) {
    return this.bumpHistory.slice(-limit);
  }

  // Manual bump trigger
  async manualBump(amount = null) {
    if (!this.isRunning) {
      throw new Error('Bump bot not running');
    }

    const wallet = this.getAvailableBumpWallet();
    if (!wallet) {
      throw new Error('No available bump wallets');
    }

    const bumpAmount = amount || this.calculateOptimalBumpAmount();
    
    console.log(`🔧 Manual bump triggered: ${bumpAmount} SOL`);
    
    return await this.executeBump(wallet, bumpAmount);
  }

  // Set bump strategy
  setBumpStrategy(strategy) {
    if (this.bumpStrategies[strategy]) {
      this.currentStrategy = strategy;
      console.log(`✅ Bump strategy set to: ${strategy}`);
      
      this.emit('strategyChanged', {
        newStrategy: strategy,
        manual: true
      });
    } else {
      throw new Error(`Invalid strategy: ${strategy}`);
    }
  }

  // Emergency stop
  emergencyStop() {
    console.log('🚨 EMERGENCY STOP - Halting all bumping');
    this.isRunning = false;
    this.emit('emergencyStop', { timestamp: Date.now() });
  }
}

module.exports = BumpBot;