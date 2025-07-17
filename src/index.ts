import { Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import cron from 'node-cron';
import { config } from './config';
import { LaunchProtector } from './services/launchProtector';
import { log } from './utils/logger';
import { LaunchProtection, ProtectionStrategy, BundleResult } from './types';

class SolanaBundlerBot {
  private protector: LaunchProtector;
  private botKeypair: Keypair;
  private isRunning = false;

  constructor() {
    this.protector = new LaunchProtector(config);
    
    // Initialize bot keypair
    try {
      const privateKeyBytes = bs58.decode(config.botPrivateKey);
      this.botKeypair = Keypair.fromSecretKey(privateKeyBytes);
      log.info(`Bot initialized with wallet: ${this.botKeypair.publicKey.toString()}`);
    } catch (error) {
      log.error('Failed to initialize bot keypair', error);
      throw new Error('Invalid bot private key format');
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      log.warn('Bot is already running');
      return;
    }

    log.info('🚀 Starting Solana Bundler Bot...');
    
    try {
      // Validate configuration
      await this.validateSetup();
      
      // Start monitoring and cleanup tasks
      this.startBackgroundTasks();
      
      this.isRunning = true;
      log.success('Solana Bundler Bot started successfully');
      
      // Keep the process running
      this.handleGracefulShutdown();
      
    } catch (error) {
      log.error('Failed to start bot', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      log.warn('Bot is not running');
      return;
    }

    log.info('🛑 Stopping Solana Bundler Bot...');
    
    this.isRunning = false;
    
    // Emergency shutdown of protector
    await this.protector.emergencyShutdown();
    
    log.success('Solana Bundler Bot stopped successfully');
  }

  /**
   * Main method to protect a token launch
   */
  async protectTokenLaunch(
    transactions: Transaction[],
    options: {
      maxBuyPerWallet?: number;
      bundleSize?: number;
      whitelistedWallets?: PublicKey[];
      blacklistedWallets?: PublicKey[];
    } = {}
  ): Promise<BundleResult> {
    const {
      maxBuyPerWallet = config.maxBuyAmount,
      bundleSize = Math.min(transactions.length, config.maxTransactionsPerBundle),
      whitelistedWallets = [],
      blacklistedWallets = []
    } = options;

    log.info('🛡️ Protecting token launch', {
      transactionCount: transactions.length,
      bundleSize,
      maxBuyPerWallet
    });

    // Create protection configuration
    const protectionStrategies: ProtectionStrategy[] = [
      {
        type: 'anti-sniper',
        enabled: config.enableAntiSniper,
        config: {
          maxSniperConfidence: 70,
          analyzeAllWallets: true,
          blacklistSnipers: true
        }
      },
      {
        type: 'sandwich-protection',
        enabled: config.enableSandwichProtection,
        config: {
          useJitoDontFront: true,
          bundleTransactions: true,
          maxSlippage: config.maxSlippage
        }
      },
      {
        type: 'frontrun-protection',
        enabled: true,
        config: {
          useBundles: true,
          priorityOrdering: true,
          tipOptimization: true
        }
      }
    ];

    const launchConfig: LaunchProtection = {
      bundleSize,
      delayBetweenTransactions: 0, // Execute all transactions in same bundle
      maxBuyPerWallet,
      whitelistedWallets,
      blacklistedWallets,
      protectionStrategies
    };

    // Execute protected launch
    return await this.protector.protectLaunch(launchConfig, transactions, this.botKeypair);
  }

  /**
   * Example: Create a simple token launch transaction
   */
  createExampleLaunchTransactions(): Transaction[] {
    const transactions: Transaction[] = [];

    // Example: Create multiple buy transactions that would be bundled together
    for (let i = 0; i < 3; i++) {
      const tx = new Transaction().add(
        // This is a placeholder - in reality you'd add actual DEX swap instructions
        SystemProgram.transfer({
          fromPubkey: this.botKeypair.publicKey,
          toPubkey: config.developerWallet,
          lamports: Math.floor(0.01 * LAMPORTS_PER_SOL) // 0.01 SOL
        })
      );
      
      transactions.push(tx);
    }

    return transactions;
  }

  /**
   * Demonstrate protection capabilities
   */
  async demonstrateProtection(): Promise<void> {
    log.info('🎯 Demonstrating protection capabilities...');

    try {
      // Create example launch transactions
      const transactions = this.createExampleLaunchTransactions();
      
      // Protect the launch
      const result = await this.protectTokenLaunch(transactions, {
        maxBuyPerWallet: 1.0,
        bundleSize: 3
      });

      if (result.status === 'landed') {
        log.success('🎉 Protected launch demonstration completed successfully!', {
          bundleId: result.bundleId,
          slot: result.landedSlot,
          transactionCount: result.transactions.length
        });
      } else {
        log.error('❌ Protected launch demonstration failed', undefined, {
          bundleId: result.bundleId,
          status: result.status,
          error: result.error
        });
      }

      // Show protection statistics
      const stats = await this.protector.getProtectionStats();
      log.info('📊 Protection Statistics', stats);

    } catch (error) {
      log.error('Failed to demonstrate protection', error);
    }
  }

  private async validateSetup(): Promise<void> {
    log.info('Validating bot setup...');

    // Check bot wallet balance
    const balance = await this.protector['connection'].getBalance(this.botKeypair.publicKey);
    const balanceSOL = balance / LAMPORTS_PER_SOL;
    
    if (balanceSOL < 0.1) {
      throw new Error(`Insufficient SOL balance: ${balanceSOL} SOL. Minimum required: 0.1 SOL`);
    }

    log.info(`Bot wallet balance: ${balanceSOL} SOL`);

    // Check Jito connection
    const jitoHealth = this.protector['jitoClient'].isHealthy();
    if (!jitoHealth) {
      log.warn('Jito client health check failed - some features may not work optimally');
    }

    log.success('Setup validation completed');
  }

  private startBackgroundTasks(): void {
    // Cleanup task - runs every hour
    cron.schedule('0 * * * *', () => {
      if (this.isRunning) {
        log.debug('Running periodic cleanup');
        this.protector.cleanup();
      }
    });

    // Stats reporting - runs every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
      if (this.isRunning) {
        try {
          const stats = await this.protector.getProtectionStats();
          log.info('📊 Periodic Stats Report', stats);
        } catch (error) {
          log.error('Failed to get protection stats', error);
        }
      }
    });

    log.info('Background tasks scheduled');
  }

  private handleGracefulShutdown(): void {
    const shutdown = async () => {
      log.info('Received shutdown signal');
      await this.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('SIGUSR2', shutdown); // For nodemon
  }

  async getStats(): Promise<any> {
    return await this.protector.getProtectionStats();
  }
}

// Main execution
async function main() {
  try {
    const bot = new SolanaBundlerBot();
    
    // Start the bot
    await bot.start();
    
    // Run demonstration
    await bot.demonstrateProtection();
    
    // Keep running (the bot will handle shutdown signals)
    log.info('🤖 Bot is now running. Press Ctrl+C to stop.');
    
  } catch (error) {
    log.error('Fatal error in main execution', error);
    process.exit(1);
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Solana Bundler Bot - Protect Token Launches from Snipers

Usage:
  npm start                    # Start the bot with demonstration
  npm run dev                  # Start in development mode
  npm run build && npm start   # Build and start production version

Features:
  🛡️  Anti-sniper protection using advanced wallet analysis
  🔗  Jito bundle integration for MEV protection  
  🚫  Sandwich attack prevention with jitodontfront
  ⚡  Optimized transaction execution and ordering
  📊  Real-time monitoring and statistics
  🎯  Configurable protection strategies

Environment Variables:
  See .env.example for all configuration options

Examples:
  # Protect a token launch with custom settings
  const result = await bot.protectTokenLaunch(transactions, {
    maxBuyPerWallet: 2.0,
    bundleSize: 5,
    whitelistedWallets: [new PublicKey('...')],
  });

For more information, visit: https://docs.jito.wtf/
    `);
    process.exit(0);
  }
  
  if (args.includes('--demo')) {
    // Run demo mode only
    (async () => {
      const bot = new SolanaBundlerBot();
      await bot.demonstrateProtection();
      process.exit(0);
    })();
  } else {
    // Run normal mode
    main();
  }
}

export { SolanaBundlerBot };
export default SolanaBundlerBot;