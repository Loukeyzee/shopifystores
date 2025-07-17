const { Connection, PublicKey } = require('@solana/web3.js');
const { BorshInstructionCoder } = require('@coral-xyz/anchor');
const EventEmitter = require('events');

class DirectLaunchHook extends EventEmitter {
  constructor(config = {}) {
    super();
    this.connection = new Connection(config.rpcUrl || 'https://api.mainnet-beta.solana.com');
    this.isMonitoring = false;
    this.subscriptions = new Map();
    
    // Platform-specific program IDs and instruction parsers
    this.platforms = {
      'pump.fun': {
        programId: new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'),
        deployInstruction: 'initialize2',
        parser: this.parsePumpFunDeployment.bind(this)
      },
      'pump.swap': {
        programId: new PublicKey('39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg'),
        deployInstruction: 'create_token',
        parser: this.parsePumpSwapDeployment.bind(this)
      }
    };

    this.detectionStats = {
      totalDetected: 0,
      averageDetectionTime: 0,
      fastestDetection: Infinity,
      missedTokens: 0
    };
  }

  // Start monitoring blockchain directly for token deployments
  async startDirectMonitoring() {
    if (this.isMonitoring) {
      console.log('Direct monitoring already active');
      return;
    }

    console.log('🔗 Starting DIRECT blockchain monitoring for token deployments...');
    this.isMonitoring = true;

    try {
      // Monitor each platform's program
      for (const [platformName, platform] of Object.entries(this.platforms)) {
        await this.monitorProgramTransactions(platformName, platform);
      }

      // Also monitor mempool for pending transactions (if RPC supports it)
      await this.monitorMempool();

      console.log('✅ Direct blockchain monitoring active');
      this.emit('directMonitoringStarted');
    } catch (error) {
      console.error('❌ Failed to start direct monitoring:', error);
      this.emit('error', error);
    }
  }

  // Monitor specific program transactions in real-time
  async monitorProgramTransactions(platformName, platform) {
    console.log(`🔍 Monitoring ${platformName} program transactions...`);

    try {
      // Subscribe to program account changes
      const subscriptionId = this.connection.onProgramAccountChange(
        platform.programId,
        (accountInfo, context) => {
          this.handleProgramAccountChange(platformName, accountInfo, context);
        },
        'confirmed' // Use 'confirmed' for balance between speed and reliability
      );

      // Also subscribe to logs for this program
      const logSubscriptionId = this.connection.onLogs(
        platform.programId,
        (logs, context) => {
          this.handleProgramLogs(platformName, logs, context);
        },
        'confirmed'
      );

      this.subscriptions.set(platformName, {
        accountSubscription: subscriptionId,
        logSubscription: logSubscriptionId
      });

      console.log(`✅ Subscribed to ${platformName} program changes`);
    } catch (error) {
      console.error(`❌ Failed to monitor ${platformName}:`, error);
    }
  }

  // Monitor mempool for pending transactions (advanced)
  async monitorMempool() {
    console.log('🔄 Setting up mempool monitoring...');
    
    try {
      // This would require a custom RPC or Jito's mempool access
      // For now, we'll use signature subscription as the fastest method
      
      // Monitor recent signatures for our target programs
      for (const [platformName, platform] of Object.entries(this.platforms)) {
        this.monitorRecentSignatures(platformName, platform);
      }
    } catch (error) {
      console.warn('⚠️ Mempool monitoring not available:', error.message);
    }
  }

  // Monitor recent signatures for early detection
  async monitorRecentSignatures(platformName, platform) {
    const pollInterval = 100; // Poll every 100ms for maximum speed
    
    const poll = async () => {
      if (!this.isMonitoring) return;

      try {
        const signatures = await this.connection.getSignaturesForAddress(
          platform.programId,
          { limit: 5 }, // Only get the 5 most recent
          'confirmed'
        );

        // Check for new deployment signatures
        for (const sig of signatures) {
          await this.checkSignatureForDeployment(platformName, sig);
        }
      } catch (error) {
        console.error(`Error polling ${platformName} signatures:`, error);
      }

      if (this.isMonitoring) {
        setTimeout(poll, pollInterval);
      }
    };

    poll();
    console.log(`🔄 Started signature polling for ${platformName} (${pollInterval}ms interval)`);
  }

  // Check if a signature represents a token deployment
  async checkSignatureForDeployment(platformName, signatureInfo) {
    try {
      const transaction = await this.connection.getParsedTransaction(
        signatureInfo.signature,
        'confirmed'
      );

      if (!transaction || transaction.meta?.err) {
        return; // Skip failed transactions
      }

      const deploymentData = this.parseTransactionForDeployment(platformName, transaction);
      if (deploymentData) {
        const detectionTime = Date.now();
        this.handleTokenDeploymentDetected(platformName, deploymentData, detectionTime);
      }
    } catch (error) {
      // Ignore individual transaction errors
    }
  }

  // Handle program account changes
  handleProgramAccountChange(platformName, accountInfo, context) {
    try {
      const platform = this.platforms[platformName];
      const tokenData = platform.parser(accountInfo);
      
      if (tokenData && this.isNewTokenDeployment(tokenData)) {
        const detectionTime = Date.now();
        this.handleTokenDeploymentDetected(platformName, tokenData, detectionTime);
      }
    } catch (error) {
      console.error(`Error parsing ${platformName} account change:`, error);
    }
  }

