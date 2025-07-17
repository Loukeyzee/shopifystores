const LaunchMonitor = require('../../services/launchMonitor');
const InstantProtector = require('../../services/instantProtector');
const { LaunchProtector } = require('../../services/launchProtector');
const EventEmitter = require('events');

class ProtectionService extends EventEmitter {
  constructor() {
    super();
    this.launchMonitor = null;
    this.instantProtector = null;
    this.launchProtector = null;
    this.isInitialized = false;
    this.currentConfig = null;
  }

  // Initialize the protection service
  async initialize(config) {
    try {
      console.log('🔧 Initializing protection service...');
      
      this.currentConfig = config;
      
      // Initialize core components
      this.launchProtector = new LaunchProtector(config);
      this.instantProtector = new InstantProtector(config);
      this.launchMonitor = new LaunchMonitor(config);

      // Set up event forwarding from components to GUI
      this.setupEventForwarding();

      // Optimize instant protector for speed
      await this.instantProtector.optimizeForSpeed();

      this.isInitialized = true;
      console.log('✅ Protection service initialized');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to initialize protection service:', error);
      throw error;
    }
  }

  // Set up event forwarding between components and GUI
  setupEventForwarding() {
    // Launch Monitor Events
    this.launchMonitor.on('tokenDetected', (tokenData) => {
      this.emit('token-detected', tokenData);
    });

    this.launchMonitor.on('monitoringStarted', () => {
      this.emit('monitoring-started');
    });

    this.launchMonitor.on('monitoringStopped', () => {
      this.emit('monitoring-stopped');
    });

    this.launchMonitor.on('protectionTriggered', (data) => {
      this.emit('protection-triggered', data);
      // Trigger instant protection
      this.handleInstantProtection(data.token, data.config);
    });

    // Instant Protector Events
    this.instantProtector.on('protectionSuccess', (data) => {
      this.emit('protection-success', data);
    });

    this.instantProtector.on('protectionError', (data) => {
      this.emit('protection-error', data);
    });

    // Regular stats updates
    setInterval(() => {
      this.emitStatsUpdate();
    }, 2000); // Update every 2 seconds
  }

  // Handle instant protection when token detected
  async handleInstantProtection(tokenData, config) {
    try {
      const result = await this.instantProtector.instantProtect(tokenData);
      return result;
    } catch (error) {
      console.error('Instant protection failed:', error);
      throw error;
    }
  }

  // Start launch monitoring
  async startLaunchMonitoring(config) {
    if (!this.isInitialized) {
      await this.initialize(config);
    }

    try {
      console.log('🚀 Starting launch monitoring with config:', config);
      
      // Update launch monitor configuration
      this.launchMonitor.updateConfig(config);
      
      // Start monitoring
      await this.launchMonitor.startMonitoring();
      
      return { success: true, message: 'Launch monitoring started' };
    } catch (error) {
      console.error('Failed to start launch monitoring:', error);
      throw error;
    }
  }

  // Stop launch monitoring
  async stopLaunchMonitoring() {
    if (!this.launchMonitor) {
      return { success: true, message: 'Monitoring not active' };
    }

    try {
      await this.launchMonitor.stopMonitoring();
      return { success: true, message: 'Launch monitoring stopped' };
    } catch (error) {
      console.error('Failed to stop launch monitoring:', error);
      throw error;
    }
  }

  // Get launch monitor status
  getLaunchMonitorStatus() {
    if (!this.launchMonitor) {
      return {
        isMonitoring: false,
        platforms: [],
        activeSubscriptions: [],
        stats: {},
        instantStats: {}
      };
    }

    const monitorStatus = this.launchMonitor.getStatus();
    const monitorStats = this.launchMonitor.getStats();
    const instantStats = this.instantProtector ? this.instantProtector.getStats() : {};

    return {
      ...monitorStatus,
      stats: monitorStats,
      instantStats: instantStats
    };
  }

  // Start traditional protection (manual token input)
  async startProtection(config) {
    if (!this.isInitialized) {
      await this.initialize(config);
    }

    try {
      console.log('🛡️ Starting manual protection for:', config.tokenAddress);
      
      const result = await this.launchProtector.protectTokenLaunch([{
        tokenAddress: config.tokenAddress,
        platform: config.platform,
        buyAmount: config.buyAmount,
        protectionLevel: config.protectionLevel
      }], {
        maxBuyPerWallet: config.buyAmount,
        bundleSize: 5,
        whitelistedWallets: config.customWhitelist || [],
        protectionStrategies: this.getProtectionStrategies(config.protectionLevel)
      });

      return { success: true, result };
    } catch (error) {
      console.error('Manual protection failed:', error);
      throw error;
    }
  }

  // Stop protection
  async stopProtection() {
    try {
      // Stop monitoring if active
      if (this.launchMonitor && this.launchMonitor.isMonitoring) {
        await this.launchMonitor.stopMonitoring();
      }

      // Clean up instant protector
      if (this.instantProtector) {
        this.instantProtector.cleanup();
      }

      return { success: true, message: 'Protection stopped' };
    } catch (error) {
      console.error('Failed to stop protection:', error);
      throw error;
    }
  }

