#!/usr/bin/env node

/**
 * 🖥️ Desktop App Builder
 * 
 * Creates 1-click desktop applications for Windows, Mac, and Linux
 * with the complete Solana wallet generator and trading suite.
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class DesktopAppBuilder {
  constructor() {
    this.appName = 'Solana-Launch-Suite';
    this.version = '1.0.0';
    this.platforms = ['win32', 'darwin', 'linux'];
  }

  async build() {
    console.log('🚀 Building 1-Click Desktop Applications...\n');

    try {
      // 1. Create simplified main entry point
      await this.createSimplifiedMain();
      
      // 2. Create auto-launch script
      await this.createAutoLaunchScript();
      
      // 3. Update package.json for desktop builds
      await this.updatePackageJson();
      
      // 4. Create platform-specific launchers
      await this.createPlatformLaunchers();
      
      // 5. Build applications
      await this.buildApplications();
      
      // 6. Create installation packages
      await this.createInstallationPackages();

      console.log('✅ Desktop applications built successfully!\n');
      console.log('📦 Installation files created:');
      console.log('  • Windows: dist/Solana-Launch-Suite-Setup.exe');
      console.log('  • macOS: dist/Solana-Launch-Suite.dmg');
      console.log('  • Linux: dist/Solana-Launch-Suite.AppImage');
      console.log('\n🎯 Each installer includes everything needed - just download and run!');

    } catch (error) {
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }
  }

  async createSimplifiedMain() {
    console.log('📝 Creating simplified main entry point...');

    const simplifiedMain = `
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

    const splashHtml = \`
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
\`;

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
      : \`file://\${path.join(__dirname, '../build/index.html')}\`;
    
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
      detail: \`🔐 Generate secure wallets locally on your device
🚀 Manage token launch trading
📊 Real-time protection and monitoring
📖 Complete PDF guide included

Everything runs locally - your keys never leave your device!

Click OK to get started.\`,
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
                detail: \`🔐 Secure Wallet Generator & Launch Protection

✅ 100% Local Generation
✅ Industry-Standard Encryption  
✅ Cross-Platform Support
✅ Launch Trading Management

Your keys, your crypto, your control.\`,
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
`;

    await fs.writeFile('main-desktop.js', simplifiedMain);
  }

  async createAutoLaunchScript() {
    console.log('🔧 Creating auto-launch scripts...');

    // Windows batch file
    const windowsLauncher = `@echo off
title Solana Launch Suite
echo.
echo 🚀 Starting Solana Launch Suite...
echo.
echo ✅ Secure wallet generator
echo ✅ Launch trading manager  
echo ✅ Real-time protection
echo.
echo Please wait while the application loads...
echo.

cd /d "%~dp0"
start "" "Solana Launch Suite.exe"

timeout /t 3 /nobreak >nul
exit`;

    // macOS shell script
    const macosLauncher = `#!/bin/bash
echo "🚀 Starting Solana Launch Suite..."
echo ""
echo "✅ Secure wallet generator"
echo "✅ Launch trading manager"  
echo "✅ Real-time protection"
echo ""
echo "Please wait while the application loads..."

# Get the directory of this script
DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Launch the app
open "Solana Launch Suite.app"

sleep 2
exit 0`;

    // Linux shell script
    const linuxLauncher = `#!/bin/bash
echo "🚀 Starting Solana Launch Suite..."
echo ""
echo "✅ Secure wallet generator"
echo "✅ Launch trading manager"
echo "✅ Real-time protection"  
echo ""
echo "Please wait while the application loads..."

# Get the directory of this script
DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Make executable and launch
chmod +x "./Solana Launch Suite.AppImage"
"./Solana Launch Suite.AppImage"

exit 0`;

    await fs.mkdir('launchers', { recursive: true });
    await fs.writeFile('launchers/start-windows.bat', windowsLauncher);
    await fs.writeFile('launchers/start-macos.sh', macosLauncher);
    await fs.writeFile('launchers/start-linux.sh', linuxLauncher);

    // Make shell scripts executable
    if (process.platform !== 'win32') {
      execSync('chmod +x launchers/start-macos.sh');
      execSync('chmod +x launchers/start-linux.sh');
    }
  }

  async updatePackageJson() {
    console.log('📦 Updating package.json for desktop builds...');

    const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));

    // Update for desktop build
    pkg.main = 'main-desktop.js';
    pkg.homepage = './';
    
    // Add build configuration
    pkg.build = {
      appId: 'com.solana.launch.suite',
      productName: 'Solana Launch Suite',
      copyright: 'Copyright © 2024 Your Company',
      directories: {
        output: 'dist'
      },
      files: [
        'main-desktop.js',
        'src/**/*',
        'assets/**/*',
        'node_modules/**/*',
        '!src/gui/frontend/src',
        '!src/gui/frontend/public',
        'src/gui/frontend/build/**/*',
        'Solana-Launch-Suite-Guide.pdf'
      ],
      extraFiles: [
        {
          from: 'launchers',
          to: 'launchers',
          filter: ['**/*']
        }
      ],
      win: {
        target: [
          {
            target: 'nsis',
            arch: ['x64']
          }
        ],
        icon: 'assets/icon.ico',
        publisherName: 'Your Company'
      },
      mac: {
        target: [
          {
            target: 'dmg',
            arch: ['x64', 'arm64']
          }
        ],
        icon: 'assets/icon.icns',
        category: 'public.app-category.finance',
        hardenedRuntime: true,
        entitlements: 'assets/entitlements.mac.plist',
        entitlementsInherit: 'assets/entitlements.mac.plist'
      },
      linux: {
        target: [
          {
            target: 'AppImage',
            arch: ['x64']
          },
          {
            target: 'deb',
            arch: ['x64']
          }
        ],
        icon: 'assets/icon.png',
        category: 'Finance'
      },
      nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
        installerIcon: 'assets/icon.ico',
        uninstallerIcon: 'assets/icon.ico',
        installerHeaderIcon: 'assets/icon.ico',
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        shortcutName: 'Solana Launch Suite'
      },
      dmg: {
        title: 'Solana Launch Suite',
        icon: 'assets/icon.icns',
        background: 'assets/dmg-background.png',
        window: {
          width: 600,
          height: 400
        },
        contents: [
          {
            x: 150,
            y: 200,
            type: 'file',
            path: 'Solana Launch Suite.app'
          },
          {
            x: 450,
            y: 200,
            type: 'link',
            path: '/Applications'
          }
        ]
      }
    };

    await fs.writeFile('package.json', JSON.stringify(pkg, null, 2));
  }

  async createPlatformLaunchers() {
    console.log('🎯 Creating platform-specific assets...');

    // Create assets directory
    await fs.mkdir('assets', { recursive: true });

    // Create simple icon files (you can replace with actual icons)
    const iconSvg = `<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea"/>
      <stop offset="100%" style="stop-color:#764ba2"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="32" fill="url(#gradient)"/>
  <text x="128" y="140" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="48" font-weight="bold">🔐</text>
  <text x="128" y="180" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16">SOLANA</text>
  <text x="128" y="200" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16">SUITE</text>
</svg>`;

    await fs.writeFile('assets/icon.svg', iconSvg);

    // Create macOS entitlements
    const entitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.network.client</key>
  <true/>
  <key>com.apple.security.network.server</key>
  <true/>
</dict>
</plist>`;

    await fs.writeFile('assets/entitlements.mac.plist', entitlements);

    console.log('📁 Assets created successfully!');
  }

  async buildApplications() {
    console.log('🔨 Building applications for all platforms...');

    try {
      // Build frontend first
      console.log('📱 Building React frontend...');
      execSync('cd src/gui/frontend && npm run build', { stdio: 'inherit' });

      // Install dependencies
      console.log('📦 Installing dependencies...');
      execSync('npm install', { stdio: 'inherit' });

      // Build for all platforms
      console.log('🖥️  Building desktop applications...');
      execSync('npx electron-builder --win --mac --linux', { stdio: 'inherit' });

    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  async createInstallationPackages() {
    console.log('📦 Creating installation packages...');

    // Create installer info files
    const windowsInfo = `# 🪟 Windows Installation

## Quick Install (Recommended)
1. Download: Solana-Launch-Suite-Setup.exe
2. Double-click to run installer
3. Follow the installation wizard
4. Launch from Desktop or Start Menu

## Manual Install
1. Download: Solana-Launch-Suite-win32-x64.zip
2. Extract to desired folder
3. Run: start-windows.bat
4. Or run: Solana Launch Suite.exe

## Requirements
- Windows 10 or later
- 4GB RAM minimum
- 500MB free disk space

## Security Notice
✅ All wallets generated locally on your PC
✅ No internet required for wallet generation
✅ Your keys never leave your device`;

    const macosInfo = `# 🍎 macOS Installation

## Quick Install (Recommended)
1. Download: Solana-Launch-Suite.dmg
2. Double-click the DMG file
3. Drag "Solana Launch Suite" to Applications
4. Launch from Applications or Spotlight

## Manual Install
1. Download: Solana-Launch-Suite-mac.zip
2. Extract the application
3. Run: start-macos.sh
4. Or launch: Solana Launch Suite.app

## Requirements
- macOS 10.15 (Catalina) or later
- 4GB RAM minimum
- 500MB free disk space

## Security Notice
✅ All wallets generated locally on your Mac
✅ No internet required for wallet generation
✅ Your keys never leave your device

## First Launch
- You may need to allow the app in System Preferences > Security & Privacy
- Right-click the app and select "Open" if Gatekeeper blocks it`;

    const linuxInfo = `# 🐧 Linux Installation

## Quick Install (Recommended)
1. Download: Solana-Launch-Suite.AppImage
2. Make executable: chmod +x Solana-Launch-Suite.AppImage
3. Double-click to run, or: ./Solana-Launch-Suite.AppImage

## Package Install (Ubuntu/Debian)
1. Download: solana-launch-suite.deb
2. Install: sudo dpkg -i solana-launch-suite.deb
3. Launch from Applications menu

## Manual Install
1. Download: Solana-Launch-Suite-linux.zip
2. Extract to desired folder
3. Run: ./start-linux.sh
4. Or run: ./Solana-Launch-Suite

## Requirements
- Ubuntu 18.04+ / Debian 10+ / Similar distribution
- 4GB RAM minimum
- 500MB free disk space

## Security Notice
✅ All wallets generated locally on your system
✅ No internet required for wallet generation
✅ Your keys never leave your device`;

    await fs.mkdir('dist/docs', { recursive: true });
    await fs.writeFile('dist/docs/Windows-Install.md', windowsInfo);
    await fs.writeFile('dist/docs/macOS-Install.md', macosInfo);
    await fs.writeFile('dist/docs/Linux-Install.md', linuxInfo);
  }
}

// Run the builder
if (require.main === module) {
  const builder = new DesktopAppBuilder();
  builder.build().catch(console.error);
}

module.exports = DesktopAppBuilder;