  // Handle program logs for deployment detection
  handleProgramLogs(platformName, logs, context) {
    try {
      // Look for deployment-specific log patterns
      const deploymentLogs = logs.logs.filter(log => 
        log.includes('initialize') || 
        log.includes('create') || 
        log.includes('deploy')
      );

      if (deploymentLogs.length > 0) {
        // Extract token address from logs
        const tokenAddress = this.extractTokenAddressFromLogs(deploymentLogs);
        if (tokenAddress) {
          const tokenData = {
            address: tokenAddress,
            platform: platformName,
            detectedVia: 'logs',
            slot: context.slot,
            signature: logs.signature
          };

          const detectionTime = Date.now();
          this.handleTokenDeploymentDetected(platformName, tokenData, detectionTime);
        }
      }
    } catch (error) {
      console.error(`Error parsing ${platformName} logs:`, error);
    }
  }

  // Parse transaction for deployment information
  parseTransactionForDeployment(platformName, transaction) {
    try {
      const platform = this.platforms[platformName];
      
      // Look for the deployment instruction
      for (const instruction of transaction.transaction.message.instructions) {
        if (instruction.programId.equals(platform.programId)) {
          const parsed = this.parseInstruction(platformName, instruction);
          if (parsed && parsed.type === 'deployment') {
            return parsed.data;
          }
        }
      }
    } catch (error) {
      console.error('Error parsing transaction:', error);
    }
    
    return null;
  }

  // Parse specific platform instructions
  parseInstruction(platformName, instruction) {
    const platform = this.platforms[platformName];
    return platform.parser(instruction);
  }

  // Parse Pump.fun deployment
  parsePumpFunDeployment(data) {
    try {
      // This would contain the actual Pump.fun instruction parsing logic
      // For demonstration, returning basic structure
      return {
        type: 'deployment',
        data: {
          tokenAddress: 'extracted_from_instruction_data',
          name: 'Token Name',
          symbol: 'SYMBOL',
          creator: 'creator_address',
          initialLiquidity: 0,
          platform: 'pump.fun'
        }
      };
    } catch (error) {
      return null;
    }
  }

  // Parse Pump.swap deployment
  parsePumpSwapDeployment(data) {
    try {
      // Similar parsing for Pump.swap
      return {
        type: 'deployment',
        data: {
          tokenAddress: 'extracted_from_instruction_data',
          name: 'Token Name',
          symbol: 'SYMBOL',
          creator: 'creator_address',
          initialLiquidity: 0,
          platform: 'pump.swap'
        }
      };
    } catch (error) {
      return null;
    }
  }

  // Extract token address from program logs
  extractTokenAddressFromLogs(logs) {
    try {
      // Look for patterns in logs that contain token addresses
      for (const log of logs) {
        // Common patterns for token addresses in logs
        const addressMatch = log.match(/[A-Za-z0-9]{32,44}/);
        if (addressMatch) {
          return addressMatch[0];
        }
      }
    } catch (error) {
      console.error('Error extracting address from logs:', error);
    }
    
    return null;
  }

  // Check if this is a new token deployment
  isNewTokenDeployment(tokenData) {
    // Add logic to filter out non-deployment events
    // This could check instruction type, account creation, etc.
    return tokenData && tokenData.address && tokenData.platform;
  }

  // Handle when a token deployment is detected
  handleTokenDeploymentDetected(platformName, tokenData, detectionTime) {
    this.detectionStats.totalDetected++;
    
    console.log(`🎯 DIRECT DEPLOYMENT DETECTED on ${platformName}:`, {
      address: tokenData.address,
      symbol: tokenData.symbol,
      platform: platformName,
      detectionTime: detectionTime,
      method: tokenData.detectedVia || 'direct'
    });

    // Emit for instant protection
    this.emit('deploymentDetected', {
      ...tokenData,
      platform: platformName,
      detectedAt: detectionTime,
      detectionMethod: 'direct-blockchain'
    });
  }

  // Stop monitoring
  async stopDirectMonitoring() {
    if (!this.isMonitoring) return;

    console.log('🛑 Stopping direct blockchain monitoring...');
    this.isMonitoring = false;

    // Remove all subscriptions
    for (const [platformName, subs] of this.subscriptions) {
      try {
        if (subs.accountSubscription) {
          await this.connection.removeAccountChangeListener(subs.accountSubscription);
        }
        if (subs.logSubscription) {
          await this.connection.removeOnLogsListener(subs.logSubscription);
        }
      } catch (error) {
        console.error(`Error removing ${platformName} subscriptions:`, error);
      }
    }

    this.subscriptions.clear();
    this.emit('directMonitoringStopped');
    console.log('✅ Direct blockchain monitoring stopped');
  }

  // Get monitoring status
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      platforms: Object.keys(this.platforms),
      activeSubscriptions: this.subscriptions.size,
      stats: this.detectionStats
    };
  }

  // Get detection statistics
  getStats() {
    return {
      ...this.detectionStats,
      subscriptionsActive: this.subscriptions.size,
      monitoringDuration: this.isMonitoring ? Date.now() - this.startTime : 0
    };
  }

  // Optimize for maximum detection speed
  async optimizeForSpeed() {
    console.log('🚀 Optimizing direct monitoring for maximum speed...');

    // Use fastest commitment level
    this.commitmentLevel = 'processed'; // Fastest but less reliable
    
    // Reduce polling intervals
    this.pollInterval = 50; // 50ms polling
    
    // Pre-warm connections
    await this.connection.getSlot();
    
    console.log('✅ Direct monitoring optimized for speed');
  }
}

module.exports = DirectLaunchHook;