import { Connection, PublicKey, ParsedAccountData, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { SniperDetection, BotConfig } from '../types';
import { log } from '../utils/logger';

export class SniperDetector {
  private connection: Connection;
  private config: BotConfig;
  private suspiciousWallets: Map<string, { score: number; lastSeen: number; reasons: string[] }> = new Map();
  private knownBots: Set<string> = new Set();

  constructor(config: BotConfig) {
    this.config = config;
    this.connection = new Connection(config.solanaRpcUrl, 'confirmed');
    this.initializeKnownBots();
  }

  private initializeKnownBots(): void {
    // Known MEV bot patterns and addresses
    const knownBotAddresses = [
      // Add known MEV bot addresses here
      // These would be dynamically updated in a production system
    ];
    
    knownBotAddresses.forEach(address => this.knownBots.add(address));
  }

  async analyzePotentialSniper(wallet: PublicKey): Promise<SniperDetection> {
    const walletString = wallet.toString();
    let confidence = 0;
    const reasons: string[] = [];
    const suspiciousPatterns: string[] = [];

    try {
      // Check if wallet is in known bots list
      if (this.knownBots.has(walletString)) {
        confidence += 50;
        reasons.push('Known MEV bot address');
        suspiciousPatterns.push('KNOWN_BOT');
      }

      // Get wallet age and transaction history
      const walletInfo = await this.getWalletInfo(wallet);
      
      // Check wallet age (new wallets are suspicious)
      if (walletInfo.age < 24) { // Less than 24 hours old
        confidence += 30;
        reasons.push('Very new wallet (less than 24 hours)');
        suspiciousPatterns.push('NEW_WALLET');
      } else if (walletInfo.age < 168) { // Less than 1 week old
        confidence += 15;
        reasons.push('New wallet (less than 1 week)');
        suspiciousPatterns.push('RECENT_WALLET');
      }

      // Check transaction frequency
      const recentTxCount = await this.getRecentTransactionCount(wallet, 3600); // Last hour
      if (recentTxCount > 50) {
        confidence += 25;
        reasons.push(`High transaction frequency: ${recentTxCount} txs in last hour`);
        suspiciousPatterns.push('HIGH_FREQUENCY');
      }

      // Check for programmatic patterns
      const programmingPatterns = await this.checkProgrammaticPatterns(wallet);
      if (programmingPatterns.score > 0) {
        confidence += programmingPatterns.score;
        reasons.push(...programmingPatterns.reasons);
        suspiciousPatterns.push(...programmingPatterns.patterns);
      }

      // Check for MEV-like behavior
      const mevBehavior = await this.checkMEVBehavior(wallet);
      if (mevBehavior.score > 0) {
        confidence += mevBehavior.score;
        reasons.push(...mevBehavior.reasons);
        suspiciousPatterns.push(...mevBehavior.patterns);
      }

      // Check wallet balance patterns
      const balancePatterns = await this.checkBalancePatterns(wallet);
      if (balancePatterns.score > 0) {
        confidence += balancePatterns.score;
        reasons.push(...balancePatterns.reasons);
        suspiciousPatterns.push(...balancePatterns.patterns);
      }

      // Cap confidence at 100
      confidence = Math.min(confidence, 100);

      const isSniper = confidence >= 70; // Threshold for considering a wallet a sniper

      // Cache result for future reference
      this.suspiciousWallets.set(walletString, {
        score: confidence,
        lastSeen: Date.now(),
        reasons
      });

      if (isSniper) {
        log.sniper(`Detected sniper wallet with ${confidence}% confidence`, walletString, {
          reasons,
          patterns: suspiciousPatterns
        });
      }

      return {
        isSniper,
        confidence,
        reasons,
        walletAge: walletInfo.age,
        transactionHistory: walletInfo.txCount,
        suspiciousPatterns
      };

    } catch (error) {
      log.error('Error analyzing potential sniper', error, { wallet: walletString });
      
      // Return safe default on error
      return {
        isSniper: false,
        confidence: 0,
        reasons: ['Analysis failed'],
        walletAge: 0,
        transactionHistory: 0,
        suspiciousPatterns: []
      };
    }
  }

  private async getWalletInfo(wallet: PublicKey): Promise<{ age: number; txCount: number }> {
    try {
      // Get recent transactions to determine wallet age
      const signatures = await this.connection.getSignaturesForAddress(wallet, { limit: 1000 });
      
      if (signatures.length === 0) {
        return { age: 0, txCount: 0 };
      }

      // Calculate age based on oldest transaction
      const oldestTx = signatures[signatures.length - 1];
      const oldestTimestamp = oldestTx.blockTime || 0;
      const age = oldestTimestamp > 0 ? (Date.now() / 1000 - oldestTimestamp) / 3600 : 0; // Age in hours

      return {
        age,
        txCount: signatures.length
      };
    } catch (error) {
      log.error('Failed to get wallet info', error);
      return { age: 0, txCount: 0 };
    }
  }

  private async getRecentTransactionCount(wallet: PublicKey, timeframeSec: number): Promise<number> {
    try {
      const cutoffTime = Math.floor(Date.now() / 1000) - timeframeSec;
      const signatures = await this.connection.getSignaturesForAddress(wallet, { limit: 1000 });
      
      return signatures.filter(sig => (sig.blockTime || 0) > cutoffTime).length;
    } catch (error) {
      return 0;
    }
  }

  private async checkProgrammaticPatterns(wallet: PublicKey): Promise<{ score: number; reasons: string[]; patterns: string[] }> {
    let score = 0;
    const reasons: string[] = [];
    const patterns: string[] = [];

    try {
      const signatures = await this.connection.getSignaturesForAddress(wallet, { limit: 100 });
      
      if (signatures.length < 10) {
        return { score, reasons, patterns };
      }

      // Check for consistent timing patterns (programmatic)
      const intervals: number[] = [];
      for (let i = 1; i < signatures.length; i++) {
        if (signatures[i-1].blockTime && signatures[i].blockTime) {
          intervals.push(signatures[i-1].blockTime! - signatures[i].blockTime!);
        }
      }

      if (intervals.length > 5) {
        // Check for suspiciously regular intervals
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((acc, interval) => acc + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);
        
        // Low variance indicates programmatic behavior
        if (stdDev < avgInterval * 0.1 && avgInterval < 60) { // Very consistent timing within 1 minute
          score += 20;
          reasons.push('Suspiciously regular transaction timing');
          patterns.push('REGULAR_TIMING');
        }
      }

      // Check for high success rate (bots are more efficient)
      const successRate = signatures.filter(sig => !sig.err).length / signatures.length;
      if (successRate > 0.95 && signatures.length > 20) {
        score += 15;
        reasons.push(`Unusually high success rate: ${(successRate * 100).toFixed(1)}%`);
        patterns.push('HIGH_SUCCESS_RATE');
      }

    } catch (error) {
      log.debug('Error checking programmatic patterns', { error });
    }

    return { score, reasons, patterns };
  }

  private async checkMEVBehavior(wallet: PublicKey): Promise<{ score: number; reasons: string[]; patterns: string[] }> {
    let score = 0;
    const reasons: string[] = [];
    const patterns: string[] = [];

    try {
      const signatures = await this.connection.getSignaturesForAddress(wallet, { limit: 50 });
      
      // Look for rapid sequences of transactions (potential sandwich attacks)
      let rapidSequences = 0;
      for (let i = 1; i < signatures.length - 1; i++) {
        const current = signatures[i].blockTime || 0;
        const next = signatures[i + 1].blockTime || 0;
        const prev = signatures[i - 1].blockTime || 0;
        
        // Check if transactions are within a few seconds of each other
        if (prev - current < 10 && current - next < 10) {
          rapidSequences++;
        }
      }

      if (rapidSequences > 3) {
        score += 25;
        reasons.push(`Multiple rapid transaction sequences detected: ${rapidSequences}`);
        patterns.push('RAPID_SEQUENCES');
      }

      // Check for interactions with DEXes only (no other DeFi activity)
      // This would require parsing transaction details which is more complex
      // For now, we'll check if most transactions are swaps

    } catch (error) {
      log.debug('Error checking MEV behavior', { error });
    }

    return { score, reasons, patterns };
  }

  private async checkBalancePatterns(wallet: PublicKey): Promise<{ score: number; reasons: string[]; patterns: string[] }> {
    let score = 0;
    const reasons: string[] = [];
    const patterns: string[] = [];

    try {
      const balance = await this.connection.getBalance(wallet);
      const balanceSOL = balance / LAMPORTS_PER_SOL;

      // Check for suspiciously precise amounts (often indicates funded bots)
      if (this.isPreciseAmount(balanceSOL)) {
        score += 10;
        reasons.push(`Suspiciously precise balance: ${balanceSOL} SOL`);
        patterns.push('PRECISE_BALANCE');
      }

      // Check for minimum viable balance (just enough for gas)
      if (balanceSOL > 0 && balanceSOL < 0.1) {
        score += 15;
        reasons.push('Very low balance suggesting automated funding');
        patterns.push('LOW_BALANCE');
      }

    } catch (error) {
      log.debug('Error checking balance patterns', { error });
    }

    return { score, reasons, patterns };
  }

  private isPreciseAmount(amount: number): boolean {
    // Check if amount is suspiciously round (like exactly 1.0, 0.5, etc.)
    const rounded = Math.round(amount * 1000) / 1000;
    const diff = Math.abs(amount - rounded);
    
    // Also check for amounts like 0.001, 0.01, etc.
    const preciseAmounts = [0.001, 0.01, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0];
    return preciseAmounts.some(precise => Math.abs(amount - precise) < 0.0001) || diff < 0.0001;
  }

  async blacklistWallet(wallet: PublicKey, reason: string): Promise<void> {
    const walletString = wallet.toString();
    this.knownBots.add(walletString);
    
    log.sniper(`Blacklisted wallet`, walletString, { reason });
  }

  async whitelistWallet(wallet: PublicKey, reason: string): Promise<void> {
    const walletString = wallet.toString();
    this.knownBots.delete(walletString);
    this.suspiciousWallets.delete(walletString);
    
    log.info(`Whitelisted wallet`, { wallet: walletString, reason });
  }

  isBlacklisted(wallet: PublicKey): boolean {
    return this.knownBots.has(wallet.toString());
  }

  getCachedAnalysis(wallet: PublicKey): SniperDetection | null {
    const cached = this.suspiciousWallets.get(wallet.toString());
    if (!cached) return null;

    // Return cached result if less than 5 minutes old
    if (Date.now() - cached.lastSeen < 300000) {
      return {
        isSniper: cached.score >= 70,
        confidence: cached.score,
        reasons: cached.reasons,
        walletAge: 0, // We don't cache this
        transactionHistory: 0, // We don't cache this
        suspiciousPatterns: [] // We don't cache this
      };
    }

    return null;
  }

  getStats(): { totalAnalyzed: number; sniperDetected: number; blacklisted: number } {
    const sniperDetected = Array.from(this.suspiciousWallets.values()).filter(w => w.score >= 70).length;
    
    return {
      totalAnalyzed: this.suspiciousWallets.size,
      sniperDetected,
      blacklisted: this.knownBots.size
    };
  }

  // Cleanup old entries to prevent memory leaks
  cleanup(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [wallet, data] of this.suspiciousWallets.entries()) {
      if (data.lastSeen < cutoff) {
        this.suspiciousWallets.delete(wallet);
      }
    }
  }
}