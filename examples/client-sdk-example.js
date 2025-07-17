/**
 * Solana Launch Protector - Client SDK Example
 * Simple integration for developers launching on Pump.fun, Pump.swap, etc.
 */

const axios = require('axios');

class LaunchProtectorSDK {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseURL = options.baseURL || 'https://api.launchprotector.io';
    this.timeout = options.timeout || 30000;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'LaunchProtector-SDK/1.0.0'
      }
    });
  }

  /**
   * Protect a Pump.fun token launch
   */
  async protectPumpFunLaunch(config) {
    try {
      const response = await this.client.post('/api/pumpfun/launch', {
        tokenName: config.tokenName,
        tokenSymbol: config.tokenSymbol,
        description: config.description || '',
        image: config.image || '',
        twitter: config.twitter || '',
        telegram: config.telegram || '',
        website: config.website || '',
        initialBuySOL: config.initialBuySOL || 1.0,
        maxBuyPerWallet: config.maxBuyPerWallet || 2.0
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Protect a Pump.swap launch
   */
  async protectPumpSwapLaunch(config) {
    try {
      const response = await this.client.post('/api/pumpswap/launch', {
        tokenMint: config.tokenMint,
        liquiditySOL: config.liquiditySOL,
        maxBuyPerWallet: config.maxBuyPerWallet || 2.0
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Protect a custom launch with raw transactions
   */
  async protectCustomLaunch(config) {
    try {
      const response = await this.client.post('/api/launch', {
        launchId: config.launchId,
        targetPlatform: config.platform || 'custom',
        transactions: config.transactions,
        tokenMint: config.tokenMint,
        config: {
          maxBuyPerWallet: config.maxBuyPerWallet || 2.0,
          bundleSize: config.bundleSize || 3,
          whitelistedWallets: config.whitelistedWallets || [],
          blacklistedWallets: config.blacklistedWallets || []
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Get launch status
   */
  async getLaunchStatus(launchId) {
    try {
      const response = await this.client.get(`/api/launch/${launchId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Get account statistics
   */
  async getStats() {
    try {
      const response = await this.client.get('/api/stats');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Get subscription info
   */
  async getSubscription() {
    try {
      const response = await this.client.get('/api/subscription');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }
}

// Usage Examples
async function examples() {
  // Initialize SDK
  const protector = new LaunchProtectorSDK('pk_live_your_api_key_here');

  // Example 1: Protect a Pump.fun launch
  console.log('🚀 Protecting Pump.fun launch...');
  const pumpfunResult = await protector.protectPumpFunLaunch({
    tokenName: 'My Awesome Token',
    tokenSymbol: 'MAT',
    description: 'The next big meme coin on Solana',
    image: 'https://example.com/token-logo.png',
    twitter: 'https://twitter.com/mytoken',
    telegram: 'https://t.me/mytoken',
    initialBuySOL: 5.0,
    maxBuyPerWallet: 2.0
  });

  if (pumpfunResult.success) {
    console.log('✅ Pump.fun launch protected!');
    console.log('Bundle ID:', pumpfunResult.data.bundleId);
    console.log('Snipers blocked:', pumpfunResult.data.protectionStats.snipersBlocked);
  } else {
    console.log('❌ Protection failed:', pumpfunResult.error);
  }

  // Example 2: Protect a Pump.swap launch
  console.log('\n🔄 Protecting Pump.swap launch...');
  const pumpswapResult = await protector.protectPumpSwapLaunch({
    tokenMint: 'YourTokenMintAddressHere...',
    liquiditySOL: 10.0,
    maxBuyPerWallet: 3.0
  });

  if (pumpswapResult.success) {
    console.log('✅ Pump.swap launch protected!');
    console.log('Bundle status:', pumpswapResult.data.protectionStats.bundleStatus);
  }

  // Example 3: Get launch status
  console.log('\n📊 Checking launch status...');
  if (pumpfunResult.success) {
    const status = await protector.getLaunchStatus(pumpfunResult.data.launchId);
    if (status.success) {
      console.log('Launch status:', status.data.protectionStats.bundleStatus);
      console.log('Execution time:', status.data.protectionStats.executionTime + 'ms');
    }
  }

  // Example 4: Get account statistics
  console.log('\n📈 Getting account stats...');
  const stats = await protector.getStats();
  if (stats.success) {
    console.log('Total launches:', stats.data.stats.totalLaunches);
    console.log('Successful launches:', stats.data.stats.successfulLaunches);
    console.log('Snipers blocked:', stats.data.stats.totalSnipersBlocked);
    console.log('Remaining launches:', stats.data.subscription.launchesRemaining);
  }

  // Example 5: Custom platform integration
  console.log('\n🔧 Custom launch protection...');
  const customResult = await protector.protectCustomLaunch({
    launchId: 'custom_launch_' + Date.now(),
    platform: 'raydium',
    transactions: [
      // Base64 encoded transactions would go here
      'transaction_1_base64...',
      'transaction_2_base64...'
    ],
    maxBuyPerWallet: 1.5,
    bundleSize: 2,
    whitelistedWallets: [
      'AllowedWallet1PublicKeyHere...',
      'AllowedWallet2PublicKeyHere...'
    ]
  });

  if (customResult.success) {
    console.log('✅ Custom launch protected!');
  }
}

// Export for use in other modules
module.exports = LaunchProtectorSDK;

// Run examples if this file is executed directly
if (require.main === module) {
  examples().catch(console.error);
}

/**
 * Advanced Usage Examples
 */

// Batch protection for multiple launches
async function batchProtection() {
  const protector = new LaunchProtectorSDK('pk_live_your_key');
  
  const launches = [
    { tokenName: 'Token A', tokenSymbol: 'TKA', initialBuySOL: 2.0 },
    { tokenName: 'Token B', tokenSymbol: 'TKB', initialBuySOL: 3.0 },
    { tokenName: 'Token C', tokenSymbol: 'TKC', initialBuySOL: 1.5 }
  ];

  const results = await Promise.all(
    launches.map(launch => protector.protectPumpFunLaunch(launch))
  );

  console.log(`Protected ${results.filter(r => r.success).length}/${launches.length} launches`);
}

// Monitoring launch with retries
async function monitorLaunchWithRetries(protector, launchId, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    const status = await protector.getLaunchStatus(launchId);
    
    if (status.success) {
      const bundleStatus = status.data.protectionStats.bundleStatus;
      
      if (bundleStatus === 'landed') {
        console.log('✅ Launch successful!');
        return status.data;
      } else if (bundleStatus === 'failed') {
        console.log('❌ Launch failed');
        return status.data;
      }
    }
    
    // Wait 2 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('⏰ Launch monitoring timeout');
  return null;
}

// Usage with error handling and retries
async function robustLaunchProtection(config) {
  const protector = new LaunchProtectorSDK('pk_live_your_key');
  
  try {
    // Step 1: Protect the launch
    const result = await protector.protectPumpFunLaunch(config);
    
    if (!result.success) {
      throw new Error(`Protection failed: ${result.error}`);
    }

    console.log('🛡️ Protection activated for:', config.tokenName);
    
    // Step 2: Monitor until completion
    const finalStatus = await monitorLaunchWithRetries(
      protector, 
      result.data.launchId
    );
    
    if (finalStatus && finalStatus.protectionStats.bundleStatus === 'landed') {
      console.log('🎉 Launch completed successfully!');
      console.log('Snipers blocked:', finalStatus.protectionStats.snipersBlocked);
      console.log('Bundle ID:', finalStatus.bundleId);
      return finalStatus;
    } else {
      throw new Error('Launch did not complete successfully');
    }
    
  } catch (error) {
    console.error('Launch protection failed:', error.message);
    throw error;
  }
}