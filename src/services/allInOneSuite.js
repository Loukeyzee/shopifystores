const VolumeBot = require('./volumeBot');
const BumpBot = require('./bumpBot');
const CommentBot = require('./commentBot');
const LaunchProtector = require('./launchProtector');
const EventEmitter = require('events');

class AllInOneSuite extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Platform support
      platforms: config.platforms || ['pump.fun', 'pump.swap'],
      
      // Bot configurations
      volumeBot: {
        enabled: config.volumeBot?.enabled !== false,
        minTradeAmount: config.volumeBot?.minTradeAmount || 0.001,
        maxTradeAmount: config.volumeBot?.maxTradeAmount || 0.1,
        walletCount: config.volumeBot?.walletCount || 20,
        volumeTarget: config.volumeBot?.volumeTarget || 15, // SOL per hour
        ...config.volumeBot
      },
      
      bumpBot: {
        enabled: config.bumpBot?.enabled !== false,
        bumpAmount: config.bumpBot?.bumpAmount || 0.01,
        maxBumpsPerHour: config.bumpBot?.maxBumpsPerHour || 12,
        walletCount: config.bumpBot?.walletCount || 5,
        trendingTargetPosition: config.bumpBot?.trendingTargetPosition || 10,
        ...config.bumpBot
      },
      
      commentBot: {
        enabled: config.commentBot?.enabled !== false,
        accountCount: config.commentBot?.accountCount || 10,
        maxCommentsPerHour: config.commentBot?.maxCommentsPerHour || 20,
        maxCommentsPerAccount: config.commentBot?.maxCommentsPerAccount || 3,
        ...config.commentBot
      },
      
      launchProtector: {
        enabled: config.launchProtector?.enabled !== false,
        autoProtect: config.launchProtector?.autoProtect || true,
        protectionDuration: config.launchProtector?.protectionDuration || 300000, // 5 minutes
        ...config.launchProtector
      },
      
      // Suite settings
      autoMode: config.autoMode || false,
      coordinatedOperations: config.coordinatedOperations !== false,
      ...config
    };

    // Initialize bots
    this.volumeBot = new VolumeBot(this.config.volumeBot);
    this.bumpBot = new BumpBot(this.config.bumpBot);
    this.commentBot = new CommentBot(this.config.commentBot);
    this.launchProtector = new LaunchProtector(this.config.launchProtector);

    // Suite state
    this.isRunning = false;
    this.currentToken = null;
    this.activeBots = new Set();
    this.operationHistory = [];
    
    // Combined statistics
    this.suiteStats = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      totalCost: 0,
      totalRevenue: 0,
      uptime: 0,
      botsActive: 0,
      platformStats: {
        'pump.fun': { operations: 0, cost: 0, revenue: 0 },
        'pump.swap': { operations: 0, cost: 0, revenue: 0 }
      }
    };

    // Event coordination
    this.setupEventCoordination();
  }

  // Initialize the entire suite
  async initialize() {
    console.log('🚀 Initializing All-in-One Suite...');
    
    try {
      const initResults = {};
      
      // Initialize each enabled bot
      if (this.config.volumeBot.enabled) {
        console.log('📊 Initializing Volume Bot...');
        initResults.volumeBot = await this.volumeBot.initialize();
      }
      
      if (this.config.bumpBot.enabled) {
        console.log('📈 Initializing Bump Bot...');
        initResults.bumpBot = await this.bumpBot.initialize();
      }
      
      if (this.config.commentBot.enabled) {
        console.log('💬 Initializing Comment Bot...');
        initResults.commentBot = await this.commentBot.initialize();
      }
      
      if (this.config.launchProtector.enabled) {
        console.log('🛡️ Initializing Launch Protector...');
        initResults.launchProtector = await this.launchProtector.initialize();
      }

      console.log('✅ All-in-One Suite initialized successfully');
      
      this.emit('suiteInitialized', {
        timestamp: Date.now(),
        results: initResults,
        enabledBots: this.getEnabledBots()
      });

      return {
        success: true,
        enabledBots: this.getEnabledBots(),
        results: initResults
      };
    } catch (error) {
      console.error('❌ Failed to initialize All-in-One Suite:', error);
      throw error;
    }
  }

  // Start the full suite for a token
  async startFullSuite(tokenAddress, platform = 'pump.fun', options = {}) {
    if (this.isRunning) {
      console.log('Suite already running for another token');
      return;
    }

    console.log(`🚀 Starting All-in-One Suite for ${tokenAddress} on ${platform}`);
    this.isRunning = true;
    this.startTime = Date.now();
    this.currentToken = { address: tokenAddress, platform };

    try {
      const startResults = {};
      
      // Start launch protection first (if enabled)
      if (this.config.launchProtector.enabled && options.protectLaunch !== false) {
        console.log('🛡️ Starting launch protection...');
        startResults.launchProtector = await this.launchProtector.startProtection(tokenAddress, platform);
        this.activeBots.add('launchProtector');
      }

      // Wait a moment for protection to establish
      if (this.activeBots.has('launchProtector')) {
        await this.sleep(5000); // 5 second delay
      }

      // Start volume bot
      if (this.config.volumeBot.enabled) {
        console.log('📊 Starting volume generation...');
        startResults.volumeBot = await this.volumeBot.startVolumeGeneration(tokenAddress, platform);
        this.activeBots.add('volumeBot');
      }

      // Start bump bot
      if (this.config.bumpBot.enabled) {
        console.log('📈 Starting bump bot...');
        const strategy = options.bumpStrategy || 'moderate';
        startResults.bumpBot = await this.bumpBot.startBumping(tokenAddress, platform, strategy);
        this.activeBots.add('bumpBot');
      }

      // Start comment bot
      if (this.config.commentBot.enabled) {
        console.log('💬 Starting comment bot...');
        startResults.commentBot = await this.commentBot.startCommenting(tokenAddress, platform);
        this.activeBots.add('commentBot');
      }

      // Start coordinated operations if enabled
      if (this.config.coordinatedOperations) {
        this.startCoordinatedOperations();
      }

      // Start suite monitoring
      this.startSuiteMonitoring();

      console.log(`✅ All-in-One Suite fully active for ${tokenAddress}`);
      console.log(`🤖 Active bots: ${Array.from(this.activeBots).join(', ')}`);

      this.emit('suiteStarted', {
        token: tokenAddress,
        platform,
        activeBots: Array.from(this.activeBots),
        results: startResults,
        timestamp: Date.now()
      });

      return {
        success: true,
        activeBots: Array.from(this.activeBots),
        results: startResults
      };
    } catch (error) {
      console.error('❌ Failed to start All-in-One Suite:', error);
      this.isRunning = false;
      this.activeBots.clear();
      throw error;
    }
  }

  // Setup event coordination between bots
  setupEventCoordination() {
    // Volume bot events
    this.volumeBot.on('tradeExecuted', (data) => {
      this.handleVolumeEvent(data);
    });

    // Bump bot events
    this.bumpBot.on('bumpExecuted', (data) => {
      this.handleBumpEvent(data);
    });

    this.bumpBot.on('positionChanged', (data) => {
      this.handlePositionChange(data);
    });

    // Comment bot events
    this.commentBot.on('commentPosted', (data) => {
      this.handleCommentEvent(data);
    });

    // Launch protector events
    this.launchProtector.on('sniperDetected', (data) => {
      this.handleSniperDetection(data);
    });

    this.launchProtector.on('protectionTriggered', (data) => {
      this.handleProtectionTrigger(data);
    });
  }

  // Handle volume bot events
  handleVolumeEvent(data) {
    console.log(`📊 Volume Event: ${data.type} ${data.amount} SOL`);
    
    this.updateSuiteStats('volume', data.amount, true);
    
    // Coordinate with other bots
    if (this.config.coordinatedOperations) {
      // Trigger complementary comment after significant volume
      if (data.amount > 0.05 && this.activeBots.has('commentBot')) {
        setTimeout(() => {
          this.triggerComplementaryComment('volume');
        }, Math.random() * 30000 + 15000); // 15-45 seconds delay
      }
    }
  }

  // Handle bump bot events
  handleBumpEvent(data) {
    console.log(`📈 Bump Event: ${data.amount} SOL at position ${data.position}`);
    
    this.updateSuiteStats('bump', data.amount, true);
    
    // Coordinate with volume bot for synergy
    if (this.config.coordinatedOperations && this.activeBots.has('volumeBot')) {
      // Increase volume after bump to amplify effect
      setTimeout(() => {
        this.triggerVolumeBoost();
      }, Math.random() * 60000 + 30000); // 30-90 seconds delay
    }
  }

  // Handle position changes
  handlePositionChange(data) {
    console.log(`📊 Position Change: ${data.previousPosition} → ${data.newPosition} (${data.trend})`);
    
    // Adjust strategy based on position
    if (data.newPosition > 50 && this.activeBots.has('commentBot')) {
      // Poor position, trigger hype comments
      setTimeout(() => {
        this.triggerComplementaryComment('hype');
      }, 5000);
    }
  }

  // Handle comment events
  handleCommentEvent(data) {
    console.log(`💬 Comment Posted: "${data.text.substring(0, 50)}..." by ${data.account}`);
    
    this.updateSuiteStats('comment', 0.001, true); // Small cost for comment
  }

  // Handle sniper detection
  handleSniperDetection(data) {
    console.log(`🚨 Sniper Detected: ${data.address} | Risk: ${data.riskScore}`);
    
    // Intensify protection and volume
    if (this.activeBots.has('volumeBot')) {
      this.triggerVolumeBoost(2.0); // Double volume boost
    }
  }

  // Handle protection triggers
  handleProtectionTrigger(data) {
    console.log(`🛡️ Protection Triggered: ${data.type} | ${data.transactionsProtected} transactions`);
    
    this.updateSuiteStats('protection', 0, true);
  }

  // Start coordinated operations
  startCoordinatedOperations() {
    console.log('🔄 Starting coordinated operations...');
    
    // Coordinated wave attacks every 10-20 minutes
    const coordinationInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(coordinationInterval);
        return;
      }

      try {
        await this.executeCoordinatedWave();
      } catch (error) {
        console.error('Coordinated wave failed:', error);
      }
    }, this.getRandomInterval(600000, 1200000)); // 10-20 minutes
  }

  // Execute coordinated wave across all bots
  async executeCoordinatedWave() {
    console.log('🌊 Executing coordinated wave attack...');
    
    const waveActions = [];

    // Start with volume surge
    if (this.activeBots.has('volumeBot')) {
      waveActions.push(this.triggerVolumeBoost(1.5));
    }

    // Follow with bump
    if (this.activeBots.has('bumpBot')) {
      setTimeout(() => {
        waveActions.push(this.triggerManualBump());
      }, 30000); // 30 seconds after volume
    }

    // Finish with hype comments
    if (this.activeBots.has('commentBot')) {
      setTimeout(() => {
        waveActions.push(this.triggerComplementaryComment('hype'));
        waveActions.push(this.triggerComplementaryComment('bullish'));
      }, 60000); // 60 seconds after volume
    }

    await Promise.allSettled(waveActions);
    
    this.operationHistory.push({
      type: 'coordinated_wave',
      timestamp: Date.now(),
      bots: Array.from(this.activeBots),
      success: true
    });

    console.log('✅ Coordinated wave completed');
  }

  // Trigger volume boost
  async triggerVolumeBoost(multiplier = 1.2) {
    if (!this.activeBots.has('volumeBot')) return;
    
    console.log(`📊 Triggering volume boost (${multiplier}x)`);
    
    // Temporarily increase volume parameters
    const originalConfig = { ...this.volumeBot.config };
    this.volumeBot.updateConfig({
      minTradeAmount: originalConfig.minTradeAmount * multiplier,
      maxTradeAmount: originalConfig.maxTradeAmount * multiplier,
      tradingInterval: Math.max(originalConfig.tradingInterval / multiplier, 5000)
    });

    // Reset after 5 minutes
    setTimeout(() => {
      this.volumeBot.updateConfig(originalConfig);
    }, 300000);
  }

  // Trigger manual bump
  async triggerManualBump(amount = null) {
    if (!this.activeBots.has('bumpBot')) return;
    
    console.log('📈 Triggering manual bump...');
    
    try {
      return await this.bumpBot.manualBump(amount);
    } catch (error) {
      console.error('Manual bump failed:', error);
    }
  }

  // Trigger complementary comment
  async triggerComplementaryComment(style = 'bullish') {
    if (!this.activeBots.has('commentBot')) return;
    
    console.log(`💬 Triggering ${style} comment...`);
    
    // Get a template and post it
    const templates = this.commentBot.commentTemplates[style] || this.commentBot.commentTemplates.bullish;
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    try {
      return await this.commentBot.postManualComment(randomTemplate);
    } catch (error) {
      console.error('Manual comment failed:', error);
    }
  }

  // Start suite monitoring
  startSuiteMonitoring() {
    const monitorInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(monitorInterval);
        return;
      }

      try {
        await this.performHealthCheck();
        await this.updateCombinedStats();
      } catch (error) {
        console.error('Suite monitoring error:', error);
      }
    }, 30000); // Every 30 seconds
  }

  // Perform health check on all bots
  async performHealthCheck() {
    const healthStatus = {};
    
    for (const botName of this.activeBots) {
      const bot = this[botName];
      
      if (bot) {
        healthStatus[botName] = {
          running: bot.isRunning,
          stats: bot.getStats ? bot.getStats() : 'No stats available',
          lastActivity: Date.now() // Simplified check
        };
      }
    }

    this.emit('healthCheck', {
      timestamp: Date.now(),
      status: healthStatus,
      overallHealth: Object.values(healthStatus).every(status => status.running)
    });
  }

  // Update combined statistics
  async updateCombinedStats() {
    let totalCost = 0;
    let totalOperations = 0;
    
    // Aggregate stats from all bots
    if (this.activeBots.has('volumeBot')) {
      const volumeStats = this.volumeBot.getStats();
      totalCost += volumeStats.totalVolume * 0.01; // Estimated cost
      totalOperations += volumeStats.totalTrades;
    }
    
    if (this.activeBots.has('bumpBot')) {
      const bumpStats = this.bumpBot.getStats();
      totalCost += bumpStats.totalCost;
      totalOperations += bumpStats.totalBumps;
    }
    
    if (this.activeBots.has('commentBot')) {
      const commentStats = this.commentBot.getStats();
      totalCost += commentStats.totalComments * 0.001; // Estimated cost
      totalOperations += commentStats.totalComments;
    }

    this.suiteStats.totalCost = totalCost;
    this.suiteStats.totalOperations = totalOperations;
    this.suiteStats.uptime = Date.now() - this.startTime;
    this.suiteStats.botsActive = this.activeBots.size;
  }

  // Update suite statistics
  updateSuiteStats(operation, cost, success) {
    this.suiteStats.totalOperations++;
    this.suiteStats.totalCost += cost;
    
    if (success) {
      this.suiteStats.successfulOperations++;
    } else {
      this.suiteStats.failedOperations++;
    }
    
    // Update platform stats
    if (this.currentToken && this.currentToken.platform) {
      const platform = this.currentToken.platform;
      this.suiteStats.platformStats[platform].operations++;
      this.suiteStats.platformStats[platform].cost += cost;
    }
  }

  // Stop individual bot
  async stopBot(botName) {
    if (!this.activeBots.has(botName)) {
      console.log(`❌ Bot ${botName} is not active`);
      return;
    }

    console.log(`🛑 Stopping ${botName}...`);
    
    try {
      const bot = this[botName];
      
      if (botName === 'volumeBot') {
        await bot.stopVolumeGeneration();
      } else if (botName === 'bumpBot') {
        await bot.stopBumping();
      } else if (botName === 'commentBot') {
        await bot.stopCommenting();
      } else if (botName === 'launchProtector') {
        await bot.stopProtection();
      }
      
      this.activeBots.delete(botName);
      
      console.log(`✅ ${botName} stopped`);
      
      this.emit('botStopped', {
        botName,
        timestamp: Date.now(),
        remainingBots: Array.from(this.activeBots)
      });
    } catch (error) {
      console.error(`Failed to stop ${botName}:`, error);
    }
  }

  // Stop the entire suite
  async stopFullSuite() {
    if (!this.isRunning) {
      console.log('Suite is not running');
      return;
    }

    console.log('🛑 Stopping All-in-One Suite...');
    
    try {
      const stopResults = {};
      
      // Stop all active bots
      for (const botName of this.activeBots) {
        stopResults[botName] = await this.stopBot(botName);
      }
      
      this.isRunning = false;
      this.activeBots.clear();
      this.currentToken = null;
      
      console.log('✅ All-in-One Suite stopped');
      
      this.emit('suiteStopped', {
        timestamp: Date.now(),
        finalStats: this.getSuiteStats(),
        results: stopResults
      });
      
      return { success: true, results: stopResults };
    } catch (error) {
      console.error('❌ Failed to stop suite:', error);
      throw error;
    }
  }

  // Get enabled bots
  getEnabledBots() {
    const enabled = [];
    
    if (this.config.volumeBot.enabled) enabled.push('volumeBot');
    if (this.config.bumpBot.enabled) enabled.push('bumpBot');
    if (this.config.commentBot.enabled) enabled.push('commentBot');
    if (this.config.launchProtector.enabled) enabled.push('launchProtector');
    
    return enabled;
  }

  // Get comprehensive suite statistics
  getSuiteStats() {
    const runtime = this.isRunning ? Date.now() - this.startTime : this.suiteStats.uptime;
    
    const combinedStats = {
      ...this.suiteStats,
      runtime,
      operationsPerHour: this.suiteStats.totalOperations * (3600000 / runtime),
      costPerHour: this.suiteStats.totalCost * (3600000 / runtime),
      successRate: (this.suiteStats.successfulOperations / this.suiteStats.totalOperations * 100).toFixed(2) + '%',
      currentToken: this.currentToken,
      activeBots: Array.from(this.activeBots),
      enabledBots: this.getEnabledBots()
    };

    // Add individual bot stats
    const botStats = {};
    
    if (this.activeBots.has('volumeBot')) {
      botStats.volumeBot = this.volumeBot.getStats();
    }
    
    if (this.activeBots.has('bumpBot')) {
      botStats.bumpBot = this.bumpBot.getStats();
    }
    
    if (this.activeBots.has('commentBot')) {
      botStats.commentBot = this.commentBot.getStats();
    }
    
    if (this.activeBots.has('launchProtector')) {
      botStats.launchProtector = this.launchProtector.getStats();
    }

    return {
      suite: combinedStats,
      bots: botStats
    };
  }

  // Get operation history
  getOperationHistory(limit = 100) {
    return this.operationHistory.slice(-limit);
  }

  // Emergency stop all operations
  emergencyStopAll() {
    console.log('🚨 EMERGENCY STOP - Halting all suite operations');
    
    for (const botName of this.activeBots) {
      const bot = this[botName];
      if (bot && bot.emergencyStop) {
        bot.emergencyStop();
      }
    }
    
    this.isRunning = false;
    this.activeBots.clear();
    
    this.emit('emergencyStop', { timestamp: Date.now() });
  }

  // Utility functions
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getRandomInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Configuration updates
  updateSuiteConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Update individual bot configs
    if (newConfig.volumeBot) {
      this.volumeBot.updateConfig(newConfig.volumeBot);
    }
    
    if (newConfig.bumpBot && this.bumpBot.updateConfig) {
      this.bumpBot.updateConfig(newConfig.bumpBot);
    }
    
    console.log('🔧 Suite configuration updated');
    
    this.emit('configUpdated', {
      timestamp: Date.now(),
      newConfig: this.config
    });
  }
}

module.exports = AllInOneSuite;