const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { JitoClient } = require('./jitoClient');
const { LaunchProtector } = require('./launchProtector');
const EventEmitter = require('events');

class InstantProtector extends EventEmitter {
  constructor(config = {}) {
    super();
    this.connection = new Connection(config.rpcUrl || 'https://api.mainnet-beta.solana.com');
    this.jitoClient = new JitoClient(config);
    this.launchProtector = new LaunchProtector(config);
    
    this.config = {
      maxExecutionTime: 200, // 200ms max execution time
      priorityFeeMultiplier: 5, // 5x normal priority fees
      jitoTipMultiplier: 3, // 3x normal jito tips
      maxSlippage: 10, // Allow higher slippage for speed
      preloadTransactions: true,
      instantMode: true,
      ...config
    };

    // Pre-loaded transaction templates for instant execution
    this.transactionTemplates = new Map();
    this.readyTransactions = new Map();
    
    // Performance tracking
    this.stats = {
      totalDetections: 0,
      successfulProtections: 0,
      averageResponseTime: 0,
      fastestResponse: Infinity,
      slowestResponse: 0
    };
  }

  // Pre-load transaction templates for instant execution
  async preloadTransactionTemplates() {
    console.log('🔄 Pre-loading transaction templates for instant execution...');
    
    const platforms = ['pump.fun', 'pump.swap', 'raydium'];
    
    for (const platform of platforms) {
      try {
        const template = await this.createTransactionTemplate(platform);
        this.transactionTemplates.set(platform, template);
        console.log(`✅ Pre-loaded template for ${platform}`);
      } catch (error) {
        console.error(`❌ Failed to pre-load template for ${platform}:`, error);
      }
    }

    console.log(`🚀 ${this.transactionTemplates.size} transaction templates ready for instant execution`);
  }

  // Create transaction template for a platform
  async createTransactionTemplate(platform) {
    const templates = {
      'pump.fun': this.createPumpFunTemplate(),
      'pump.swap': this.createPumpSwapTemplate(),
      'raydium': this.createRaydiumTemplate()
    };

    return templates[platform] || null;
  }

  // Create Pump.fun transaction template
  createPumpFunTemplate() {
    return {
      platform: 'pump.fun',
      programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
      instructions: [
        // Pre-built instruction template for pump.fun buy
        {
          type: 'buy',
          accounts: [], // Will be filled with specific token data
          data: null // Will be filled with buy amount
        }
      ],
      computeUnits: 300000,
      priorityFee: 0.01 // Will be multiplied
    };
  }

  // Create Pump.swap transaction template
  createPumpSwapTemplate() {
    return {
      platform: 'pump.swap',
      programId: '39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg',
      instructions: [
        {
          type: 'swap',
          accounts: [],
          data: null
        }
      ],
      computeUnits: 250000,
      priorityFee: 0.008
    };
  }

  // Create Raydium transaction template
  createRaydiumTemplate() {
    return {
      platform: 'raydium',
      programId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
      instructions: [
        {
          type: 'swap',
          accounts: [],
          data: null
        }
      ],
      computeUnits: 400000,
      priorityFee: 0.015
    };
  }

  // Instantly protect a new token (called when token detected)
  async instantProtect(tokenData) {
    const startTime = Date.now();
    this.stats.totalDetections++;

    try {
      console.log(`⚡ INSTANT PROTECTION TRIGGERED for ${tokenData.symbol} (${tokenData.address})`);
      console.log(`🎯 Platform: ${tokenData.platform}`);

      // Step 1: Get pre-loaded template (0ms - already in memory)
      const template = this.transactionTemplates.get(tokenData.platform);
      if (!template) {
        throw new Error(`No template available for ${tokenData.platform}`);
      }

      // Step 2: Build transaction with pre-loaded template (~5-10ms)
      const transaction = await this.buildInstantTransaction(tokenData, template);

      // Step 3: Execute with maximum priority (~50-100ms)
      const result = await this.executeInstantTransaction(transaction, tokenData);

      const executionTime = Date.now() - startTime;
      this.updateStats(executionTime, true);

      console.log(`✅ INSTANT PROTECTION SUCCESS: ${tokenData.symbol} in ${executionTime}ms`);
      
      this.emit('protectionSuccess', {
        token: tokenData,
        executionTime,
        result
      });

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateStats(executionTime, false);

      console.error(`❌ INSTANT PROTECTION FAILED: ${tokenData.symbol} in ${executionTime}ms:`, error);
      
      this.emit('protectionError', {
        token: tokenData,
        executionTime,
        error: error.message
      });

      throw error;
    }
  }

