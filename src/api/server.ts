import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { MultiTenantManager, LaunchRequest } from '../services/multiTenantManager';
import { log } from '../utils/logger';

export class SaaSServer {
  private app: express.Application;
  private tenantManager: MultiTenantManager;
  private port: number;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
    this.tenantManager = new MultiTenantManager();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // API-specific rate limiting
    const apiLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 10, // Limit each IP to 10 API requests per minute
      message: 'API rate limit exceeded, please try again later.',
    });
    this.app.use('/api/', apiLimiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      log.info('API Request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API Info
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'Solana Launch Protector API',
        version: '1.0.0',
        description: 'Anti-sniper protection for Solana token launches',
        platforms: ['pump.fun', 'pump.swap', 'raydium', 'custom'],
        endpoints: {
          launch: 'POST /api/launch',
          status: 'GET /api/launch/:launchId',
          stats: 'GET /api/stats',
          subscription: 'GET /api/subscription'
        }
      });
    });

    // Authentication middleware
    this.app.use('/api', this.authenticateRequest.bind(this));

    // Launch protection endpoint
    this.app.post('/api/launch',
      [
        body('launchId').isString().notEmpty(),
        body('targetPlatform').isIn(['pumpfun', 'pumpswap', 'raydium', 'custom']),
        body('transactions').isArray().notEmpty(),
        body('config.maxBuyPerWallet').isNumeric(),
        body('config.bundleSize').isInt({ min: 1, max: 5 })
      ],
      this.handleLaunch.bind(this)
    );

    // Launch status endpoint
    this.app.get('/api/launch/:launchId', this.getLaunchStatus.bind(this));

    // Tenant statistics
    this.app.get('/api/stats', this.getTenantStats.bind(this));

    // Subscription info
    this.app.get('/api/subscription', this.getSubscriptionInfo.bind(this));

    // Platform-specific endpoints
    this.setupPlatformRoutes();

    // Error handling
    this.app.use(this.errorHandler.bind(this));
  }

  private setupPlatformRoutes(): void {
    // Pump.fun specific endpoints
    this.app.post('/api/pumpfun/launch',
      [
        body('tokenName').isString().notEmpty(),
        body('tokenSymbol').isString().isLength({ min: 1, max: 10 }),
        body('description').optional().isString(),
        body('image').optional().isURL(),
        body('twitter').optional().isURL(),
        body('telegram').optional().isURL(),
        body('website').optional().isURL(),
        body('initialBuySOL').isNumeric(),
        body('maxBuyPerWallet').isNumeric()
      ],
      this.handlePumpFunLaunch.bind(this)
    );

    // Pump.swap specific endpoints  
    this.app.post('/api/pumpswap/launch',
      [
        body('tokenMint').isString().notEmpty(),
        body('liquiditySOL').isNumeric(),
        body('maxBuyPerWallet').isNumeric()
      ],
      this.handlePumpSwapLaunch.bind(this)
    );

    // Raydium specific endpoints
    this.app.post('/api/raydium/launch',
      [
        body('tokenMint').isString().notEmpty(),
        body('liquiditySOL').isNumeric(),
        body('liquidityTokens').isNumeric(),
        body('maxBuyPerWallet').isNumeric()
      ],
      this.handleRaydiumLaunch.bind(this)
    );
  }

  private async authenticateRequest(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      const apiKey = req.headers['x-api-key'] as string;
      
      if (!apiKey) {
        res.status(401).json({ error: 'API key required' });
        return;
      }

      const tenant = await this.tenantManager.authenticateTenant(apiKey);
      if (!tenant) {
        res.status(401).json({ error: 'Invalid or expired API key' });
        return;
      }

      // Add tenant to request object
      (req as any).tenant = tenant;
      next();
    } catch (error) {
      log.error('Authentication error', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }

  private async handleLaunch(req: express.Request, res: express.Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const tenant = (req as any).tenant;
      const launchRequest: LaunchRequest = {
        tenantId: tenant.tenantId,
        launchId: req.body.launchId,
        tokenMint: req.body.tokenMint,
        targetPlatform: req.body.targetPlatform,
        transactions: req.body.transactions,
        config: req.body.config
      };

      // Validate request
      const validation = await this.tenantManager.validateLaunchRequest(tenant, launchRequest);
      if (!validation.valid) {
        res.status(400).json({ error: validation.reason });
        return;
      }

      // Execute launch
      const result = await this.tenantManager.executeLaunch(tenant, launchRequest);
      
      res.json(result);
    } catch (error) {
      log.error('Launch handling error', error);
      res.status(500).json({ error: 'Launch execution failed' });
    }
  }

  private async handlePumpFunLaunch(req: express.Request, res: express.Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const tenant = (req as any).tenant;
      
      // Create Pump.fun specific launch request
      const launchRequest: LaunchRequest = {
        tenantId: tenant.tenantId,
        launchId: `pumpfun_${Date.now()}`,
        targetPlatform: 'pumpfun',
        transactions: [], // Would be generated based on Pump.fun API
        config: {
          maxBuyPerWallet: req.body.maxBuyPerWallet,
          bundleSize: 3, // Typical for Pump.fun
          customProtection: {
            tokenName: req.body.tokenName,
            tokenSymbol: req.body.tokenSymbol,
            description: req.body.description,
            initialBuySOL: req.body.initialBuySOL
          }
        }
      };

      const result = await this.tenantManager.executeLaunch(tenant, launchRequest);
      res.json(result);
    } catch (error) {
      log.error('Pump.fun launch error', error);
      res.status(500).json({ error: 'Pump.fun launch failed' });
    }
  }

  private async handlePumpSwapLaunch(req: express.Request, res: express.Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const tenant = (req as any).tenant;
      
      const launchRequest: LaunchRequest = {
        tenantId: tenant.tenantId,
        launchId: `pumpswap_${Date.now()}`,
        tokenMint: req.body.tokenMint,
        targetPlatform: 'pumpswap',
        transactions: [], // Would be generated based on Pump.swap API
        config: {
          maxBuyPerWallet: req.body.maxBuyPerWallet,
          bundleSize: 4,
          customProtection: {
            liquiditySOL: req.body.liquiditySOL
          }
        }
      };

      const result = await this.tenantManager.executeLaunch(tenant, launchRequest);
      res.json(result);
    } catch (error) {
      log.error('Pump.swap launch error', error);
      res.status(500).json({ error: 'Pump.swap launch failed' });
    }
  }

  private async handleRaydiumLaunch(req: express.Request, res: express.Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const tenant = (req as any).tenant;
      
      const launchRequest: LaunchRequest = {
        tenantId: tenant.tenantId,
        launchId: `raydium_${Date.now()}`,
        tokenMint: req.body.tokenMint,
        targetPlatform: 'raydium',
        transactions: [], // Would be generated based on Raydium SDK
        config: {
          maxBuyPerWallet: req.body.maxBuyPerWallet,
          bundleSize: 3,
          customProtection: {
            liquiditySOL: req.body.liquiditySOL,
            liquidityTokens: req.body.liquidityTokens
          }
        }
      };

      const result = await this.tenantManager.executeLaunch(tenant, launchRequest);
      res.json(result);
    } catch (error) {
      log.error('Raydium launch error', error);
      res.status(500).json({ error: 'Raydium launch failed' });
    }
  }

  private async getLaunchStatus(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { launchId } = req.params;
      const tenant = (req as any).tenant;
      
      // Get launch status from tenant history
      const stats = await this.tenantManager.getTenantStats(tenant.tenantId);
      const launch = stats.recentLaunches.find((l: any) => l.launchId === launchId);
      
      if (!launch) {
        res.status(404).json({ error: 'Launch not found' });
        return;
      }

      res.json(launch);
    } catch (error) {
      log.error('Get launch status error', error);
      res.status(500).json({ error: 'Failed to get launch status' });
    }
  }

  private async getTenantStats(req: express.Request, res: express.Response): Promise<void> {
    try {
      const tenant = (req as any).tenant;
      const stats = await this.tenantManager.getTenantStats(tenant.tenantId);
      res.json(stats);
    } catch (error) {
      log.error('Get tenant stats error', error);
      res.status(500).json({ error: 'Failed to get stats' });
    }
  }

  private async getSubscriptionInfo(req: express.Request, res: express.Response): Promise<void> {
    try {
      const tenant = (req as any).tenant;
      res.json({
        plan: tenant.plan,
        features: tenant.features,
        usage: {
          launchesUsed: tenant.launchesUsed,
          launchesRemaining: tenant.maxLaunches - tenant.launchesUsed,
          maxLaunches: tenant.maxLaunches
        },
        subscription: {
          active: new Date() < tenant.subscriptionEnd,
          expiresAt: tenant.subscriptionEnd
        }
      });
    } catch (error) {
      log.error('Get subscription info error', error);
      res.status(500).json({ error: 'Failed to get subscription info' });
    }
  }

  private errorHandler(error: Error, req: express.Request, res: express.Response, next: express.NextFunction): void {
    log.error('Unhandled API error', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }

  public start(): void {
    this.app.listen(this.port, () => {
      log.info(`🚀 SaaS API Server running on port ${this.port}`, {
        port: this.port,
        environment: process.env.NODE_ENV || 'development'
      });
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}