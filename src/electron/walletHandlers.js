const { ipcMain } = require('electron');
const WalletGenerator = require('../services/walletGenerator');
const LaunchTradingManager = require('../services/launchTradingManager');
const path = require('path');
const fs = require('fs').promises;

class WalletHandlers {
  constructor() {
    this.walletGenerator = null;
    this.tradingManager = null;
    this.setupHandlers();
  }

  setupHandlers() {
    // Initialize wallet generator
    ipcMain.handle('init-wallet-generator', async (event, config = {}) => {
      try {
        this.walletGenerator = new WalletGenerator({
          ...config,
          outputDir: path.join(process.cwd(), 'generated-wallets')
        });
        
        return { success: true };
      } catch (error) {
        console.error('Failed to initialize wallet generator:', error);
        return { success: false, error: error.message };
      }
    });

    // Generate launch wallets
    ipcMain.handle('generate-launch-wallets', async (event, { count, password }) => {
      try {
        if (!this.walletGenerator) {
          this.walletGenerator = new WalletGenerator({
            outputDir: path.join(process.cwd(), 'generated-wallets')
          });
        }

        const result = await this.walletGenerator.generateLaunchWallets(count, password);
        
        return {
          success: true,
          wallets: result.wallets.map(w => ({
            address: w.address,
            privateKey: w.privateKey,
            mnemonic: w.mnemonic,
            created: w.created
          })),
          filename: result.filename,
          totalGenerated: result.totalGenerated
        };
      } catch (error) {
        console.error('Failed to generate launch wallets:', error);
        return { success: false, error: error.message };
      }
    });

    // Generate master wallet
    ipcMain.handle('generate-master-wallet', async (event, { password }) => {
      try {
        if (!this.walletGenerator) {
          this.walletGenerator = new WalletGenerator({
            outputDir: path.join(process.cwd(), 'generated-wallets')
          });
        }

        const result = await this.walletGenerator.generateMasterWallet(password);
        
        return {
          success: true,
          wallet: {
            address: result.wallet.address,
            privateKey: result.wallet.privateKey,
            mnemonic: result.wallet.mnemonic,
            created: result.wallet.created
          },
          filename: result.filename
        };
      } catch (error) {
        console.error('Failed to generate master wallet:', error);
        return { success: false, error: error.message };
      }
    });

    // Load wallets for trading
    ipcMain.handle('load-wallets-for-trading', async (event, { filename, password }) => {
      try {
        if (!this.tradingManager) {
          this.tradingManager = new LaunchTradingManager();
        }

        const wallets = await this.tradingManager.loadWallets(filename, password);
        
        return {
          success: true,
          wallets: wallets.map(w => ({
            id: w.id,
            name: w.name,
            address: w.address,
            balance: w.balance,
            tokenBalance: w.tokenBalance,
            profit: w.profit,
            trades: w.trades.length
          })),
          manager: 'loaded'
        };
      } catch (error) {
        console.error('Failed to load wallets for trading:', error);
        return { success: false, error: error.message };
      }
    });

    // Set trading token
    ipcMain.handle('set-trading-token', async (event, { tokenAddress, platform }) => {
      try {
        if (!this.tradingManager) {
          throw new Error('Trading manager not initialized');
        }

        this.tradingManager.setToken(tokenAddress, platform);
        
        return { success: true };
      } catch (error) {
        console.error('Failed to set trading token:', error);
        return { success: false, error: error.message };
      }
    });

    // Coordinated buy
    ipcMain.handle('coordinated-buy', async (event, { walletIds, amount, token, platform }) => {
      try {
        if (!this.tradingManager) {
          throw new Error('Trading manager not initialized');
        }

        // Set token first
        this.tradingManager.setToken(token, platform);
        
        const results = await this.tradingManager.coordinatedBuy(walletIds, amount);
        const successful = results.filter(r => r.success).length;
        
        return {
          success: true,
          results: results,
          successful: successful,
          total: walletIds.length
        };
      } catch (error) {
        console.error('Coordinated buy failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Sell all tokens
    ipcMain.handle('sell-all-tokens', async (event, { percentage, walletIds }) => {
      try {
        if (!this.tradingManager) {
          throw new Error('Trading manager not initialized');
        }

        const result = await this.tradingManager.sellAll(walletIds, percentage);
        
        return {
          success: true,
          results: result.results,
          totalProfit: result.totalProfit,
          successful: result.successful
        };
      } catch (error) {
        console.error('Sell all failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Emergency sell all
    ipcMain.handle('emergency-sell-all', async (event) => {
      try {
        if (!this.tradingManager) {
          throw new Error('Trading manager not initialized');
        }

        const result = await this.tradingManager.emergencySellAll();
        
        return {
          success: true,
          result: result
        };
      } catch (error) {
        console.error('Emergency sell failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Fund wallets from master
    ipcMain.handle('fund-wallets-from-master', async (event, { masterFile, masterPassword, amount }) => {
      try {
        if (!this.tradingManager) {
          throw new Error('Trading manager not initialized');
        }

        const results = await this.tradingManager.fundWalletsFromMaster(
          masterFile,
          masterPassword,
          amount
        );
        
        return {
          success: true,
          results: results
        };
      } catch (error) {
        console.error('Fund wallets failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Withdraw profits
    ipcMain.handle('withdraw-profits', async (event, { mainWalletAddress, minBalance }) => {
      try {
        if (!this.tradingManager) {
          throw new Error('Trading manager not initialized');
        }

        const result = await this.tradingManager.withdrawProfits(mainWalletAddress, { minBalance });
        
        return {
          success: true,
          results: result.results,
          totalWithdrawn: result.totalWithdrawn
        };
      } catch (error) {
        console.error('Withdraw profits failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Get wallet statistics
    ipcMain.handle('get-wallet-stats', async (event) => {
      try {
        if (!this.tradingManager) {
          throw new Error('Trading manager not initialized');
        }

        const stats = this.tradingManager.getTradingStats();
        const details = this.tradingManager.getWalletDetails();
        
        return {
          success: true,
          stats: stats,
          wallets: details
        };
      } catch (error) {
        console.error('Get wallet stats failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Export wallets
    ipcMain.handle('export-wallets', async (event, format = 'csv') => {
      try {
        if (!this.walletGenerator) {
          throw new Error('Wallet generator not initialized');
        }

        // This would need to be implemented based on last generated wallets
        const filename = await this.walletGenerator.exportWallets([], format);
        
        return {
          success: true,
          filename: filename
        };
      } catch (error) {
        console.error('Export wallets failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Get security audit
    ipcMain.handle('get-security-audit', async (event) => {
      try {
        if (!this.walletGenerator) {
          this.walletGenerator = new WalletGenerator();
        }

        const audit = this.walletGenerator.securityAudit();
        
        return {
          success: true,
          audit: audit
        };
      } catch (error) {
        console.error('Get security audit failed:', error);
        return { success: false, error: error.message };
      }
    });

    // List wallet files
    ipcMain.handle('list-wallet-files', async (event) => {
      try {
        const walletDir = path.join(process.cwd(), 'generated-wallets');
        
        try {
          await fs.access(walletDir);
        } catch {
          await fs.mkdir(walletDir, { recursive: true });
          return { success: true, files: [] };
        }

        const files = await fs.readdir(walletDir);
        const walletFiles = files.filter(file => 
          file.endsWith('.json') && (file.includes('launch_wallets') || file.includes('master_wallets'))
        );

        const fileDetails = await Promise.all(
          walletFiles.map(async (file) => {
            const filePath = path.join(walletDir, file);
            const stats = await fs.stat(filePath);
            
            return {
              name: file,
              path: filePath,
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime,
              type: file.includes('master') ? 'master' : 'launch'
            };
          })
        );

        return {
          success: true,
          files: fileDetails.sort((a, b) => b.created - a.created)
        };
      } catch (error) {
        console.error('List wallet files failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Validate wallet file
    ipcMain.handle('validate-wallet-file', async (event, { filename, password }) => {
      try {
        if (!this.walletGenerator) {
          this.walletGenerator = new WalletGenerator({
            outputDir: path.join(process.cwd(), 'generated-wallets')
          });
        }

        const data = await this.walletGenerator.loadWalletsFromFile(filename, password);
        
        return {
          success: true,
          valid: true,
          walletCount: data.wallets ? data.wallets.length : 1,
          type: data.metadata?.type || 'launch',
          created: data.metadata?.created
        };
      } catch (error) {
        console.error('Validate wallet file failed:', error);
        return { 
          success: false, 
          valid: false, 
          error: error.message.includes('password') ? 'Invalid password' : 'Invalid file'
        };
      }
    });

    // Setup profit taking
    ipcMain.handle('setup-profit-taking', async (event, { targetPercent, stopLossPercent }) => {
      try {
        if (!this.tradingManager) {
          throw new Error('Trading manager not initialized');
        }

        const intervalId = await this.tradingManager.setupProfitTaking(targetPercent, stopLossPercent);
        
        return {
          success: true,
          intervalId: intervalId
        };
      } catch (error) {
        console.error('Setup profit taking failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Generate trading report
    ipcMain.handle('generate-trading-report', async (event) => {
      try {
        if (!this.tradingManager) {
          throw new Error('Trading manager not initialized');
        }

        const report = this.tradingManager.generateTradingReport();
        
        // Save report to file
        const reportPath = path.join(process.cwd(), 'generated-wallets', `trading_report_${Date.now()}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        return {
          success: true,
          report: report,
          savedTo: reportPath
        };
      } catch (error) {
        console.error('Generate trading report failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Update wallet balances
    ipcMain.handle('update-wallet-balances', async (event) => {
      try {
        if (!this.tradingManager) {
          throw new Error('Trading manager not initialized');
        }

        await this.tradingManager.updateAllBalances();
        const details = this.tradingManager.getWalletDetails();
        
        return {
          success: true,
          wallets: details
        };
      } catch (error) {
        console.error('Update wallet balances failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Import wallet from mnemonic
    ipcMain.handle('import-wallet-from-mnemonic', async (event, { mnemonic }) => {
      try {
        if (!this.walletGenerator) {
          this.walletGenerator = new WalletGenerator();
        }

        const wallet = this.walletGenerator.importFromMnemonic(mnemonic);
        
        return {
          success: true,
          wallet: {
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic,
            imported: wallet.imported
          }
        };
      } catch (error) {
        console.error('Import wallet from mnemonic failed:', error);
        return { success: false, error: error.message };
      }
    });

    // Import wallet from private key
    ipcMain.handle('import-wallet-from-private-key', async (event, { privateKey }) => {
      try {
        if (!this.walletGenerator) {
          this.walletGenerator = new WalletGenerator();
        }

        const wallet = this.walletGenerator.importFromPrivateKey(privateKey);
        
        return {
          success: true,
          wallet: {
            address: wallet.address,
            privateKey: wallet.privateKey,
            imported: wallet.imported
          }
        };
      } catch (error) {
        console.error('Import wallet from private key failed:', error);
        return { success: false, error: error.message };
      }
    });

    console.log('✅ Wallet handlers initialized');
  }

  // Cleanup method
  cleanup() {
    this.walletGenerator = null;
    this.tradingManager = null;
  }
}

module.exports = WalletHandlers;