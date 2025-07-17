import dotenv from 'dotenv';
import { PublicKey, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { BotConfig } from '../types';

dotenv.config();

export const createConfig = (): BotConfig => {
  const requiredEnvVars = [
    'SOLANA_RPC_URL',
    'JITO_BLOCK_ENGINE_URL',
    'BOT_PRIVATE_KEY',
    'DEVELOPER_WALLET'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  // Parse keypairs safely
  let jitoAuthKeypair: Keypair;
  try {
    if (process.env.JITO_AUTH_KEYPAIR) {
      const keyBytes = bs58.decode(process.env.JITO_AUTH_KEYPAIR);
      jitoAuthKeypair = Keypair.fromSecretKey(keyBytes);
    } else {
      // Generate a random keypair if not provided
      jitoAuthKeypair = Keypair.generate();
      console.warn('No JITO_AUTH_KEYPAIR provided, using generated keypair');
    }
  } catch (error) {
    throw new Error(`Invalid JITO_AUTH_KEYPAIR format: ${error}`);
  }

  let developerWallet: PublicKey;
  try {
    developerWallet = new PublicKey(process.env.DEVELOPER_WALLET!);
  } catch (error) {
    throw new Error(`Invalid DEVELOPER_WALLET format: ${error}`);
  }

  let raydiumProgramId: PublicKey;
  let raydiumAmmProgramId: PublicKey;
  try {
    raydiumProgramId = new PublicKey(
      process.env.RAYDIUM_PROGRAM_ID || '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'
    );
    raydiumAmmProgramId = new PublicKey(
      process.env.RAYDIUM_AMM_PROGRAM_ID || '5quBtoiQqy3bh3btcD5yU98ZoHFrqpPQeHxP2FxNp2z3'
    );
  } catch (error) {
    throw new Error(`Invalid Raydium program IDs: ${error}`);
  }

  return {
    solanaRpcUrl: process.env.SOLANA_RPC_URL!,
    solanaWsUrl: process.env.SOLANA_WS_URL || process.env.SOLANA_RPC_URL!.replace('https', 'wss'),
    jitoBlockEngineUrl: process.env.JITO_BLOCK_ENGINE_URL!,
    jitoAuthKeypair,
    jitoTipAmount: parseFloat(process.env.JITO_TIP_AMOUNT || '0.001'),
    jitoRegion: process.env.JITO_REGION || 'ny',
    botPrivateKey: process.env.BOT_PRIVATE_KEY!,
    developerWallet,
    maxBuyAmount: parseFloat(process.env.MAX_BUY_AMOUNT || '1.0'),
    minLiquiditySol: parseFloat(process.env.MIN_LIQUIDITY_SOL || '5.0'),
    maxSlippage: parseFloat(process.env.MAX_SLIPPAGE || '1.0'),
    enableAntiSniper: process.env.ENABLE_ANTI_SNIPER === 'true',
    enableSandwichProtection: process.env.ENABLE_SANDWICH_PROTECTION === 'true',
    maxTransactionsPerBundle: parseInt(process.env.MAX_TRANSACTIONS_PER_BUNDLE || '5'),
    bundleTimeoutMs: parseInt(process.env.BUNDLE_TIMEOUT_MS || '5000'),
    logLevel: process.env.LOG_LEVEL || 'info',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
    raydiumProgramId,
    raydiumAmmProgramId,
    maxRequestsPerSecond: parseInt(process.env.MAX_REQUESTS_PER_SECOND || '10'),
    cooldownPeriodMs: parseInt(process.env.COOLDOWN_PERIOD_MS || '1000')
  };
};

export const validateConfig = (config: BotConfig): void => {
  // Validate numeric ranges
  if (config.jitoTipAmount < 0.001) {
    throw new Error('JITO_TIP_AMOUNT must be at least 0.001 SOL');
  }

  if (config.maxBuyAmount <= 0) {
    throw new Error('MAX_BUY_AMOUNT must be greater than 0');
  }

  if (config.maxSlippage < 0 || config.maxSlippage > 100) {
    throw new Error('MAX_SLIPPAGE must be between 0 and 100');
  }

  if (config.maxTransactionsPerBundle < 1 || config.maxTransactionsPerBundle > 5) {
    throw new Error('MAX_TRANSACTIONS_PER_BUNDLE must be between 1 and 5');
  }

  if (config.bundleTimeoutMs < 1000) {
    throw new Error('BUNDLE_TIMEOUT_MS must be at least 1000ms');
  }

  // Validate URLs
  try {
    new URL(config.solanaRpcUrl);
    new URL(config.jitoBlockEngineUrl);
  } catch (error) {
    throw new Error('Invalid URL format in configuration');
  }

  console.log('✅ Configuration validated successfully');
};

// Export the validated configuration
export const config = (() => {
  const cfg = createConfig();
  validateConfig(cfg);
  return cfg;
})();