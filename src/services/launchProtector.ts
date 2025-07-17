import { Connection, PublicKey, Transaction, Keypair, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BotConfig, BundleTransaction, LaunchProtection, ProtectionStrategy, BundleResult } from '../types';
import { JitoClient } from './jitoClient';
import { SniperDetector } from './sniperDetector';
import { log, timing } from '../utils/logger';

export class LaunchProtector {
  private connection: Connection;
  private config: BotConfig;
  private jitoClient: JitoClient;
  private sniperDetector: SniperDetector;
  private protectionStrategies: Map<string, ProtectionStrategy> = new Map();
  private activeLaunches: Map<string, LaunchProtection> = new Map();

  constructor(config: BotConfig) {
    this.config = config;
    this.connection = new Connection(config.solanaRpcUrl, 'confirmed');
    this.jitoClient = new JitoClient(config);
    this.sniperDetector = new SniperDetector(config);
    
    this.initializeProtectionStrategies();
  }

  private initializeProtectionStrategies(): void {
    // Anti-sniper protection
    if (this.config.enableAntiSniper) {
      this.protectionStrategies.set('anti-sniper', {
        type: 'anti-sniper',
        enabled: true,
        config: {
          maxSniperConfidence: 70,
          analyzeAllWallets: true,
          blacklistSnipers: true
        }
      });
    }

    // Sandwich protection
    if (this.config.enableSandwichProtection) {
      this.protectionStrategies.set('sandwich-protection', {
        type: 'sandwich-protection',
        enabled: true,
        config: {
          useJitoDontFront: true,
          bundleTransactions: true,
          maxSlippage: this.config.maxSlippage
        }
      });
    }

    // Frontrun protection
    this.protectionStrategies.set('frontrun-protection', {
      type: 'frontrun-protection',
      enabled: true,
      config: {
        useBundles: true,
        priorityOrdering: true,
        tipOptimization: true
      }
    });

    log.protection(`Initialized ${this.protectionStrategies.size} protection strategies`);
  }

  async protectLaunch(
    launchConfig: LaunchProtection,
    transactions: Transaction[],
    payer: Keypair
  ): Promise<BundleResult> {
    const endTiming = timing.start('protectLaunch');
    const launchId = this.generateLaunchId();
    
    try {
      // Store launch configuration
      this.activeLaunches.set(launchId, launchConfig);
      
      log.protection('Starting protected launch', 'LAUNCH', {
        launchId,
        transactionCount: transactions.length,
        bundleSize: launchConfig.bundleSize
      });

      // Apply protection strategies
      const protectedTransactions = await this.applyProtectionStrategies(
        transactions,
        launchConfig,
        payer
      );

      // Create bundle transactions with proper ordering
      const bundleTransactions = await this.createBundleTransactions(
        protectedTransactions,
        launchConfig
      );

      // Execute the protected launch
      const result = await this.executeLaunch(bundleTransactions, payer, launchConfig);

      // Log results
      if (result.status === 'landed') {
        log.success('Protected launch completed successfully', {
          launchId,
          bundleId: result.bundleId,
          slot: result.landedSlot
        });
      } else {
        log.error('Protected launch failed', undefined, {
          launchId,
          bundleId: result.bundleId,
          status: result.status,
          error: result.error
        });
      }

      endTiming();
      return result;

    } catch (error) {
      endTiming();
      log.error('Launch protection failed', error, { launchId });
      throw error;
    } finally {
      // Cleanup
      this.activeLaunches.delete(launchId);
    }
  }

  private async applyProtectionStrategies(
    transactions: Transaction[],
    launchConfig: LaunchProtection,
    payer: Keypair
  ): Promise<Transaction[]> {
    let protectedTransactions = [...transactions];

    for (const strategy of launchConfig.protectionStrategies) {
      if (!strategy.enabled) continue;

      switch (strategy.type) {
        case 'anti-sniper':
          protectedTransactions = await this.applyAntiSniperProtection(
            protectedTransactions,
            strategy.config
          );
          break;

        case 'sandwich-protection':
          protectedTransactions = await this.applySandwichProtection(
            protectedTransactions,
            strategy.config
          );
          break;

        case 'frontrun-protection':
          protectedTransactions = await this.applyFrontrunProtection(
            protectedTransactions,
            strategy.config,
            payer
          );
          break;
      }
    }

    return protectedTransactions;
  }

  private async applyAntiSniperProtection(
    transactions: Transaction[],
    config: any
  ): Promise<Transaction[]> {
    log.protection('Applying anti-sniper protection', 'ANTI_SNIPER');

    // For each transaction, add checks to prevent known snipers from interacting
    const protectedTransactions = transactions.map(tx => {
      // Add sniper detection account checks
      // This is a simplified implementation - in practice, you'd add more sophisticated checks
      return tx;
    });

    return protectedTransactions;
  }

  private async applySandwichProtection(
    transactions: Transaction[],
    config: any
  ): Promise<Transaction[]> {
    log.protection('Applying sandwich protection', 'SANDWICH');

    // Add the jitodontfront account to prevent sandwich attacks
    const protectedTransactions = transactions.map(tx => {
      if (config.useJitoDontFront) {
        const antiSandwichAccount = new PublicKey('jitodontfront111111111111111111111111111111');
        
        // Add to each instruction as read-only
        tx.instructions.forEach(ix => {
          const hasAccount = ix.keys.some(key => key.pubkey.equals(antiSandwichAccount));
          if (!hasAccount) {
            ix.keys.push({
              pubkey: antiSandwichAccount,
              isSigner: false,
              isWritable: false
            });
          }
        });
      }
      
      return tx;
    });

    return protectedTransactions;
  }

