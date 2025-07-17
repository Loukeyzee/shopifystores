const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { autoUpdater } = require('electron-updater');
const windowStateKeeper = require('electron-window-state');

// Import our protected services
const LicenseManager = require('./services/licenseManager');
const ProtectionService = require('./services/protectionService');
const { encryptedRequire } = require('./utils/codeProtection');

class SolanaProtectorApp {
  constructor() {
    this.mainWindow = null;
    this.licenseManager = new LicenseManager();
    this.protectionService = new ProtectionService();
    this.isLicenseValid = false;
  }

  async initialize() {
    // Set up auto-updater
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    }

    // Create the application window
    await this.createMainWindow();
    
    // Set up IPC handlers
    this.setupIpcHandlers();
    
    // Set up application menu
    this.setupApplicationMenu();
    
    // Check license on startup
    await this.checkLicense();
  }

  async createMainWindow() {
    // Load window state
    const mainWindowState = windowStateKeeper({
      defaultWidth: 1200,
      defaultHeight: 800
    });

    // Create the browser window
    this.mainWindow = new BrowserWindow({
      x: mainWindowState.x,
      y: mainWindowState.y,
      width: mainWindowState.width,
      height: mainWindowState.height,
      minWidth: 1000,
      minHeight: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: !isDev
      },
      icon: path.join(__dirname, '../assets/icon.png'),
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      show: false, // Don't show until ready
      frame: true,
      transparent: false,
      backgroundColor: '#1a1a2e'
    });

    // Let windowStateKeeper manage the window
    mainWindowState.manage(this.mainWindow);

    // Load the app
    const startUrl = isDev 
      ? 'http://localhost:3000' 
      : `file://${path.join(__dirname, '../build/index.html')}`;
    
    await this.mainWindow.loadURL(startUrl);

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      
      // Focus on the window
      if (isDev) {
        this.mainWindow.webContents.openDevTools();
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Prevent external navigation
    this.mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      
      if (parsedUrl.origin !== startUrl) {
        event.preventDefault();
        shell.openExternal(navigationUrl);
      }
    });

    // Prevent new window creation
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  setupApplicationMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Launch Protection',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow.webContents.send('menu-new-protection');
            }
          },
          {
            label: 'Import Configuration',
            accelerator: 'CmdOrCtrl+O',
            click: async () => {
              const result = await dialog.showOpenDialog(this.mainWindow, {
                properties: ['openFile'],
                filters: [
                  { name: 'JSON Files', extensions: ['json'] }
                ]
              });
              
              if (!result.canceled) {
                this.mainWindow.webContents.send('menu-import-config', result.filePaths[0]);
              }
            }
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Protection',
        submenu: [
          {
            label: 'Start Protection',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
              this.mainWindow.webContents.send('menu-start-protection');
            }
          },
          {
            label: 'Stop Protection',
            accelerator: 'CmdOrCtrl+S',
            click: () => {
              this.mainWindow.webContents.send('menu-stop-protection');
            }
          },
          { type: 'separator' },
          {
            label: 'View Statistics',
            accelerator: 'CmdOrCtrl+T',
            click: () => {
              this.mainWindow.webContents.send('menu-view-stats');
            }
          }
        ]
      },
      {
        label: 'License',
        submenu: [
          {
            label: 'Enter License Key',
            click: () => {
              this.mainWindow.webContents.send('menu-enter-license');
            }
          },
          {
            label: 'View License Info',
            click: () => {
              this.mainWindow.webContents.send('menu-view-license');
            }
          },
          {
            label: 'Purchase License',
            click: () => {
              shell.openExternal('https://yourwebsite.com/purchase');
            }
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'User Guide',
            click: () => {
              shell.openExternal('https://docs.yourwebsite.com');
            }
          },
          {
            label: 'Video Tutorials',
            click: () => {
              shell.openExternal('https://youtube.com/yourwebsite');
            }
          },
          {
            label: 'Support',
            click: () => {
              shell.openExternal('https://support.yourwebsite.com');
            }
          },
          { type: 'separator' },
          {
            label: 'About',
            click: () => {
              dialog.showMessageBox(this.mainWindow, {
                type: 'info',
                title: 'About Solana Launch Protector',
                message: 'Solana Launch Protector v1.0.0',
                detail: 'Advanced anti-sniper protection for Solana token launches.\n\n© 2024 Your Company Name. All rights reserved.',
                buttons: ['OK']
              });
            }
          }
        ]
      }
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          { label: 'About ' + app.getName(), role: 'about' },
          { type: 'separator' },
          { label: 'Services', role: 'services', submenu: [] },
          { type: 'separator' },
          { label: 'Hide ' + app.getName(), accelerator: 'Command+H', role: 'hide' },
          { label: 'Hide Others', accelerator: 'Command+Shift+H', role: 'hideothers' },
          { label: 'Show All', role: 'unhide' },
          { type: 'separator' },
          { label: 'Quit', accelerator: 'Command+Q', click: () => app.quit() }
        ]
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  setupIpcHandlers() {
    // License management
    ipcMain.handle('check-license', async () => {
      return await this.licenseManager.validateLicense();
    });

    ipcMain.handle('activate-license', async (event, licenseKey) => {
      try {
        const result = await this.licenseManager.activateLicense(licenseKey);
        this.isLicenseValid = result.valid;
        return result;
      } catch (error) {
        return { valid: false, error: error.message };
      }
    });

    ipcMain.handle('get-license-info', async () => {
      return await this.licenseManager.getLicenseInfo();
    });

    // Protection services (only work if license is valid)
    ipcMain.handle('start-protection', async (event, config) => {
      if (!this.isLicenseValid) {
        throw new Error('Valid license required to use protection features');
      }
      return await this.protectionService.startProtection(config);
    });

    ipcMain.handle('stop-protection', async () => {
      return await this.protectionService.stopProtection();
    });

    ipcMain.handle('get-protection-status', async () => {
      return await this.protectionService.getStatus();
    });

    ipcMain.handle('get-protection-stats', async () => {
      return await this.protectionService.getStats();
    });

    // Pump.fun integration
    ipcMain.handle('protect-pumpfun-launch', async (event, config) => {
      if (!this.isLicenseValid) {
        throw new Error('Valid license required');
      }
      return await this.protectionService.protectPumpFunLaunch(config);
    });

    // Pump.swap integration
    ipcMain.handle('protect-pumpswap-launch', async (event, config) => {
      if (!this.isLicenseValid) {
        throw new Error('Valid license required');
      }
      return await this.protectionService.protectPumpSwapLaunch(config);
    });

    // System info
    ipcMain.handle('get-system-info', async () => {
      return {
        platform: process.platform,
        arch: process.arch,
        version: app.getVersion(),
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node
      };
    });

    // File operations
    ipcMain.handle('save-configuration', async (event, config) => {
      const result = await dialog.showSaveDialog(this.mainWindow, {
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        defaultPath: 'protection-config.json'
      });

      if (!result.canceled) {
        const fs = require('fs').promises;
        await fs.writeFile(result.filePath, JSON.stringify(config, null, 2));
        return { success: true, path: result.filePath };
      }
      return { success: false };
    });

    ipcMain.handle('load-configuration', async (event, filePath) => {
      try {
        const fs = require('fs').promises;
        const data = await fs.readFile(filePath, 'utf8');
        return { success: true, config: JSON.parse(data) };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  async checkLicense() {
    try {
      const licenseResult = await this.licenseManager.validateLicense();
      this.isLicenseValid = licenseResult.valid;
      
      if (!this.isLicenseValid) {
        // Show license activation dialog
        this.mainWindow.webContents.send('show-license-activation');
      }
    } catch (error) {
      console.error('License check failed:', error);
      this.isLicenseValid = false;
    }
  }
}

// Application event handlers
app.whenReady().then(async () => {
  const protectorApp = new SolanaProtectorApp();
  await protectorApp.initialize();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const protectorApp = new SolanaProtectorApp();
    await protectorApp.initialize();
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      if (windows[0].isMinimized()) windows[0].restore();
      windows[0].focus();
    }
  });
}

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });
});

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available.');
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available.');
});

autoUpdater.on('error', (err) => {
  console.log('Error in auto-updater. ' + err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  console.log(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded');
  autoUpdater.quitAndInstall();
});

module.exports = SolanaProtectorApp;