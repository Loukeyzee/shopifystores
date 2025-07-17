import { PublicKey, Transaction, Keypair } from '@solana/web3.js';

export interface BotConfig {
  solanaRpcUrl: string;
  solanaWsUrl: string;
  jitoBlockEngineUrl: string;
  jitoAuthKeypair: Keypair;
  jitoTipAmount: number;
  jitoRegion: string;
  botPrivateKey: string;
  developerWallet: PublicKey;
  maxBuyAmount: number;
  minLiquiditySol: number;
  maxSlippage: number;
  enableAntiSniper: boolean;
  enableSandwichProtection: boolean;
  maxTransactionsPerBundle: number;
  bundleTimeoutMs: number;
  logLevel: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  raydiumProgramId: PublicKey;
  raydiumAmmProgramId: PublicKey;
  maxRequestsPerSecond: number;
  cooldownPeriodMs: number;
}

export interface PoolInfo {
  id: PublicKey;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  lpMint: PublicKey;
  baseDecimals: number;
  quoteDecimals: number;
  lpDecimals: number;
  version: number;
  programId: PublicKey;
  authority: PublicKey;
  openOrders: PublicKey;
  targetOrders: PublicKey;
  baseVault: PublicKey;
  quoteVault: PublicKey;
  withdrawQueue: PublicKey;
  lpVault: PublicKey;
  marketVersion: number;
  marketProgramId: PublicKey;
  marketId: PublicKey;
  marketAuthority: PublicKey;
  marketBaseVault: PublicKey;
  marketQuoteVault: PublicKey;
  marketBids: PublicKey;
  marketAsks: PublicKey;
  marketEventQueue: PublicKey;
}

export interface SwapInfo {
  amountIn: number;
  amountOut: number;
  slippage: number;
  priceImpact: number;
  route: string[];
}

export interface BundleTransaction {
  transaction: Transaction;
  description: string;
  priority: number;
  maxRetries: number;
}

export interface BundleResult {
  bundleId: string;
  status: 'pending' | 'landed' | 'failed' | 'invalid';
  landedSlot?: number;
  transactions: string[];
  error?: string;
}

export interface TokenInfo {
  mint: PublicKey;
  decimals: number;
  supply: number;
  symbol?: string;
  name?: string;
  logoURI?: string;
}

export interface LiquidityInfo {
  baseReserve: number;
  quoteReserve: number;
  lpSupply: number;
  price: number;
}

export interface SniperDetection {
  isSniper: boolean;
  confidence: number;
  reasons: string[];
  walletAge: number;
  transactionHistory: number;
  suspiciousPatterns: string[];
}

export interface ProtectionStrategy {
  type: 'anti-sniper' | 'sandwich-protection' | 'frontrun-protection';
  enabled: boolean;
  config: Record<string, any>;
}

export interface LaunchProtection {
  bundleSize: number;
  delayBetweenTransactions: number;
  maxBuyPerWallet: number;
  whitelistedWallets: PublicKey[];
  blacklistedWallets: PublicKey[];
  protectionStrategies: ProtectionStrategy[];
}

export interface MonitoringAlert {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: number;
  data?: Record<string, any>;
}

export interface BundlerStats {
  totalBundles: number;
  successfulBundles: number;
  failedBundles: number;
  totalVolume: number;
  averageExecutionTime: number;
  sniperBlocked: number;
  sandwichAttacksPrevented: number;
}