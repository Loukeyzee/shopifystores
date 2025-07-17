const WebSocket = require('ws');
const { Connection, PublicKey } = require('@solana/web3.js');
const axios = require('axios');
const EventEmitter = require('events');

class LaunchMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    this.connection = new Connection(config.rpcUrl || 'https://api.mainnet-beta.solana.com');
    this.isMonitoring = false;
    this.subscriptions = new Map();
    
    // Platform-specific configurations
    this.platforms = {
      'pump.fun': {
        programId: new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'),
        wsUrl: 'wss://pumpportal.fun/api/data',
        apiUrl: 'https://frontend-api.pump.fun',
        deployInstruction: 'initialize2'
      },
      'pump.swap': {
        programId: new PublicKey('39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg'),
        wsUrl: 'wss://api.pumpswap.io/ws',
        apiUrl: 'https://api.pumpswap.io',
        deployInstruction: 'create_token'
      }
    };
    
    this.config = {
      autoProtect: true,
      platforms: ['pump.fun', 'pump.swap'],
      filters: {
        minLiquidity: 0.1, // SOL
        maxMarketCap: 1000000, // USD
        requireMetadata: true
      },
      protection: {
        buyAmount: 1.0,
        maxSlippage: 5.0,
        protectionLevel: 'high'
      },
      ...config
    };
  }

  // Start monitoring for new launches
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('Launch monitor already running');
      return;
    }

    console.log('🚀 Starting real-time launch monitoring...');
    this.isMonitoring = true;

    try {
      // Monitor each enabled platform
      for (const platform of this.config.platforms) {
        await this.monitorPlatform(platform);
      }

      this.emit('monitoringStarted');
      console.log('✅ Launch monitoring active for:', this.config.platforms.join(', '));
    } catch (error) {
      console.error('❌ Failed to start launch monitoring:', error);
      this.emit('error', error);
    }
  }

  // Stop monitoring
  async stopMonitoring() {
    if (!this.isMonitoring) return;

    console.log('🛑 Stopping launch monitoring...');
    this.isMonitoring = false;

    // Close all subscriptions
    for (const [platform, subscription] of this.subscriptions) {
      try {
        if (subscription.ws) {
          subscription.ws.close();
        }
        if (subscription.solanaSubscription) {
          await this.connection.removeAccountChangeListener(subscription.solanaSubscription);
        }
      } catch (error) {
        console.error(`Error closing ${platform} subscription:`, error);
      }
    }

    this.subscriptions.clear();
    this.emit('monitoringStopped');
    console.log('✅ Launch monitoring stopped');
  }

  // Monitor specific platform
  async monitorPlatform(platformName) {
    const platform = this.platforms[platformName];
    if (!platform) {
      throw new Error(`Unknown platform: ${platformName}`);
    }

    console.log(`🔍 Monitoring ${platformName} for new launches...`);

    // Method 1: WebSocket monitoring (fastest)
    await this.setupWebSocketMonitoring(platformName, platform);

    // Method 2: Program account monitoring (backup)
    await this.setupProgramMonitoring(platformName, platform);

    // Method 3: API polling (fallback)
    this.setupApiPolling(platformName, platform);
  }

  // Setup WebSocket monitoring for real-time updates
  async setupWebSocketMonitoring(platformName, platform) {
    try {
      const ws = new WebSocket(platform.wsUrl);
      
      ws.on('open', () => {
        console.log(`🔗 Connected to ${platformName} WebSocket`);
        
        // Subscribe to new token events
        const subscribeMessage = {
          method: 'subscribe',
          params: {
            events: ['tokenCreate', 'newToken', 'launch'],
            filters: this.config.filters
          }
        };
        
        ws.send(JSON.stringify(subscribeMessage));
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(platformName, message);
        } catch (error) {
          console.error(`Error parsing ${platformName} WebSocket message:`, error);
        }
      });

      ws.on('error', (error) => {
        console.error(`${platformName} WebSocket error:`, error);
        // Attempt reconnection
        setTimeout(() => {
          if (this.isMonitoring) {
            this.setupWebSocketMonitoring(platformName, platform);
          }
        }, 5000);
      });

      ws.on('close', () => {
        console.log(`${platformName} WebSocket disconnected`);
        if (this.isMonitoring) {
          // Attempt reconnection
          setTimeout(() => {
            this.setupWebSocketMonitoring(platformName, platform);
          }, 3000);
        }
      });

      // Store subscription
      if (!this.subscriptions.has(platformName)) {
        this.subscriptions.set(platformName, {});
      }
      this.subscriptions.get(platformName).ws = ws;

    } catch (error) {
      console.error(`Failed to setup ${platformName} WebSocket:`, error);
    }
  }

  // Setup Solana program account monitoring
  async setupProgramMonitoring(platformName, platform) {
    try {
      const subscriptionId = this.connection.onProgramAccountChange(
        platform.programId,
        (accountInfo, context) => {
          this.handleProgramAccountChange(platformName, accountInfo, context);
        },
        'confirmed'
      );

      // Store subscription
      if (!this.subscriptions.has(platformName)) {
        this.subscriptions.set(platformName, {});
      }
      this.subscriptions.get(platformName).solanaSubscription = subscriptionId;

      console.log(`🔗 Monitoring ${platformName} program account changes`);
    } catch (error) {
      console.error(`Failed to setup ${platformName} program monitoring:`, error);
    }
  }

  // Setup API polling as fallback
  setupApiPolling(platformName, platform) {
    const pollInterval = 1000; // 1 second
    
    const poll = async () => {
      if (!this.isMonitoring) return;

      try {
        const newTokens = await this.fetchNewTokens(platformName, platform);
        newTokens.forEach(token => {
          this.handleNewTokenDetected(platformName, token);
        });
      } catch (error) {
        console.error(`${platformName} API polling error:`, error);
      }

      if (this.isMonitoring) {
        setTimeout(poll, pollInterval);
      }
    };

    // Store polling reference
    if (!this.subscriptions.has(platformName)) {
      this.subscriptions.set(platformName, {});
    }
    this.subscriptions.get(platformName).polling = poll;

    // Start polling
    poll();
    console.log(`🔄 Started ${platformName} API polling (${pollInterval}ms intervals)`);
  }

  // Handle WebSocket messages
  handleWebSocketMessage(platformName, message) {
    if (message.type === 'tokenCreate' || message.type === 'newToken') {
      const tokenData = this.parseTokenData(platformName, message.data);
      if (tokenData && this.shouldProtectToken(tokenData)) {
        this.handleNewTokenDetected(platformName, tokenData);
      }
    }
  }

  // Handle Solana program account changes
  handleProgramAccountChange(platformName, accountInfo, context) {
    try {
      const tokenData = this.parseAccountData(platformName, accountInfo);
      if (tokenData && this.shouldProtectToken(tokenData)) {
        this.handleNewTokenDetected(platformName, tokenData);
      }
    } catch (error) {
      console.error(`Error parsing ${platformName} account data:`, error);
    }
  }

  // Fetch new tokens from API
  async fetchNewTokens(platformName, platform) {
    try {
      const response = await axios.get(`${platform.apiUrl}/tokens/new`, {
        params: {
          limit: 10,
          since: Date.now() - 10000 // Last 10 seconds
        },
        timeout: 5000
      });

      return response.data.tokens || [];
    } catch (error) {
      console.error(`Failed to fetch new tokens from ${platformName}:`, error);
      return [];
    }
  }

  // Parse token data from different sources
  parseTokenData(platformName, data) {
    const parsers = {
      'pump.fun': (data) => ({
        address: data.mint || data.tokenAddress,
        name: data.name,
        symbol: data.symbol,
        description: data.description,
        image: data.image,
        createdAt: data.created_timestamp || Date.now(),
        marketCap: data.usd_market_cap || 0,
        liquidity: data.virtual_sol_reserves || 0,
        creator: data.creator,
        platform: 'pump.fun'
      }),
      'pump.swap': (data) => ({
        address: data.token_address || data.mint,
        name: data.metadata?.name,
        symbol: data.metadata?.symbol,
        description: data.metadata?.description,
        image: data.metadata?.image,
        createdAt: data.timestamp || Date.now(),
        marketCap: data.market_cap || 0,
        liquidity: data.liquidity_sol || 0,
        creator: data.creator_address,
        platform: 'pump.swap'
      })
    };

    const parser = parsers[platformName];
    return parser ? parser(data) : null;
  }

  // Parse account data from Solana
  parseAccountData(platformName, accountInfo) {
    try {
      // This would need platform-specific deserialization logic
      // For now, return basic info
      return {
        address: accountInfo.accountId.toString(),
        platform: platformName,
        createdAt: Date.now(),
        raw: accountInfo.accountInfo.data
      };
    } catch (error) {
      console.error('Error parsing account data:', error);
      return null;
    }
  }

  // Check if token should be protected
  shouldProtectToken(tokenData) {
    const filters = this.config.filters;
    
    // Check minimum liquidity
    if (filters.minLiquidity && tokenData.liquidity < filters.minLiquidity) {
      return false;
    }

    // Check maximum market cap
    if (filters.maxMarketCap && tokenData.marketCap > filters.maxMarketCap) {
      return false;
    }

    // Check if metadata is required
    if (filters.requireMetadata && (!tokenData.name || !tokenData.symbol)) {
      return false;
    }

    // Check against user's custom filters
    if (this.config.customFilters) {
      for (const filter of this.config.customFilters) {
        if (!filter(tokenData)) {
          return false;
        }
      }
    }

    return true;
  }

  // Handle new token detection
  async handleNewTokenDetected(platformName, tokenData) {
    const detectionTime = Date.now();
    console.log(`🎯 NEW TOKEN DETECTED on ${platformName}:`, {
      address: tokenData.address,
      name: tokenData.name,
      symbol: tokenData.symbol,
      platform: platformName,
      detectionLatency: detectionTime - (tokenData.createdAt || detectionTime)
    });

    // Emit event for GUI/other components
    this.emit('tokenDetected', {
      ...tokenData,
      platform: platformName,
      detectedAt: detectionTime
    });

    // Auto-protect if enabled
    if (this.config.autoProtect) {
      await this.triggerAutoProtection(tokenData);
    }
  }

  // Trigger automatic protection
  async triggerAutoProtection(tokenData) {
    try {
      console.log(`🛡️ AUTO-PROTECTING: ${tokenData.symbol} (${tokenData.address})`);

      const protectionConfig = {
        tokenAddress: tokenData.address,
        platform: tokenData.platform,
        buyAmount: this.config.protection.buyAmount,
        maxSlippage: this.config.protection.maxSlippage,
        protectionLevel: this.config.protection.protectionLevel,
        autoTriggered: true,
        detectedAt: Date.now()
      };

      // Emit protection trigger event
      this.emit('protectionTriggered', {
        token: tokenData,
        config: protectionConfig
      });

      console.log(`✅ Protection triggered for ${tokenData.symbol}`);
    } catch (error) {
      console.error(`❌ Auto-protection failed for ${tokenData.symbol}:`, error);
      this.emit('protectionError', {
        token: tokenData,
        error: error.message
      });
    }
  }

  // Update monitoring configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Launch monitor configuration updated');
    this.emit('configUpdated', this.config);
  }

  // Add custom filter
  addCustomFilter(filterFunction) {
    if (!this.config.customFilters) {
      this.config.customFilters = [];
    }
    this.config.customFilters.push(filterFunction);
  }

  // Get monitoring status
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      platforms: this.config.platforms,
      activeSubscriptions: Array.from(this.subscriptions.keys()),
      config: this.config
    };
  }

  // Get detection statistics
  getStats() {
    return {
      uptime: this.isMonitoring ? Date.now() - this.startTime : 0,
      tokensDetected: this.tokensDetected || 0,
      protectionsTriggered: this.protectionsTriggered || 0,
      platforms: this.config.platforms.length,
      filters: Object.keys(this.config.filters).length
    };
  }
}

module.exports = LaunchMonitor;