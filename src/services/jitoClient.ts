import { Connection, PublicKey, Transaction, VersionedTransaction, Keypair, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';
import axios from 'axios';
import bs58 from 'bs58';
import { BotConfig, BundleTransaction, BundleResult } from '../types';
import { log, timing } from '../utils/logger';

export class JitoClient {
  private connection: Connection;
  private config: BotConfig;
  private tipAccounts: PublicKey[] = [];
  private lastTipAccountUpdate = 0;

  constructor(config: BotConfig) {
    this.config = config;
    this.connection = new Connection(config.solanaRpcUrl, 'confirmed');
    this.initializeTipAccounts();
  }

  private async initializeTipAccounts(): Promise<void> {
    try {
      const response = await axios.post(`${this.config.jitoBlockEngineUrl}/api/v1/getTipAccounts`, {
        jsonrpc: '2.0',
        id: 1,
        method: 'getTipAccounts',
        params: []
      });

      if (response.data.result) {
        this.tipAccounts = response.data.result.map((account: string) => new PublicKey(account));
        log.jito(`Loaded ${this.tipAccounts.length} tip accounts`);
        this.lastTipAccountUpdate = Date.now();
      }
    } catch (error) {
      log.error('Failed to fetch tip accounts', error);
      // Fallback to known tip accounts
      this.tipAccounts = [
        new PublicKey('96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5'),
        new PublicKey('HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe'),
        new PublicKey('Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY'),
        new PublicKey('ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49'),
      ];
    }
  }

  private getRandomTipAccount(): PublicKey {
    if (this.tipAccounts.length === 0) {
      throw new Error('No tip accounts available');
    }
    return this.tipAccounts[Math.floor(Math.random() * this.tipAccounts.length)];
  }

  private createTipTransaction(payer: Keypair, tipAmount: number): Transaction {
    const tipAccount = this.getRandomTipAccount();
    const lamports = Math.floor(tipAmount * LAMPORTS_PER_SOL);
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: tipAccount,
        lamports
      })
    );

    return transaction;
  }

  async sendBundle(
    transactions: BundleTransaction[],
    payer: Keypair,
    options: {
      tipAmount?: number;
      maxRetries?: number;
      skipPreflight?: boolean;
    } = {}
  ): Promise<BundleResult> {
    const endTiming = timing.start('sendBundle');
    
    try {
      const {
        tipAmount = this.config.jitoTipAmount,
        maxRetries = 3,
        skipPreflight = true
      } = options;

      // Add anti-frontrun protection to transactions
      const protectedTransactions = await this.addAntiSnipeProtection(transactions);

      // Create tip transaction
      const tipTransaction = this.createTipTransaction(payer, tipAmount);
      
      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
      
      // Prepare all transactions
      const allTransactions = [...protectedTransactions.map(bt => bt.transaction), tipTransaction];
      
      // Set recent blockhash and sign transactions
      for (const tx of allTransactions) {
        tx.recentBlockhash = blockhash;
        tx.feePayer = payer.publicKey;
        tx.sign(payer);
      }

      // Convert to base64 for Jito API
      const serializedTransactions = allTransactions.map(tx => 
        Buffer.from(tx.serialize({ verifySignatures: false })).toString('base64')
      );

      // Send bundle to Jito
      const bundleId = await this.submitBundle(serializedTransactions);
      
      log.bundle('Bundle submitted successfully', bundleId, {
        transactionCount: serializedTransactions.length,
        tipAmount,
        bundleId
      });

      // Monitor bundle status
      const result = await this.monitorBundle(bundleId);
      
      endTiming();
      return result;

    } catch (error) {
      endTiming();
      log.error('Failed to send bundle', error);
      throw error;
    }
  }

  private async addAntiSnipeProtection(transactions: BundleTransaction[]): Promise<BundleTransaction[]> {
    if (!this.config.enableAntiSniper) {
      return transactions;
    }

    // Add jitodontfront account to each transaction for sandwich protection
    const protectedTransactions = transactions.map(bundleTx => {
      const tx = bundleTx.transaction;
      
      // Add the anti-frontrun account as a read-only account
      const antiSnipeAccount = new PublicKey('jitodontfront111111111111111111111111111111');
      
      // Check if account is already in the transaction
      const hasAntiSnipeAccount = tx.instructions.some(ix => 
        ix.keys.some(key => key.pubkey.equals(antiSnipeAccount))
      );

      if (!hasAntiSnipeAccount && tx.instructions.length > 0) {
        // Add as read-only to the first instruction
        tx.instructions[0].keys.push({
          pubkey: antiSnipeAccount,
          isSigner: false,
          isWritable: false
        });
      }

      return bundleTx;
    });

    log.protection('Added anti-snipe protection to transactions');
    return protectedTransactions;
  }

  private async submitBundle(serializedTransactions: string[]): Promise<string> {
    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'sendBundle',
      params: [
        serializedTransactions,
        {
          encoding: 'base64'
        }
      ]
    };

    const response = await axios.post(`${this.config.jitoBlockEngineUrl}/api/v1/bundles`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: this.config.bundleTimeoutMs
    });

    if (response.data.error) {
      throw new Error(`Jito API error: ${response.data.error.message}`);
    }

    return response.data.result;
  }

  private async monitorBundle(bundleId: string, maxAttempts = 30): Promise<BundleResult> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const status = await this.getBundleStatus(bundleId);
        
        if (status.status === 'landed') {
          log.bundle('Bundle landed successfully', bundleId, { 
            slot: status.landedSlot,
            attempts: attempts + 1 
          });
          return status;
        }
        
        if (status.status === 'failed' || status.status === 'invalid') {
          log.bundle('Bundle failed', bundleId, { 
            status: status.status,
            error: status.error,
            attempts: attempts + 1 
          });
          return status;
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        
      } catch (error) {
        log.error('Error monitoring bundle', error, { bundleId, attempts });
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Timeout
    log.bundle('Bundle monitoring timeout', bundleId, { maxAttempts });
    return {
      bundleId,
      status: 'failed',
      transactions: [],
      error: 'Monitoring timeout'
    };
  }

  private async getBundleStatus(bundleId: string): Promise<BundleResult> {
    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'getBundleStatuses',
      params: [[bundleId]]
    };

    const response = await axios.post(`${this.config.jitoBlockEngineUrl}/api/v1/getBundleStatuses`, payload, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.data.error) {
      throw new Error(`Jito API error: ${response.data.error.message}`);
    }

    const result = response.data.result.value[0];
    
    if (!result) {
      return {
        bundleId,
        status: 'pending',
        transactions: []
      };
    }

    return {
      bundleId: result.bundle_id,
      status: result.confirmation_status === 'finalized' ? 'landed' : 'pending',
      landedSlot: result.slot,
      transactions: result.transactions || [],
      error: result.err ? JSON.stringify(result.err) : undefined
    };
  }

  async sendTransaction(
    transaction: Transaction,
    payer: Keypair,
    options: {
      tipAmount?: number;
      skipPreflight?: boolean;
      bundleOnly?: boolean;
    } = {}
  ): Promise<string> {
    const {
      tipAmount = this.config.jitoTipAmount,
      skipPreflight = true,
      bundleOnly = false
    } = options;

    // For single transactions, we can use Jito's sendTransaction endpoint
    // or wrap it in a bundle for MEV protection
    if (bundleOnly) {
      const bundleResult = await this.sendBundle([{
        transaction,
        description: 'Single transaction bundle',
        priority: 1,
        maxRetries: 3
      }], payer, { tipAmount, skipPreflight });
      
      if (bundleResult.status === 'landed' && bundleResult.transactions.length > 0) {
        return bundleResult.transactions[0];
      } else {
        throw new Error('Transaction failed to land in bundle');
      }
    }

    // Use Jito's direct transaction endpoint
    const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payer.publicKey;
    transaction.sign(payer);

    const serializedTx = Buffer.from(transaction.serialize({ verifySignatures: false })).toString('base64');

    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'sendTransaction',
      params: [
        serializedTx,
        {
          encoding: 'base64',
          skipPreflight
        }
      ]
    };

    const response = await axios.post(`${this.config.jitoBlockEngineUrl}/api/v1/transactions`, payload, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.data.error) {
      throw new Error(`Jito transaction error: ${response.data.error.message}`);
    }

    log.transaction('Transaction sent via Jito', response.data.result);
    return response.data.result;
  }

  async getTipFloorPrice(): Promise<number> {
    try {
      const response = await axios.get('https://bundles.jito.wtf/api/v1/bundles/tip_floor');
      const data = response.data[0];
      
      if (data && data.landed_tips_50th_percentile) {
        return data.landed_tips_50th_percentile;
      }
    } catch (error) {
      log.error('Failed to fetch tip floor price', error);
    }
    
    return this.config.jitoTipAmount;
  }

  async getOptimalTipAmount(): Promise<number> {
    const floorPrice = await this.getTipFloorPrice();
    const multiplier = 1.5; // 50% above floor price for better landing chances
    
    return Math.max(floorPrice * multiplier, this.config.jitoTipAmount);
  }

  isHealthy(): boolean {
    // Check if tip accounts are recent and available
    const isRecentUpdate = Date.now() - this.lastTipAccountUpdate < 300000; // 5 minutes
    return this.tipAccounts.length > 0 && isRecentUpdate;
  }
}