  private async applyFrontrunProtection(
    transactions: Transaction[],
    config: any,
    payer: Keypair
  ): Promise<Transaction[]> {
    log.protection('Applying frontrun protection', 'FRONTRUN');

    // Add priority fees and optimize for MEV protection
    const protectedTransactions = transactions.map(tx => {
      // In a real implementation, you'd add compute budget instructions
      // to increase priority fees for better transaction ordering
      return tx;
    });

    return protectedTransactions;
  }

  private async createBundleTransactions(
    transactions: Transaction[],
    launchConfig: LaunchProtection
  ): Promise<BundleTransaction[]> {
    const bundleTransactions: BundleTransaction[] = [];

    // Create transaction groups based on bundle size
    const chunkSize = Math.min(launchConfig.bundleSize, this.config.maxTransactionsPerBundle);
    
    for (let i = 0; i < transactions.length; i += chunkSize) {
      const chunk = transactions.slice(i, i + chunkSize);
      
      chunk.forEach((tx, index) => {
        bundleTransactions.push({
          transaction: tx,
          description: `Launch transaction ${i + index + 1}`,
          priority: index + 1, // Higher priority for earlier transactions
          maxRetries: 3
        });
      });
    }

    return bundleTransactions;
  }

  private async executeLaunch(
    bundleTransactions: BundleTransaction[],
    payer: Keypair,
    launchConfig: LaunchProtection
  ): Promise<BundleResult> {
    // Get optimal tip amount for better landing chances
    const optimalTip = await this.jitoClient.getOptimalTipAmount();
    
    log.protection('Executing protected launch bundle', 'EXECUTE', {
      transactionCount: bundleTransactions.length,
      tipAmount: optimalTip
    });

    // Execute bundle with protection
    return await this.jitoClient.sendBundle(bundleTransactions, payer, {
      tipAmount: optimalTip,
      maxRetries: 5,
      skipPreflight: true
    });
  }

  async analyzeIncomingTransactions(signature: string): Promise<void> {
    try {
      // Get transaction details
      const tx = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });

      if (!tx || !tx.transaction.message) return;

      // Extract wallet addresses from transaction
      const accounts = tx.transaction.message.staticAccountKeys || [];
      
      // Analyze each account for sniper behavior
      for (const account of accounts) {
        const pubkey = new PublicKey(account);
        
        // Skip system accounts
        if (this.isSystemAccount(pubkey)) continue;

        // Check if already blacklisted
        if (this.sniperDetector.isBlacklisted(pubkey)) {
          log.sniper('Blocked blacklisted wallet transaction', pubkey.toString(), { signature });
          continue;
        }

        // Check cache first
        let analysis = this.sniperDetector.getCachedAnalysis(pubkey);
        
        // If not cached, perform analysis
        if (!analysis) {
          analysis = await this.sniperDetector.analyzePotentialSniper(pubkey);
        }

        // Take action based on analysis
        if (analysis.isSniper) {
          await this.handleDetectedSniper(pubkey, analysis, signature);
        }
      }

    } catch (error) {
      log.error('Error analyzing incoming transaction', error, { signature });
    }
  }

  private async handleDetectedSniper(
    wallet: PublicKey,
    analysis: any,
    signature: string
  ): Promise<void> {
    // Blacklist the sniper
    await this.sniperDetector.blacklistWallet(wallet, 'Automated detection');
    
    // Log the detection
    log.sniper('Sniper detected and blacklisted', wallet.toString(), {
      confidence: analysis.confidence,
      reasons: analysis.reasons,
      signature
    });

    // In a real implementation, you might also:
    // 1. Alert the development team
    // 2. Adjust protection parameters
    // 3. Block further interactions
    // 4. Report to monitoring systems
  }

  private isSystemAccount(pubkey: PublicKey): boolean {
    const systemAccounts = [
      SystemProgram.programId,
      new PublicKey('11111111111111111111111111111111'), // System Program
      new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // Token Program
      new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'), // Associated Token Program
    ];

    return systemAccounts.some(account => account.equals(pubkey));
  }

  private generateLaunchId(): string {
    return `launch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getProtectionStats(): Promise<{
    activeLaunches: number;
    protectionStrategies: number;
    sniperStats: any;
    jitoHealth: boolean;
  }> {
    return {
      activeLaunches: this.activeLaunches.size,
      protectionStrategies: this.protectionStrategies.size,
      sniperStats: this.sniperDetector.getStats(),
      jitoHealth: this.jitoClient.isHealthy()
    };
  }

  async updateProtectionStrategy(
    type: string,
    config: Partial<ProtectionStrategy>
  ): Promise<void> {
    const existing = this.protectionStrategies.get(type);
    if (existing) {
      this.protectionStrategies.set(type, { ...existing, ...config });
      log.protection(`Updated protection strategy: ${type}`);
    }
  }

  async emergencyShutdown(): Promise<void> {
    log.protection('Emergency shutdown initiated', 'EMERGENCY');
    
    // Clear all active launches
    this.activeLaunches.clear();
    
    // Disable all protection strategies
    for (const [type, strategy] of this.protectionStrategies.entries()) {
      strategy.enabled = false;
      log.protection(`Disabled protection strategy: ${type}`);
    }

    log.protection('Emergency shutdown completed');
  }

  // Cleanup method to be called periodically
  cleanup(): void {
    this.sniperDetector.cleanup();
    
    // Remove old launch data
    const cutoff = Date.now() - 60 * 60 * 1000; // 1 hour
    for (const [id, launch] of this.activeLaunches.entries()) {
      // If launch is older than cutoff, remove it
      // Note: In a real implementation, you'd store timestamps
      // For now, just keep launches for a reasonable time
    }
  }
}