  // Get protection status
  getStatus() {
    const monitorStatus = this.getLaunchMonitorStatus();
    
    return {
      status: monitorStatus.isMonitoring ? 'running' : 'stopped',
      isMonitoring: monitorStatus.isMonitoring,
      platforms: monitorStatus.platforms,
      lastUpdate: new Date().toISOString()
    };
  }

  // Get protection statistics
  getStats() {
    const monitorStats = this.launchMonitor ? this.launchMonitor.getStats() : {};
    const instantStats = this.instantProtector ? this.instantProtector.getStats() : {};

    return {
      // Monitor stats
      tokensDetected: monitorStats.tokensDetected || 0,
      uptime: monitorStats.uptime || 0,
      platforms: monitorStats.platforms || 0,
      
      // Protection stats
      snipersBlocked: instantStats.successfulProtections || 0,
      transactionsProtected: instantStats.totalDetections || 0,
      successRate: instantStats.successRate || '0%',
      averageResponseTime: instantStats.averageResponseTime || 0,
      fastestResponse: instantStats.fastestResponse !== Infinity ? instantStats.fastestResponse : 0,
      
      // Combined stats
      totalSaved: 0, // Would calculate from successful protections
      efficiency: this.calculateEfficiency(instantStats)
    };
  }

  // Protect specific platforms
  async protectPumpFunLaunch(config) {
    return await this.startProtection({
      ...config,
      platform: 'pump.fun'
    });
  }

  async protectPumpSwapLaunch(config) {
    return await this.startProtection({
      ...config,
      platform: 'pump.swap'
    });
  }

  async protectRaydiumLaunch(config) {
    return await this.startProtection({
      ...config,
      platform: 'raydium'
    });
  }

  // Get protection strategies based on level
  getProtectionStrategies(level) {
    const strategies = {
      low: [
        { type: 'anti-sniper', enabled: true, config: { maxSniperConfidence: 60 } }
      ],
      medium: [
        { type: 'anti-sniper', enabled: true, config: { maxSniperConfidence: 70 } },
        { type: 'sandwich-protection', enabled: true, config: { useJitoDontFront: true } }
      ],
      high: [
        { type: 'anti-sniper', enabled: true, config: { maxSniperConfidence: 80 } },
        { type: 'sandwich-protection', enabled: true, config: { useJitoDontFront: true } },
        { type: 'frontrun-protection', enabled: true, config: { priorityMultiplier: 3 } }
      ],
      maximum: [
        { type: 'anti-sniper', enabled: true, config: { maxSniperConfidence: 90 } },
        { type: 'sandwich-protection', enabled: true, config: { useJitoDontFront: true } },
        { type: 'frontrun-protection', enabled: true, config: { priorityMultiplier: 5 } },
        { type: 'mev-protection', enabled: true, config: { jitoTipMultiplier: 3 } }
      ]
    };

    return strategies[level] || strategies.medium;
  }

  // Calculate efficiency metrics
  calculateEfficiency(instantStats) {
    if (!instantStats.totalDetections || instantStats.totalDetections === 0) {
      return 0;
    }

    const successRate = (instantStats.successfulProtections / instantStats.totalDetections) * 100;
    const speedScore = instantStats.averageResponseTime < 200 ? 100 : 
                     Math.max(0, 100 - (instantStats.averageResponseTime - 200) / 10);
    
    return Math.round((successRate + speedScore) / 2);
  }

  // Emit stats update to GUI
  emitStatsUpdate() {
    const stats = {
      monitor: this.launchMonitor ? this.launchMonitor.getStats() : {},
      instant: this.instantProtector ? this.instantProtector.getStats() : {}
    };

    this.emit('monitor-stats-updated', stats);
  }

  // Batch protect multiple tokens
  async batchProtect(tokens) {
    if (!this.instantProtector) {
      throw new Error('Instant protector not initialized');
    }

    return await this.instantProtector.batchInstantProtect(tokens);
  }

  // Add custom filter for token detection
  addCustomFilter(filterFunction) {
    if (this.launchMonitor) {
      this.launchMonitor.addCustomFilter(filterFunction);
    }
  }

  // Update configuration
  updateConfig(newConfig) {
    this.currentConfig = { ...this.currentConfig, ...newConfig };
    
    if (this.launchMonitor) {
      this.launchMonitor.updateConfig(newConfig);
    }
  }

  // Cleanup resources
  cleanup() {
    console.log('🧹 Cleaning up protection service...');
    
    if (this.launchMonitor) {
      this.launchMonitor.stopMonitoring().catch(console.error);
    }

    if (this.instantProtector) {
      this.instantProtector.cleanup();
    }

    this.removeAllListeners();
    this.isInitialized = false;
    
    console.log('✅ Protection service cleanup completed');
  }
}

module.exports = ProtectionService;