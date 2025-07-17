import winston from 'winston';
import { config } from '../config';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    if (stack) {
      return `${timestamp} [${level}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level}]: ${message}`;
  })
);

// Create the logger
export const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      handleExceptions: true,
      handleRejections: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      handleExceptions: true,
      handleRejections: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  exitOnError: false
});

// Create logs directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Enhanced logging methods
export const log = {
  info: (message: string, meta?: any) => {
    logger.info(message, meta);
  },
  
  warn: (message: string, meta?: any) => {
    logger.warn(message, meta);
  },
  
  error: (message: string, error?: Error | any, meta?: any) => {
    if (error instanceof Error) {
      logger.error(message, { error: error.message, stack: error.stack, ...meta });
    } else {
      logger.error(message, { error, ...meta });
    }
  },
  
  debug: (message: string, meta?: any) => {
    logger.debug(message, meta);
  },
  
  success: (message: string, meta?: any) => {
    logger.info(`✅ ${message}`, meta);
  },
  
  bundle: (message: string, bundleId?: string, meta?: any) => {
    logger.info(`🔗 [BUNDLE${bundleId ? ` ${bundleId.slice(0, 8)}...` : ''}] ${message}`, meta);
  },
  
  sniper: (message: string, wallet?: string, meta?: any) => {
    logger.warn(`🎯 [SNIPER${wallet ? ` ${wallet.slice(0, 8)}...` : ''}] ${message}`, meta);
  },
  
  transaction: (message: string, signature?: string, meta?: any) => {
    logger.info(`📝 [TX${signature ? ` ${signature.slice(0, 8)}...` : ''}] ${message}`, meta);
  },
  
  protection: (message: string, type?: string, meta?: any) => {
    logger.info(`🛡️ [PROTECTION${type ? ` ${type.toUpperCase()}` : ''}] ${message}`, meta);
  },
  
  jito: (message: string, meta?: any) => {
    logger.info(`⚡ [JITO] ${message}`, meta);
  },
  
  performance: (message: string, duration?: number, meta?: any) => {
    logger.info(`⏱️ [PERF] ${message}${duration ? ` (${duration}ms)` : ''}`, meta);
  }
};

// Middleware for timing operations
export const timing = {
  start: (operation: string): (() => void) => {
    const start = Date.now();
    log.debug(`Starting ${operation}`);
    
    return () => {
      const duration = Date.now() - start;
      log.performance(`Completed ${operation}`, duration);
    };
  }
};

export default logger;