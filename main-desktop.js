
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { autoUpdater } = require('electron-updater');

// Auto-detect if this is first run
const isFirstRun = !require('fs').existsSync(path.join(app.getPath('userData'), 'config.json'));

class SolanaLaunchSuite {
  constructor() {
    this.mainWindow = null;
    this.splashWindow = null;
  }

  async initialize() {
    console.log('🚀 Initializing Solana Launch Suite...');
    
    // Show splash screen on first run
    if (isFirstRun) {
      await this.showSplashScreen();
    }
    
    // Create main window
    await this.createMainWindow();
    
    // Setup auto-updater
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    }
    
    // Setup handlers
    this.setupHandlers();
    
    console.log('✅ Solana Launch Suite ready!');
  }

  async showSplashScreen() {
    this.splashWindow = new BrowserWindow({
      width: 600,
      height: 400,
      frame: false,
      alwaysOnTop: true,
      transparent: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    const splashHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      text-align: center;
    }
    .container {
      padding: 40px;
    }
    h1 {
      font-size: 28px;
      margin-bottom: 20px;
      background: linear-gradient(45deg, #fff, #a8edea);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      font-size: 16px;
      opacity: 0.9;
      margin-bottom: 30px;
    }
    .loading {
      display: inline-block;
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 1s ease-in-out infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .features {
      font-size: 14px;
      margin-top: 20px;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 Solana Launch Suite</h1>
    <div class="subtitle">Secure Wallet Generator & Launch Protection</div>
    <div class="loading"></div>
    <div class="features">
      ✅ Generate Secure Wallets<br>
      ✅ Launch Trading Manager<br>
      ✅ Real-time Protection<br>
      ✅ 100% Local & Safe
    </div>
  </div>
  <script>
    setTimeout(() => {
      require('electron').ipcRenderer.send('splash-finished');
    }, 3000);
  </script>
</body>
</html>
`;

    await this.splashWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(splashHtml));
    
    // Auto-close splash after 3 seconds
    setTimeout(() => {
      if (this.splashWindow) {
        this.splashWindow.close();
        this.splashWindow = null;
      }
    }, 3000);
  }

  async createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800,
      show: false, // Don't show until ready
      icon: path.join(__dirname, 'assets/icon.png'),
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        webSecurity: false
      },
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
    });

    // Load the app
    const startUrl = isDev 
      ? 'http://localhost:3000' 
      : `file://${path.join(__dirname, '../build/index.html')}`;
    
    await this.mainWindow.loadURL(startUrl);

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      
      // Show welcome dialog on first run
      if (isFirstRun) {
        this.showWelcomeDialog();
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  showWelcomeDialog() {
    const options = {
      type: 'info',
      title: 'Welcome to Solana Launch Suite! 🎉',
      message: 'Your secure wallet generator is ready!',
      detail: `🔐 Generate secure wallets locally on your device
🚀 Manage token launch trading
📊 Real-time protection and monitoring
📖 Complete PDF guide included

Everything runs locally - your keys never leave your device!

Click OK to get started.`,
      buttons: ['Get Started!', 'Open PDF Guide'],
      defaultId: 0
    };

    dialog.showMessageBox(this.mainWindow, options).then(result => {
      if (result.response === 1) {
        // Open PDF guide
        shell.openPath(path.join(__dirname, 'Solana-Launch-Suite-Guide.pdf'));
      }
    });

    // Mark as no longer first run
    require('fs').writeFileSync(
      path.join(app.getPath('userData'), 'config.json'),
      JSON.stringify({ firstRun: false, installed: new Date().toISOString() })
    );
  }

  setupHandlers() {
    // Import and setup all the existing handlers
    const WalletHandlers = require('./src/electron/walletHandlers');
    const walletHandlers = new WalletHandlers();

    // Handle splash finished
    ipcMain.on('splash-finished', () => {
      if (this.splashWindow) {
        this.splashWindow.close();
        this.splashWindow = null;
      }
    });

    // Create application menu
    this.createMenu();
  }

  createMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Wallet Set',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow.webContents.send('new-wallet-set');
            }
          },
          {
            label: 'Open Wallet File',
            accelerator: 'CmdOrCtrl+O',
            click: async () => {
              const result = await dialog.showOpenDialog(this.mainWindow, {
                title: 'Open Wallet File',
                filters: [
                  { name: 'Wallet Files', extensions: ['json'] },
                  { name: 'All Files', extensions: ['*'] }
                ]
              });
              
              if (!result.canceled && result.filePaths.length > 0) {
                this.mainWindow.webContents.send('open-wallet-file', result.filePaths[0]);
              }
            }
          },
          { type: 'separator' },
          {
            label: 'Settings',
            accelerator: 'CmdOrCtrl+,',
            click: () => {
              this.mainWindow.webContents.send('open-settings');
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
        label: 'Tools',
        submenu: [
          {
            label: 'Generate Launch Wallets',
            accelerator: 'CmdOrCtrl+G',
            click: () => {
              this.mainWindow.webContents.send('generate-wallets');
            }
          },
          {
            label: 'Generate Master Wallet',
            accelerator: 'CmdOrCtrl+M',
            click: () => {
              this.mainWindow.webContents.send('generate-master');
            }
          },
          { type: 'separator' },
          {
            label: 'Security Audit',
            click: () => {
              this.mainWindow.webContents.send('security-audit');
            }
          },
          {
            label: 'Export Wallets',
            click: () => {
              this.mainWindow.webContents.send('export-wallets');
            }
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'User Guide (PDF)',
            click: () => {
              shell.openPath(path.join(__dirname, 'Solana-Launch-Suite-Guide.pdf'));
            }
          },
          {
            label: 'Security Best Practices',
            click: () => {
              this.mainWindow.webContents.send('show-security-guide');
            }
          },
          { type: 'separator' },
          {
            label: 'About',
            click: () => {
              dialog.showMessageBox(this.mainWindow, {
                type: 'info',
                title: 'About Solana Launch Suite',
                message: 'Solana Launch Suite v1.0.0',
                detail: `🔐 Secure Wallet Generator & Launch Protection

✅ 100% Local Generation
✅ Industry-Standard Encryption  
✅ Cross-Platform Support
✅ Launch Trading Management

Your keys, your crypto, your control.`,
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
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideothers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}

// Initialize the app
app.whenReady().then(async () => {
  const suite = new SolanaLaunchSuite();
  await suite.initialize();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const suite = new SolanaLaunchSuite();
    await suite.createMainWindow();
  }
});

// Handle protocol for auto-updates
if (!isDev) {
  app.setAsDefaultProtocolClient('solana-launch-suite');
}
