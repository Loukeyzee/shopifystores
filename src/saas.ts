import { SaaSServer } from './api/server';
import { config } from './config';
import { log } from './utils/logger';

// SaaS Application Entry Point
async function startSaaSApplication() {
  try {
    log.info('🚀 Starting Solana Launch Protector SaaS...');

    // Validate environment
    validateEnvironment();

    // Start the API server
    const port = parseInt(process.env.PORT || '3000');
    const server = new SaaSServer(port);
    
    server.start();

    // Handle graceful shutdown
    handleGracefulShutdown();

    log.info('✅ SaaS application started successfully', {
      port,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    });

  } catch (error) {
    log.error('❌ Failed to start SaaS application', error);
    process.exit(1);
  }
}

function validateEnvironment(): void {
  const requiredEnvVars = [
    'SOLANA_RPC_URL',
    'JITO_BLOCK_ENGINE_URL'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  log.info('✅ Environment validation passed');
}

function handleGracefulShutdown(): void {
  const shutdown = (signal: string) => {
    log.info(`Received ${signal}, shutting down gracefully...`);
    
    // Add cleanup logic here if needed
    // - Close database connections
    // - Stop background tasks
    // - Save state
    
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon
}

// Start the application
if (require.main === module) {
  startSaaSApplication();
}

export { startSaaSApplication };