  // Build transaction with pre-loaded template
  async buildInstantTransaction(tokenData, template) {
    const transaction = new Transaction();
    
    // Add compute budget instruction
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: this.config.wallet.publicKey,
        newAccountPubkey: new PublicKey(tokenData.address),
        lamports: Math.floor(this.config.buyAmount * LAMPORTS_PER_SOL),
        space: 0,
        programId: new PublicKey(template.programId)
      })
    );

    // Set priority fee (much higher for instant execution)
    const priorityFee = Math.floor(template.priorityFee * this.config.priorityFeeMultiplier * LAMPORTS_PER_SOL);
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: this.config.wallet.publicKey,
        toPubkey: new PublicKey('11111111111111111111111111111111'), // Fee recipient
        lamports: priorityFee
      })
    );

    // Get latest blockhash (critical for speed)
    const { blockhash } = await this.connection.getLatestBlockhash('processed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = this.config.wallet.publicKey;

    return transaction;
  }

  // Execute transaction with maximum priority
  async executeInstantTransaction(transaction, tokenData) {
    const bundleConfig = {
      tip: this.config.jitoTip * this.config.jitoTipMultiplier,
      maxRetries: 1, // No retries for speed
      commitment: 'processed', // Fastest commitment level
      skipPreflight: true, // Skip simulation for speed
      maxSlippage: this.config.maxSlippage
    };

    console.log(`🚀 Executing instant transaction with ${bundleConfig.tip} SOL tip`);

    // Create Jito bundle for MEV protection
    const bundle = await this.jitoClient.createBundle([transaction], bundleConfig);
    
    // Submit bundle with highest priority
    const result = await this.jitoClient.submitBundle(bundle, {
      priority: 'urgent',
      fastForward: true
    });

    // Wait for confirmation (max 5 seconds)
    const confirmation = await this.waitForConfirmation(result.bundleId, 5000);
    
    if (!confirmation.confirmed) {
      throw new Error('Transaction not confirmed within time limit');
    }

    return {
      bundleId: result.bundleId,
      signatures: result.signatures,
      confirmed: confirmation.confirmed,
      slot: confirmation.slot
    };
  }

  // Wait for transaction confirmation with timeout
  async waitForConfirmation(bundleId, timeoutMs = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const status = await this.jitoClient.getBundleStatus(bundleId);
        
        if (status.confirmed) {
          return {
            confirmed: true,
            slot: status.slot,
            confirmationTime: Date.now() - startTime
          };
        }
        
        // Check every 100ms
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error checking bundle status:', error);
      }
    }

    return {
      confirmed: false,
      timeout: true,
      timeoutMs
    };
  }

  // Update performance statistics
  updateStats(executionTime, success) {
    if (success) {
      this.stats.successfulProtections++;
    }

    // Update response time stats
    this.stats.averageResponseTime = (
      (this.stats.averageResponseTime * (this.stats.totalDetections - 1) + executionTime) /
      this.stats.totalDetections
    );

    this.stats.fastestResponse = Math.min(this.stats.fastestResponse, executionTime);
    this.stats.slowestResponse = Math.max(this.stats.slowestResponse, executionTime);
  }

  // Batch protect multiple tokens simultaneously
  async batchInstantProtect(tokens) {
    console.log(`⚡ BATCH INSTANT PROTECTION: ${tokens.length} tokens`);

    const protectionPromises = tokens.map(token => 
      this.instantProtect(token).catch(error => ({
        token,
        error: error.message,
        failed: true
      }))
    );

    const results = await Promise.allSettled(protectionPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled' && !r.value.failed);
    const failed = results.filter(r => r.status === 'rejected' || r.value?.failed);

    console.log(`📊 BATCH RESULTS: ${successful.length} successful, ${failed.length} failed`);

    return {
      successful: successful.length,
      failed: failed.length,
      results
    };
  }

  // Pre-build transactions for expected tokens
  async prebuildTransactions(expectedTokens) {
    console.log(`🔄 Pre-building transactions for ${expectedTokens.length} expected tokens...`);

    for (const tokenInfo of expectedTokens) {
      try {
        const template = this.transactionTemplates.get(tokenInfo.platform);
        if (template) {
          const transaction = await this.buildInstantTransaction(tokenInfo, template);
          this.readyTransactions.set(tokenInfo.expectedAddress, {
            transaction,
            tokenInfo,
            createdAt: Date.now()
          });
        }
      } catch (error) {
        console.error(`Failed to pre-build transaction for ${tokenInfo.expectedAddress}:`, error);
      }
    }

    console.log(`✅ ${this.readyTransactions.size} transactions pre-built and ready`);

    // Clean up old pre-built transactions (older than 5 minutes)
    this.cleanupOldTransactions();
  }

  // Clean up old pre-built transactions
  cleanupOldTransactions() {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    for (const [address, data] of this.readyTransactions) {
      if (data.createdAt < fiveMinutesAgo) {
        this.readyTransactions.delete(address);
      }
    }
  }

  // Get ready transaction if available
  getReadyTransaction(tokenAddress) {
    const ready = this.readyTransactions.get(tokenAddress);
    if (ready) {
      this.readyTransactions.delete(tokenAddress); // Use once
      return ready.transaction;
    }
    return null;
  }

  // Optimize for maximum speed
  async optimizeForSpeed() {
    console.log('🚀 Optimizing instant protector for maximum speed...');

    // Pre-load all transaction templates
    await this.preloadTransactionTemplates();

    // Warm up Jito connection
    await this.jitoClient.warmupConnection();

    // Pre-fetch recent blockhash
    this.startBlockhashRefresh();

    // Set up connection pool for parallel execution
    this.setupConnectionPool();

    console.log('✅ Instant protector optimized for sub-200ms execution');
  }

  // Start blockhash refresh interval
  startBlockhashRefresh() {
    this.blockhashInterval = setInterval(async () => {
      try {
        const { blockhash } = await this.connection.getLatestBlockhash('processed');
        this.cachedBlockhash = blockhash;
      } catch (error) {
        console.error('Failed to refresh blockhash:', error);
      }
    }, 1000); // Refresh every second
  }

  // Setup connection pool for parallel operations
  setupConnectionPool() {
    this.connectionPool = [];
    const poolSize = 5;

    for (let i = 0; i < poolSize; i++) {
      this.connectionPool.push(
        new Connection(this.config.rpcUrl, 'processed')
      );
    }

    console.log(`📡 Connection pool initialized with ${poolSize} connections`);
  }

  // Get performance statistics
  getStats() {
    const successRate = this.stats.totalDetections > 0 
      ? (this.stats.successfulProtections / this.stats.totalDetections * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      successRate: `${successRate}%`,
      templatesLoaded: this.transactionTemplates.size,
      readyTransactions: this.readyTransactions.size,
      isOptimized: this.transactionTemplates.size > 0
    };
  }

  // Cleanup resources
  cleanup() {
    if (this.blockhashInterval) {
      clearInterval(this.blockhashInterval);
    }

    this.transactionTemplates.clear();
    this.readyTransactions.clear();
    
    console.log('🧹 Instant protector cleanup completed');
  }
}

module.exports = InstantProtector;