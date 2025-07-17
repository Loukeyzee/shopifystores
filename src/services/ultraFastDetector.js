const { Connection, PublicKey } = require('@solana/web3.js');
const WebSocket = require('ws');
const axios = require('axios');
const EventEmitter = require('events');
const DirectLaunchHook = require('./directLaunchHook');

class UltraFastDetector extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      rpcUrl: config.rpcUrl || 'https://api.mainnet-beta.solana.com',
      commitment: 'processed', // Fastest commitment level
      maxDetectionTime: 50, // Target detection time in ms
      ...config
    };

    this.connection = new Connection(this.config.rpcUrl, this.config.commitment);
    this.directHook = new DirectLaunchHook(config);
    this.isMonitoring = false;
    this.detectionMethods = new Map();
    
    // Performance tracking
    this.stats = {
      totalDetections: 0,
      averageDetectionTime: 0,
      fastestDetection: Infinity,
      slowestDetection: 0,
      methodStats: {
        'blockchain-direct': { detected: 0, avgTime: 0 },
        'websocket': { detected: 0, avgTime: 0 },
        'mempool': { detected: 0, avgTime: 0 },
        'api-polling': { detected: 0, avgTime: 0 }
      }
    };

    // Platform configurations with multiple endpoints
    this.platforms = {
      'pump.fun': {
        programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
        endpoints: {
          websocket: 'wss://pumpportal.fun/api/data',
          api: 'https://frontend-api.pump.fun',
          backup_ws: 'wss://api.pump.fun/ws',
          backup_api: 'https://api.pump.fun/tokens'
        }
      },
      'pump.swap': {
        programId: '39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg',
        endpoints: {
          websocket: 'wss://api.pumpswap.io/ws',
          api: 'https://api.pumpswap.io',
          backup_ws: 'wss://ws.pumpswap.io/live',
          backup_api: 'https://backend.pumpswap.io/tokens'
        }
      }
    };
  }

  // Start ultra-fast detection with all methods
  async startUltraFastDetection() {
    if (this.isMonitoring) {
      console.log('Ultra-fast detection already active');
      return;
    }

    console.log('🚀 Starting ULTRA-FAST token detection...');
    console.log('📊 Target detection time: <50ms');
    this.isMonitoring = true;
    this.startTime = Date.now();

    try {
      // Method 1: Direct blockchain monitoring (fastest)
      await this.startDirectBlockchainMonitoring();

      // Method 2: Multiple WebSocket connections (redundancy)
      await this.startMultiWebSocketMonitoring();

      // Method 3: High-frequency API polling (backup)
      await this.startHighFrequencyPolling();

      // Method 4: Mempool monitoring (if available)
      await this.startMempoolMonitoring();

      // Method 5: Signature stream monitoring
      await this.startSignatureStreamMonitoring();

      console.log('✅ Ultra-fast detection system ACTIVE');
      console.log(`🔗 Monitoring ${Object.keys(this.platforms).length} platforms with ${this.detectionMethods.size} detection methods`);
      
      this.emit('ultraFastDetectionStarted');
    } catch (error) {
      console.error('❌ Failed to start ultra-fast detection:', error);
      this.emit('error', error);
    }
  }

  // Method 1: Direct blockchain monitoring
  async startDirectBlockchainMonitoring() {
    console.log('🔗 Starting direct blockchain monitoring...');
    
    this.directHook.on('deploymentDetected', (tokenData) => {
      this.handleTokenDetected('blockchain-direct', tokenData, Date.now());
    });

    await this.directHook.startDirectMonitoring();
    this.detectionMethods.set('blockchain-direct', { active: true, type: 'subscription' });
    
    console.log('✅ Direct blockchain monitoring active');
  }

  // Method 2: Multiple WebSocket connections
  async startMultiWebSocketMonitoring() {
    console.log('🌐 Starting multi-WebSocket monitoring...');

    for (const [platform, config] of Object.entries(this.platforms)) {
      // Primary WebSocket
      this.setupWebSocket(platform, config.endpoints.websocket, 'primary');
      
      // Backup WebSocket
      if (config.endpoints.backup_ws) {
        this.setupWebSocket(platform, config.endpoints.backup_ws, 'backup');
      }
    }

    this.detectionMethods.set('websocket', { active: true, type: 'multiple' });
    console.log('✅ Multi-WebSocket monitoring active');
  }

  // Setup individual WebSocket connection
  setupWebSocket(platform, wsUrl, type) {
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.on('open', () => {
        console.log(`🔗 Connected to ${platform} WebSocket (${type})`);
        
        // Subscribe to new token events
        const subscribeMessage = {
          method: 'subscribe',
          params: ['tokenCreate', 'newToken', 'deploy']
        };
        ws.send(JSON.stringify(subscribeMessage));
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(platform, message, Date.now());
        } catch (error) {
          // Ignore parsing errors
        }
      });

      ws.on('error', (error) => {
        console.warn(`${platform} WebSocket error (${type}):`, error.message);
        // Auto-reconnect
        setTimeout(() => {
          if (this.isMonitoring) {
            this.setupWebSocket(platform, wsUrl, type);
          }
        }, 1000);
      });

      ws.on('close', () => {
        console.log(`${platform} WebSocket disconnected (${type})`);
        if (this.isMonitoring) {
          setTimeout(() => {
            this.setupWebSocket(platform, wsUrl, type);
          }, 2000);
        }
      });

    } catch (error) {
      console.error(`Failed to setup ${platform} WebSocket:`, error);
    }
  }

  // Method 3: High-frequency API polling
  async startHighFrequencyPolling() {
    console.log('⚡ Starting high-frequency API polling...');

    for (const [platform, config] of Object.entries(this.platforms)) {
      this.startPlatformPolling(platform, config);
    }

    this.detectionMethods.set('api-polling', { active: true, type: 'polling' });
    console.log('✅ High-frequency API polling active');
  }

  // Start polling for specific platform
  startPlatformPolling(platform, config) {
    const pollInterval = 200; // 200ms intervals
    let lastCheckTime = Date.now();

    const poll = async () => {
      if (!this.isMonitoring) return;

      try {
        const newTokens = await this.fetchNewTokens(platform, config, lastCheckTime);
        const currentTime = Date.now();
        
        newTokens.forEach(token => {
          this.handleTokenDetected('api-polling', {
            ...token,
            platform
          }, currentTime);
        });

        lastCheckTime = currentTime;
      } catch (error) {
        console.error(`${platform} polling error:`, error.message);
      }

      if (this.isMonitoring) {
        setTimeout(poll, pollInterval);
      }
    };

    poll();
    console.log(`🔄 Started ${platform} polling (${pollInterval}ms intervals)`);
  }

  // Fetch new tokens from API
  async fetchNewTokens(platform, config, sinceTime) {
    try {
      const endpoints = [config.endpoints.api];
      if (config.endpoints.backup_api) {
        endpoints.push(config.endpoints.backup_api);
      }

      // Try primary endpoint first
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${endpoint}/tokens/new`, {
            params: {
              since: sinceTime,
              limit: 10
            },
            timeout: 1000 // 1 second timeout
          });

          return response.data.tokens || [];
        } catch (error) {
          continue; // Try next endpoint
        }
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  // Method 4: Mempool monitoring
  async startMempoolMonitoring() {
    console.log('🏊 Starting mempool monitoring...');

    try {
      // This would require specialized RPC access or Jito's mempool
      // For now, we'll simulate with very frequent signature monitoring
      
      for (const [platform, config] of Object.entries(this.platforms)) {
        this.startMempoolPolling(platform, new PublicKey(config.programId));
      }

      this.detectionMethods.set('mempool', { active: true, type: 'simulation' });
      console.log('✅ Mempool monitoring active (simulated)');
    } catch (error) {
      console.warn('⚠️ Mempool monitoring not available:', error.message);
    }
  }

  // Simulate mempool monitoring with very frequent signature polling
  startMempoolPolling(platform, programId) {
    const pollInterval = 100; // 100ms for mempool simulation
    let lastSignature = null;

    const poll = async () => {
      if (!this.isMonitoring) return;

      try {
        const signatures = await this.connection.getSignaturesForAddress(
          programId,
          { 
            limit: 3,
            before: lastSignature
          },
          'processed'
        );

        if (signatures.length > 0) {
          lastSignature = signatures[0].signature;
          
          // Check each signature for deployment
          for (const sig of signatures) {
            this.checkSignatureForToken(platform, sig.signature);
          }
        }
      } catch (error) {
        // Ignore individual errors
      }

      if (this.isMonitoring) {
        setTimeout(poll, pollInterval);
      }
    };

    poll();
  }

  // Method 5: Signature stream monitoring
  async startSignatureStreamMonitoring() {
    console.log('📡 Starting signature stream monitoring...');

    try {
      for (const [platform, config] of Object.entries(this.platforms)) {
        const programId = new PublicKey(config.programId);
        
        // Subscribe to signature notifications for the program
        this.connection.onSignature(
          programId.toString(),
          (result, context) => {
            this.handleSignatureNotification(platform, result, context);
          },
          'processed'
        );
      }

      this.detectionMethods.set('signature-stream', { active: true, type: 'subscription' });
      console.log('✅ Signature stream monitoring active');
    } catch (error) {
      console.warn('⚠️ Signature stream monitoring failed:', error.message);
    }
  }

  // Handle WebSocket messages
  handleWebSocketMessage(platform, message, detectionTime) {
    if (message.type === 'tokenCreate' || message.type === 'newToken') {
      const tokenData = {
        address: message.data.mint || message.data.address,
        name: message.data.name,
        symbol: message.data.symbol,
        platform: platform,
        detectedVia: 'websocket'
      };

      this.handleTokenDetected('websocket', tokenData, detectionTime);
    }
  }

  // Handle signature notifications
  handleSignatureNotification(platform, result, context) {
    // This is called when a transaction is confirmed
    // We would parse the transaction to see if it's a token deployment
    this.checkSignatureForToken(platform, result.signature);
  }

  // Check if signature represents a token deployment
  async checkSignatureForToken(platform, signature) {
    try {
      const transaction = await this.connection.getParsedTransaction(
        signature,
        'confirmed'
      );

      if (transaction && !transaction.meta?.err) {
        const tokenData = this.parseTransactionForToken(platform, transaction);
        if (tokenData) {
          this.handleTokenDetected('mempool', tokenData, Date.now());
        }
      }
    } catch (error) {
      // Ignore individual transaction errors
    }
  }

  // Parse transaction for token information
  parseTransactionForToken(platform, transaction) {
    try {
      // Look for token creation patterns in the transaction
      // This would contain platform-specific parsing logic
      
      // For demonstration, return basic structure
      const accounts = transaction.transaction.message.accountKeys;
      if (accounts && accounts.length > 0) {
        return {
          address: accounts[0].pubkey.toString(),
          platform: platform,
          detectedVia: 'transaction-parsing'
        };
      }
    } catch (error) {
      return null;
    }
    
    return null;
  }

  // Central token detection handler
  handleTokenDetected(method, tokenData, detectionTime) {
    const now = Date.now();
    const timeSinceDetection = now - detectionTime;

    // Update method stats
    if (this.stats.methodStats[method]) {
      const methodStat = this.stats.methodStats[method];
      methodStat.detected++;
      methodStat.avgTime = (methodStat.avgTime + timeSinceDetection) / methodStat.detected;
    }

    // Update overall stats
    this.stats.totalDetections++;
    this.stats.averageDetectionTime = (
      (this.stats.averageDetectionTime * (this.stats.totalDetections - 1) + timeSinceDetection) /
      this.stats.totalDetections
    );
    this.stats.fastestDetection = Math.min(this.stats.fastestDetection, timeSinceDetection);
    this.stats.slowestDetection = Math.max(this.stats.slowestDetection, timeSinceDetection);

    console.log(`🎯 TOKEN DETECTED via ${method.toUpperCase()}:`, {
      address: tokenData.address,
      symbol: tokenData.symbol,
      platform: tokenData.platform,
      detectionTime: timeSinceDetection,
      method: method
    });

    // Emit for instant protection
    this.emit('tokenDetected', {
      ...tokenData,
      detectedAt: now,
      detectionLatency: timeSinceDetection,
      detectionMethod: method
    });
  }

  // Stop ultra-fast detection
  async stopUltraFastDetection() {
    if (!this.isMonitoring) return;

    console.log('🛑 Stopping ultra-fast detection...');
    this.isMonitoring = false;

    // Stop direct hook
    if (this.directHook) {
      await this.directHook.stopDirectMonitoring();
    }

    // Clear detection methods
    this.detectionMethods.clear();

    this.emit('ultraFastDetectionStopped');
    console.log('✅ Ultra-fast detection stopped');
  }

  // Get detection statistics
  getStats() {
    const runtime = this.isMonitoring ? Date.now() - this.startTime : 0;
    
    return {
      ...this.stats,
      runtime: runtime,
      detectionMethods: this.detectionMethods.size,
      targetsActive: Object.keys(this.platforms).length,
      efficiency: this.calculateEfficiency()
    };
  }

  // Calculate detection efficiency
  calculateEfficiency() {
    if (this.stats.totalDetections === 0) return 0;
    
    const speedScore = this.stats.averageDetectionTime < 50 ? 100 : 
                     Math.max(0, 100 - (this.stats.averageDetectionTime - 50) / 5);
    
    const methodScore = (this.detectionMethods.size / 5) * 100; // Max 5 methods
    
    return Math.round((speedScore + methodScore) / 2);
  }

  // Get method performance breakdown
  getMethodBreakdown() {
    return {
      totalDetections: this.stats.totalDetections,
      methodStats: this.stats.methodStats,
      fastestMethod: this.getFastestMethod(),
      mostReliableMethod: this.getMostReliableMethod()
    };
  }

  // Get fastest detection method
  getFastestMethod() {
    let fastest = null;
    let fastestTime = Infinity;

    for (const [method, stats] of Object.entries(this.stats.methodStats)) {
      if (stats.detected > 0 && stats.avgTime < fastestTime) {
        fastestTime = stats.avgTime;
        fastest = method;
      }
    }

    return { method: fastest, averageTime: fastestTime };
  }

  // Get most reliable detection method
  getMostReliableMethod() {
    let mostReliable = null;
    let highestCount = 0;

    for (const [method, stats] of Object.entries(this.stats.methodStats)) {
      if (stats.detected > highestCount) {
        highestCount = stats.detected;
        mostReliable = method;
      }
    }

    return { method: mostReliable, detectionCount: highestCount };
  }
}

module.exports = UltraFastDetector;