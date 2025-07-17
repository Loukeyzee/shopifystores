#!/usr/bin/env node

/**
 * 📖 PDF Guide Generator
 * 
 * Creates a comprehensive, dummy-proof PDF guide for the 
 * Solana Launch Suite with step-by-step instructions and screenshots.
 */

const fs = require('fs').promises;
const path = require('path');

class PDFGuideGenerator {
  constructor() {
    this.title = 'Solana Launch Suite - Complete User Guide';
    this.version = '1.0.0';
  }

  async generate() {
    console.log('📖 Generating PDF Guide...\n');

    try {
      // Generate HTML content
      const htmlContent = await this.generateHTMLContent();
      
      // Save HTML file
      await fs.writeFile('Solana-Launch-Suite-Guide.html', htmlContent);
      
      // Generate markdown for easy editing
      const markdownContent = await this.generateMarkdownContent();
      await fs.writeFile('Solana-Launch-Suite-Guide.md', markdownContent);

      console.log('✅ Guide files generated:');
      console.log('  • Solana-Launch-Suite-Guide.html (for PDF conversion)');
      console.log('  • Solana-Launch-Suite-Guide.md (for editing)');
      console.log('\n📝 To create PDF:');
      console.log('  1. Open the HTML file in Chrome/Edge');
      console.log('  2. Press Ctrl+P (Cmd+P on Mac)');
      console.log('  3. Choose "Save as PDF"');
      console.log('  4. Select "More settings" → "Margins: None"');
      console.log('  5. Save as "Solana-Launch-Suite-Guide.pdf"');

    } catch (error) {
      console.error('❌ Guide generation failed:', error.message);
      process.exit(1);
    }
  }

  async generateHTMLContent() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solana Launch Suite - Complete User Guide</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #fff;
    }
    
    .cover {
      text-align: center;
      padding: 60px 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: -40px -20px 60px -20px;
      page-break-after: always;
    }
    
    .cover h1 {
      font-size: 48px;
      margin-bottom: 20px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    
    .cover .subtitle {
      font-size: 24px;
      margin-bottom: 40px;
      opacity: 0.9;
    }
    
    .cover .version {
      font-size: 16px;
      opacity: 0.8;
    }
    
    .cover .features {
      display: inline-block;
      text-align: left;
      margin-top: 40px;
      font-size: 18px;
    }
    
    h1 {
      color: #2D3748;
      font-size: 32px;
      margin: 40px 0 20px 0;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
    }
    
    h2 {
      color: #4A5568;
      font-size: 24px;
      margin: 30px 0 15px 0;
      background: #F7FAFC;
      padding: 15px;
      border-left: 5px solid #667eea;
    }
    
    h3 {
      color: #2D3748;
      font-size: 20px;
      margin: 25px 0 10px 0;
    }
    
    p {
      margin-bottom: 15px;
      text-align: justify;
    }
    
    .warning {
      background: #FED7D7;
      border: 2px solid #F56565;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    
    .warning h3 {
      color: #C53030;
      margin-top: 0;
    }
    
    .info {
      background: #BEE3F8;
      border: 2px solid #3182CE;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    
    .info h3 {
      color: #2B6CB0;
      margin-top: 0;
    }
    
    .success {
      background: #C6F6D5;
      border: 2px solid #38A169;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    
    .success h3 {
      color: #2F855A;
      margin-top: 0;
    }
    
    .step-box {
      background: #F7FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 20px;
      margin: 15px 0;
      position: relative;
    }
    
    .step-number {
      position: absolute;
      top: -15px;
      left: 20px;
      background: #667eea;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
    
    .step-box h4 {
      margin-top: 10px;
      color: #2D3748;
    }
    
    ul, ol {
      margin: 15px 0 15px 30px;
    }
    
    li {
      margin-bottom: 8px;
    }
    
    code {
      background: #EDF2F7;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 14px;
    }
    
    .code-block {
      background: #1A202C;
      color: #E2E8F0;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 20px 0;
      font-family: 'Monaco', 'Consolas', monospace;
    }
    
    .screenshot-placeholder {
      background: #F7FAFC;
      border: 2px dashed #CBD5E0;
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 20px 0;
      border-radius: 8px;
      color: #718096;
      font-style: italic;
    }
    
    .table-of-contents {
      background: #F7FAFC;
      padding: 30px;
      border-radius: 8px;
      margin: 30px 0;
    }
    
    .table-of-contents h2 {
      background: none;
      border: none;
      padding: 0;
      margin-bottom: 20px;
    }
    
    .toc-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dotted #CBD5E0;
    }
    
    .page-break {
      page-break-before: always;
    }
    
    @media print {
      body {
        max-width: none;
        margin: 0;
        padding: 20px;
      }
      
      .cover {
        margin: -20px -20px 40px -20px;
      }
      
      .warning, .info, .success {
        page-break-inside: avoid;
      }
      
      .step-box {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  ${await this.getCoverPage()}
  ${await this.getTableOfContents()}
  ${await this.getQuickStartSection()}
  ${await this.getInstallationSection()}
  ${await this.getWalletGeneratorSection()}
  ${await this.getLaunchTradingSection()}
  ${await this.getSecuritySection()}
  ${await this.getTroubleshootingSection()}
  ${await this.getAdvancedSection()}
  ${await this.getAppendixSection()}
</body>
</html>`;
  }

  async getCoverPage() {
    return `
  <div class="cover">
    <div style="font-size: 80px; margin-bottom: 30px;">🔐</div>
    <h1>Solana Launch Suite</h1>
    <div class="subtitle">Complete User Guide</div>
    <div class="version">Version ${this.version}</div>
    
    <div class="features">
      ✅ Secure Wallet Generator<br>
      ✅ Launch Trading Manager<br>
      ✅ Real-time Protection<br>
      ✅ Cross-Platform Support<br>
      ✅ 100% Local & Safe
    </div>
    
    <div style="margin-top: 40px; font-size: 14px; opacity: 0.8;">
      Your keys, your crypto, your control.
    </div>
  </div>`;
  }

  async getTableOfContents() {
    return `
  <div class="table-of-contents">
    <h2>📋 Table of Contents</h2>
    <div class="toc-item"><span>1. Quick Start Guide</span><span>Page 3</span></div>
    <div class="toc-item"><span>2. Installation Instructions</span><span>Page 5</span></div>
    <div class="toc-item"><span>3. Wallet Generator</span><span>Page 8</span></div>
    <div class="toc-item"><span>4. Launch Trading Manager</span><span>Page 12</span></div>
    <div class="toc-item"><span>5. Security Best Practices</span><span>Page 16</span></div>
    <div class="toc-item"><span>6. Troubleshooting</span><span>Page 19</span></div>
    <div class="toc-item"><span>7. Advanced Features</span><span>Page 22</span></div>
    <div class="toc-item"><span>8. Appendix & References</span><span>Page 25</span></div>
  </div>`;
  }

  async getQuickStartSection() {
    return `
  <div class="page-break">
    <h1>1. 🚀 Quick Start Guide</h1>
    
    <div class="success">
      <h3>🎯 What You'll Accomplish</h3>
      <p>In just 10 minutes, you'll have secure wallets generated and be ready for token launch trading!</p>
    </div>

    <div class="step-box">
      <div class="step-number">1</div>
      <h4>Download & Install</h4>
      <p>Download the installer for your operating system:</p>
      <ul>
        <li><strong>Windows:</strong> Solana-Launch-Suite-Setup.exe</li>
        <li><strong>Mac:</strong> Solana-Launch-Suite.dmg</li>
        <li><strong>Linux:</strong> Solana-Launch-Suite.AppImage</li>
      </ul>
      <div class="screenshot-placeholder">Screenshot: Download page with platform options</div>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>First Launch</h4>
      <p>Double-click the installed application. You'll see a welcome screen:</p>
      <div class="screenshot-placeholder">Screenshot: Welcome splash screen</div>
      <p>Click "Get Started!" to begin using the application.</p>
    </div>

    <div class="step-box">
      <div class="step-number">3</div>
      <h4>Generate Your First Wallets</h4>
      <p>Navigate to the "Wallet Generator" tab and:</p>
      <ol>
        <li>Set wallet count (start with 5-10 for testing)</li>
        <li>Enter a secure password</li>
        <li>Click "Generate Launch Wallets"</li>
        <li>Save the generated file securely</li>
      </ol>
      <div class="screenshot-placeholder">Screenshot: Wallet generator interface</div>
    </div>

    <div class="warning">
      <h3>⚠️ Critical First Steps</h3>
      <ul>
        <li><strong>Backup immediately:</strong> Copy wallet files to multiple secure locations</li>
        <li><strong>Password security:</strong> Store passwords separately using a password manager</li>
        <li><strong>Test first:</strong> Always test with small amounts before using large sums</li>
      </ul>
    </div>

    <h2>🎯 Common Use Cases</h2>
    
    <h3>For New Token Developers</h3>
    <p>Generate 5-10 wallets to create organic buying patterns during your token launch. This helps establish initial trading activity and prevents sniper bots from manipulating your launch.</p>
    
    <h3>For Experienced Traders</h3>
    <p>Use 20-50 wallets for sophisticated trading strategies across multiple launches. Implement profit-taking rules and automated trading patterns.</p>
    
    <h3>For Launch Protection</h3>
    <p>Deploy the real-time protection system to automatically detect and counter sniper attacks during token launches.</p>
  </div>`;
  }

  async getInstallationSection() {
    return `
  <div class="page-break">
    <h1>2. 💻 Installation Instructions</h1>
    
    <div class="info">
      <h3>📋 System Requirements</h3>
      <ul>
        <li><strong>RAM:</strong> 4GB minimum, 8GB recommended</li>
        <li><strong>Storage:</strong> 500MB free space</li>
        <li><strong>Internet:</strong> Required for downloads and trading (not for wallet generation)</li>
        <li><strong>Operating System:</strong> Windows 10+, macOS 10.15+, or Ubuntu 18.04+</li>
      </ul>
    </div>

    <h2>🪟 Windows Installation</h2>
    
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>Download the Installer</h4>
      <p>Download <code>Solana-Launch-Suite-Setup.exe</code> from the official website.</p>
      <div class="screenshot-placeholder">Screenshot: Windows download button</div>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>Run the Installer</h4>
      <p>Double-click the downloaded file. Windows may show a security warning:</p>
      <ul>
        <li>Click "More info" if Windows Defender blocks it</li>
        <li>Click "Run anyway" to proceed</li>
        <li>This is normal for new applications</li>
      </ul>
      <div class="screenshot-placeholder">Screenshot: Windows security dialog</div>
    </div>

    <div class="step-box">
      <div class="step-number">3</div>
      <h4>Follow Installation Wizard</h4>
      <ol>
        <li>Choose installation directory (default is recommended)</li>
        <li>Select "Create desktop shortcut" for easy access</li>
        <li>Click "Install" and wait for completion</li>
        <li>Launch the application when installation finishes</li>
      </ol>
      <div class="screenshot-placeholder">Screenshot: Installation wizard</div>
    </div>

    <h2>🍎 macOS Installation</h2>
    
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>Download the DMG File</h4>
      <p>Download <code>Solana-Launch-Suite.dmg</code> from the official website.</p>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>Mount and Install</h4>
      <ol>
        <li>Double-click the DMG file to mount it</li>
        <li>Drag "Solana Launch Suite" to the Applications folder</li>
        <li>Eject the DMG file</li>
      </ol>
      <div class="screenshot-placeholder">Screenshot: macOS DMG installation</div>
    </div>

    <div class="step-box">
      <div class="step-number">3</div>
      <h4>First Launch (Important!)</h4>
      <p>macOS may block the app initially. To resolve:</p>
      <ol>
        <li>Try to open the app from Applications</li>
        <li>If blocked, go to System Preferences → Security & Privacy</li>
        <li>Click "Open Anyway" next to the app name</li>
        <li>Or right-click the app and select "Open"</li>
      </ol>
      <div class="warning">
        <h3>⚠️ macOS Security Notice</h3>
        <p>This security prompt is normal for downloaded applications. The app is safe to use.</p>
      </div>
    </div>

    <h2>🐧 Linux Installation</h2>
    
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>AppImage (Recommended)</h4>
      <p>Download <code>Solana-Launch-Suite.AppImage</code></p>
      <div class="code-block">
# Make executable
chmod +x Solana-Launch-Suite.AppImage

# Run the application
./Solana-Launch-Suite.AppImage
      </div>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>Debian/Ubuntu Package</h4>
      <p>For Ubuntu and Debian systems:</p>
      <div class="code-block">
# Download and install
wget https://releases.example.com/solana-launch-suite.deb
sudo dpkg -i solana-launch-suite.deb

# Fix dependencies if needed
sudo apt-get install -f
      </div>
    </div>

    <div class="success">
      <h3>✅ Installation Complete!</h3>
      <p>You should now see the Solana Launch Suite icon on your desktop or in your applications menu. The first launch will show a welcome screen with basic setup instructions.</p>
    </div>
  </div>`;
  }

  async getWalletGeneratorSection() {
    return `
  <div class="page-break">
    <h1>3. 🔐 Wallet Generator</h1>
    
    <div class="info">
      <h3>🛡️ Security Notice</h3>
      <p>All wallets are generated completely locally on your device. Private keys and seed phrases never leave your computer. This is the most secure way to create wallets for trading.</p>
    </div>

    <h2>📱 Using the GUI Interface</h2>
    
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>Open Wallet Generator</h4>
      <p>Click on the "Wallet Generator" tab in the main application window.</p>
      <div class="screenshot-placeholder">Screenshot: Wallet Generator tab highlighted</div>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>Generate Launch Trading Wallets</h4>
      <p>In the "Launch Trading Wallets" section:</p>
      <ol>
        <li><strong>Number of Wallets:</strong> Choose 5-50 (start with 10 for testing)</li>
        <li><strong>Password:</strong> Enter a strong password or leave blank for auto-generation</li>
        <li>Click "Generate Launch Wallets"</li>
      </ol>
      <div class="screenshot-placeholder">Screenshot: Launch wallet generation form</div>
      
      <div class="warning">
        <h3>⚠️ Password Security</h3>
        <ul>
          <li>Use a unique password you've never used before</li>
          <li>Store it in a password manager</li>
          <li>Never store the password with the wallet file</li>
        </ul>
      </div>
    </div>

    <div class="step-box">
      <div class="step-number">3</div>
      <h4>Generate Master Wallet</h4>
      <p>Create your main funding wallet:</p>
      <ol>
        <li>Go to "Master Developer Wallet" section</li>
        <li>Enter a strong password</li>
        <li>Click "Generate Master Wallet"</li>
        <li>This wallet will fund your trading operations</li>
      </ol>
      <div class="screenshot-placeholder">Screenshot: Master wallet generation</div>
    </div>

    <h2>💾 Understanding Generated Files</h2>
    
    <h3>File Structure</h3>
    <p>Wallets are saved in the <code>generated-wallets</code> folder:</p>
    <div class="code-block">
generated-wallets/
├── launch_wallets_2024-01-15T10-30-00.json
├── master_wallets_2024-01-15T10-30-00.json
└── README_SECURITY.md
    </div>

    <h3>What's Inside Each File</h3>
    <p>Each wallet file contains:</p>
    <ul>
      <li><strong>Wallet Address:</strong> Your public Solana address</li>
      <li><strong>Private Key:</strong> For importing into wallets (encrypted)</li>
      <li><strong>Seed Phrase:</strong> 12-word recovery phrase (encrypted)</li>
      <li><strong>Metadata:</strong> Creation time and purpose</li>
    </ul>

    <div class="success">
      <h3>✅ Security Features</h3>
      <ul>
        <li><strong>AES-256 Encryption:</strong> Military-grade encryption</li>
        <li><strong>PBKDF2 Key Derivation:</strong> 100,000 iterations</li>
        <li><strong>BIP44 Standard:</strong> Compatible with all major wallets</li>
        <li><strong>Local Generation:</strong> Never touches the internet</li>
      </ul>
    </div>

    <h2>📱 Importing Wallets</h2>
    
    <h3>Into Phantom Wallet</h3>
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>Access Import Function</h4>
      <ol>
        <li>Open Phantom wallet extension or app</li>
        <li>Click the wallet menu (top left)</li>
        <li>Select "Add Account"</li>
        <li>Choose "Import Private Key" or "Import from Seed Phrase"</li>
      </ol>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>Enter Wallet Information</h4>
      <ol>
        <li>Enter your 12-word seed phrase OR private key</li>
        <li>Give the wallet a name (e.g., "LaunchWallet_1")</li>
        <li>Click "Import"</li>
        <li>Your wallet is now ready to use!</li>
      </ol>
    </div>

    <h3>Into Solflare Wallet</h3>
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>Import Process</h4>
      <ol>
        <li>Open Solflare app or extension</li>
        <li>Click "Access Wallet"</li>
        <li>Select "Import Wallet"</li>
        <li>Enter your seed phrase</li>
        <li>Set a password and save</li>
      </ol>
    </div>

    <div class="warning">
      <h3>⚠️ Import Security</h3>
      <ul>
        <li>Only import on devices you trust</li>
        <li>Never enter seed phrases on websites</li>
        <li>Double-check wallet addresses after import</li>
        <li>Test with small amounts first</li>
      </ul>
    </div>
  </div>`;
  }

  async getLaunchTradingSection() {
    return `
  <div class="page-break">
    <h1>4. 🚀 Launch Trading Manager</h1>
    
    <div class="info">
      <h3>🎯 Purpose</h3>
      <p>The Launch Trading Manager allows you to coordinate multiple wallets for token launches, creating natural buying patterns and helping establish healthy trading activity.</p>
    </div>

    <h2>🔧 Setting Up Trading</h2>
    
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>Load Your Wallets</h4>
      <p>In the "Launch Trading" tab:</p>
      <ol>
        <li>Click "Load Wallet File"</li>
        <li>Select your generated wallet file</li>
        <li>Enter the password</li>
        <li>Confirm wallet loading</li>
      </ol>
      <div class="screenshot-placeholder">Screenshot: Wallet loading interface</div>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>Fund Your Wallets</h4>
      <p>Before trading, wallets need SOL:</p>
      <ol>
        <li>Fund your master wallet with SOL</li>
        <li>Use "Fund Wallets from Master" feature</li>
        <li>Set amount per wallet (e.g., 0.1 SOL each)</li>
        <li>Confirm distribution</li>
      </ol>
      <div class="warning">
        <h3>⚠️ Funding Strategy</h3>
        <p>Start with small amounts (0.05-0.1 SOL per wallet) for testing. You can always add more later.</p>
      </div>
    </div>

    <div class="step-box">
      <div class="step-number">3</div>
      <h4>Set Target Token</h4>
      <p>Configure your trading target:</p>
      <ol>
        <li>Enter token contract address</li>
        <li>Select platform (Pump.fun, Pump.swap, etc.)</li>
        <li>Set trading parameters</li>
        <li>Verify configuration</li>
      </ol>
      <div class="screenshot-placeholder">Screenshot: Token configuration form</div>
    </div>

    <h2>💰 Executing Trades</h2>
    
    <h3>Coordinated Buying</h3>
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>Set Up Buy Parameters</h4>
      <ul>
        <li><strong>Wallet Selection:</strong> Choose which wallets to use</li>
        <li><strong>Amount per Wallet:</strong> SOL amount each wallet spends</li>
        <li><strong>Timing:</strong> Delays between purchases (1-5 seconds recommended)</li>
        <li><strong>Randomization:</strong> Add random delays for natural patterns</li>
      </ul>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>Execute Coordinated Buy</h4>
      <ol>
        <li>Review your settings</li>
        <li>Click "Coordinated Buy"</li>
        <li>Monitor execution progress</li>
        <li>Check transaction confirmations</li>
      </ol>
      <div class="screenshot-placeholder">Screenshot: Buy execution progress</div>
    </div>

    <h3>Profit Taking Strategies</h3>
    
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>Manual Profit Taking</h4>
      <p>Sell portions of your holdings:</p>
      <ul>
        <li><strong>25% Sell:</strong> Take initial profits</li>
        <li><strong>50% Sell:</strong> Secure substantial gains</li>
        <li><strong>75% Sell:</strong> Lock in most profits</li>
        <li><strong>100% Sell:</strong> Complete exit</li>
      </ul>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>Automated Profit Taking</h4>
      <p>Set up automatic selling rules:</p>
      <ol>
        <li>Set profit target (e.g., +100%)</li>
        <li>Set stop loss (e.g., -20%)</li>
        <li>Enable automatic monitoring</li>
        <li>System sells when targets hit</li>
      </ol>
    </div>

    <h2>📊 Monitoring & Management</h2>
    
    <h3>Real-Time Statistics</h3>
    <p>The dashboard shows:</p>
    <ul>
      <li><strong>Total Balance:</strong> SOL across all wallets</li>
      <li><strong>Token Holdings:</strong> Current token positions</li>
      <li><strong>Profit/Loss:</strong> Realized and unrealized P&L</li>
      <li><strong>Success Rate:</strong> Percentage of successful trades</li>
    </ul>

    <div class="screenshot-placeholder">Screenshot: Trading statistics dashboard</div>

    <h3>Wallet Management</h3>
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>Balance Monitoring</h4>
      <p>Regularly check wallet balances:</p>
      <ol>
        <li>Click "Update Balances"</li>
        <li>Review individual wallet status</li>
        <li>Identify wallets needing funding</li>
        <li>Plan rebalancing if needed</li>
      </ol>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>Profit Withdrawal</h4>
      <p>Move profits to secure storage:</p>
      <ol>
        <li>Set minimum balance to keep (for fees)</li>
        <li>Enter your secure wallet address</li>
        <li>Click "Withdraw Profits"</li>
        <li>Confirm transactions</li>
      </ol>
    </div>

    <div class="success">
      <h3>✅ Best Practices</h3>
      <ul>
        <li>Start with small amounts to test the system</li>
        <li>Use natural timing delays (1-5 seconds between buys)</li>
        <li>Vary purchase amounts for realistic patterns</li>
        <li>Monitor markets and adjust strategies</li>
        <li>Withdraw profits regularly to secure wallets</li>
      </ul>
    </div>
  </div>`;
  }

  async getSecuritySection() {
    return `
  <div class="page-break">
    <h1>5. 🛡️ Security Best Practices</h1>
    
    <div class="warning">
      <h3>🚨 Critical Security Rules</h3>
      <p>Following these rules is essential for protecting your funds. Crypto security requires personal responsibility - there are no "password reset" options!</p>
    </div>

    <h2>❌ What You Should NEVER Do</h2>
    
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>Never Share Private Information</h4>
      <ul>
        <li>Never share private keys with anyone</li>
        <li>Never share seed phrases (12-word recovery phrases)</li>
        <li>Never enter seed phrases on websites</li>
        <li>Never screenshot or photograph private keys</li>
      </ul>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>Never Store Passwords Insecurely</h4>
      <ul>
        <li>Never store passwords in the same folder as wallet files</li>
        <li>Never use the same password for multiple wallet files</li>
        <li>Never save passwords in browser or cloud notes</li>
        <li>Never write passwords on paper near your computer</li>
      </ul>
    </div>

    <div class="step-box">
      <div class="step-number">3</div>
      <h4>Never Trust Unverified Sources</h4>
      <ul>
        <li>Never download the software from unofficial sources</li>
        <li>Never trust "urgent" messages asking for wallet access</li>
        <li>Never click suspicious links in crypto communities</li>
        <li>Never install modified versions of the software</li>
      </ul>
    </div>

    <h2>✅ What You Should ALWAYS Do</h2>
    
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>Backup Everything Multiple Times</h4>
      <ol>
        <li>Copy wallet files to at least 3 different locations</li>
        <li>Use encrypted USB drives for offline backups</li>
        <li>Store backups in different physical locations</li>
        <li>Test backups regularly to ensure they work</li>
      </ol>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>Use Strong, Unique Passwords</h4>
      <ol>
        <li>Generate passwords with at least 16 characters</li>
        <li>Include uppercase, lowercase, numbers, and symbols</li>
        <li>Use a different password for each wallet file</li>
        <li>Store passwords in a reputable password manager</li>
      </ol>
      
      <div class="info">
        <h3>💡 Password Manager Recommendations</h3>
        <ul>
          <li><strong>1Password:</strong> Excellent security and ease of use</li>
          <li><strong>Bitwarden:</strong> Open source and affordable</li>
          <li><strong>LastPass:</strong> Widely used and feature-rich</li>
        </ul>
      </div>
    </div>

    <div class="step-box">
      <div class="step-number">3</div>
      <h4>Test With Small Amounts First</h4>
      <ul>
        <li>Start with 0.01-0.1 SOL for initial testing</li>
        <li>Verify all functions work correctly</li>
        <li>Practice importing wallets</li>
        <li>Test trading with minimal amounts</li>
      </ul>
    </div>

    <h2>🔐 Advanced Security Measures</h2>
    
    <h3>Hardware Wallet Integration</h3>
    <p>For storing large amounts:</p>
    <ul>
      <li><strong>Ledger Nano S/X:</strong> Popular and well-supported</li>
      <li><strong>Trezor Model T:</strong> Open source hardware wallet</li>
      <li><strong>Use for:</strong> Long-term storage of profits</li>
      <li><strong>Not for:</strong> Day-to-day trading operations</li>
    </ul>

    <h3>Multi-Signature Wallets</h3>
    <p>For team operations:</p>
    <ul>
      <li>Require multiple signatures for transactions</li>
      <li>Prevent single points of failure</li>
      <li>Useful for business operations</li>
      <li>More complex but more secure</li>
    </ul>

    <h3>Network Security</h3>
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>Secure Your Connection</h4>
      <ul>
        <li>Use secure WiFi networks only</li>
        <li>Consider using a VPN for trading</li>
        <li>Avoid public WiFi for wallet operations</li>
        <li>Keep your firewall enabled</li>
      </ul>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>Computer Security</h4>
      <ul>
        <li>Keep your operating system updated</li>
        <li>Use reputable antivirus software</li>
        <li>Don't install suspicious software</li>
        <li>Regular malware scans</li>
      </ul>
    </div>

    <h2>🚨 Emergency Procedures</h2>
    
    <h3>If You Suspect Compromise</h3>
    <div class="warning">
      <h3>Immediate Actions</h3>
      <ol>
        <li><strong>Stop all trading immediately</strong></li>
        <li><strong>Transfer funds to secure wallets</strong></li>
        <li><strong>Generate new wallets</strong></li>
        <li><strong>Scan computer for malware</strong></li>
        <li><strong>Change all passwords</strong></li>
      </ol>
    </div>

    <h3>Recovery Planning</h3>
    <p>Before you need it, plan for:</p>
    <ul>
      <li>How to access backups quickly</li>
      <li>Alternative devices for wallet access</li>
      <li>Emergency contact procedures</li>
      <li>Funds recovery processes</li>
    </ul>

    <div class="success">
      <h3>✅ Security Checklist</h3>
      <p>Before starting serious trading:</p>
      <ul>
        <li>☐ Generated wallets with strong passwords</li>
        <li>☐ Backed up wallet files to multiple locations</li>
        <li>☐ Stored passwords in password manager</li>
        <li>☐ Tested wallet import process</li>
        <li>☐ Verified small transactions work</li>
        <li>☐ Set up hardware wallet for profits</li>
        <li>☐ Created emergency recovery plan</li>
      </ul>
    </div>
  </div>`;
  }

  async getTroubleshootingSection() {
    return `
  <div class="page-break">
    <h1>6. 🔧 Troubleshooting Guide</h1>
    
    <div class="info">
      <h3>💡 Quick Diagnosis</h3>
      <p>Most issues can be resolved quickly. This section covers the most common problems and their solutions.</p>
    </div>

    <h2>🚫 Installation Problems</h2>
    
    <h3>Windows Issues</h3>
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>"Windows protected your PC" Message</h4>
      <p><strong>Solution:</strong></p>
      <ol>
        <li>Click "More info" in the warning dialog</li>
        <li>Click "Run anyway" button</li>
        <li>This is normal for new applications</li>
      </ol>
      <div class="screenshot-placeholder">Screenshot: Windows Defender dialog</div>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>"App can't run on this PC" Error</h4>
      <p><strong>Cause:</strong> 32-bit system or old Windows version</p>
      <p><strong>Solution:</strong></p>
      <ul>
        <li>Ensure you have Windows 10 64-bit or later</li>
        <li>Download the correct version for your system</li>
        <li>Update Windows if necessary</li>
      </ul>
    </div>

    <h3>macOS Issues</h3>
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>"App is damaged and can't be opened"</h4>
      <p><strong>Solution:</strong></p>
      <ol>
        <li>Go to System Preferences → Security & Privacy</li>
        <li>Click "Open Anyway" next to the blocked app</li>
        <li>Or right-click the app and select "Open"</li>
      </ol>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>"Developer cannot be verified"</h4>
      <p><strong>Solution:</strong></p>
      <ol>
        <li>Hold Option key and right-click the app</li>
        <li>Select "Open" from the context menu</li>
        <li>Click "Open" in the confirmation dialog</li>
      </ol>
    </div>

    <h3>Linux Issues</h3>
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>AppImage Won't Launch</h4>
      <p><strong>Solution:</strong></p>
      <div class="code-block">
# Make the file executable
chmod +x Solana-Launch-Suite.AppImage

# Install FUSE if needed (Ubuntu/Debian)
sudo apt install fuse

# Try launching from terminal
./Solana-Launch-Suite.AppImage
      </div>
    </div>

    <h2>🔐 Wallet Generation Issues</h2>
    
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>"Generation Failed" Error</h4>
      <p><strong>Common Causes & Solutions:</strong></p>
      <ul>
        <li><strong>Insufficient disk space:</strong> Free up 1GB of space</li>
        <li><strong>Permission issues:</strong> Run as administrator (Windows) or check folder permissions</li>
        <li><strong>Antivirus blocking:</strong> Add exception for the application</li>
      </ul>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>"Invalid Password" When Loading</h4>
      <p><strong>Solutions:</strong></p>
      <ol>
        <li>Double-check password (case-sensitive)</li>
        <li>Try typing instead of copy/paste</li>
        <li>Ensure correct wallet file is selected</li>
        <li>Check if file was corrupted during transfer</li>
      </ol>
    </div>

    <div class="step-box">
      <div class="step-number">3</div>
      <h4>"Cannot Load Wallet File"</h4>
      <p><strong>Troubleshooting Steps:</strong></p>
      <ol>
        <li>Verify file path is correct</li>
        <li>Check file isn't corrupted (size should be >1KB)</li>
        <li>Ensure file has .json extension</li>
        <li>Try copying file to a different location</li>
      </ol>
    </div>

    <h2>💰 Trading Problems</h2>
    
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>"Transaction Failed" Errors</h4>
      <p><strong>Common Causes:</strong></p>
      <ul>
        <li><strong>Insufficient SOL balance:</strong> Add more SOL to wallet</li>
        <li><strong>Network congestion:</strong> Wait and retry</li>
        <li><strong>Invalid token address:</strong> Verify contract address</li>
        <li><strong>Slippage too low:</strong> Increase slippage tolerance</li>
      </ul>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>"RPC Connection Failed"</h4>
      <p><strong>Solutions:</strong></p>
      <ol>
        <li>Check internet connection</li>
        <li>Try changing RPC endpoint in settings</li>
        <li>Wait a few minutes and retry</li>
        <li>Restart the application</li>
      </ol>
    </div>

    <div class="step-box">
      <div class="step-number">3</div>
      <h4>Coordinated Buy Partially Fails</h4>
      <p><strong>Normal Behavior:</strong> Some transactions may fail due to network conditions</p>
      <p><strong>Actions:</strong></p>
      <ol>
        <li>Check which wallets succeeded</li>
        <li>Retry failed wallets individually</li>
        <li>Adjust timing parameters</li>
        <li>Ensure sufficient SOL in all wallets</li>
      </ol>
    </div>

    <h2>🔧 Application Issues</h2>
    
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>Application Won't Start</h4>
      <p><strong>Solutions:</strong></p>
      <ol>
        <li>Restart your computer</li>
        <li>Check if another instance is running</li>
        <li>Run as administrator (Windows)</li>
        <li>Check system requirements</li>
        <li>Reinstall the application</li>
      </ol>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>Interface Looks Broken</h4>
      <p><strong>Solutions:</strong></p>
      <ul>
        <li>Zoom out if interface appears too large</li>
        <li>Maximize the window</li>
        <li>Update graphics drivers</li>
        <li>Restart the application</li>
      </ul>
    </div>

    <div class="step-box">
      <div class="step-number">3</div>
      <h4>Performance Issues</h4>
      <p><strong>Solutions:</strong></p>
      <ul>
        <li>Close other heavy applications</li>
        <li>Ensure sufficient RAM (4GB minimum)</li>
        <li>Check for system updates</li>
        <li>Restart the application</li>
      </ul>
    </div>

    <h2>🆘 Getting Additional Help</h2>
    
    <div class="success">
      <h3>✅ Self-Help Tools</h3>
      <ul>
        <li><strong>Security Audit:</strong> Help → Security Audit</li>
        <li><strong>Connection Test:</strong> Settings → Test Connection</li>
        <li><strong>Log Files:</strong> Help → View Logs</li>
        <li><strong>Reset Settings:</strong> Settings → Reset to Defaults</li>
      </ul>
    </div>

    <div class="info">
      <h3>📧 Contact Support</h3>
      <p>If problems persist:</p>
      <ol>
        <li>Check the FAQ section in the app</li>
        <li>Visit the community forum</li>
        <li>Contact support with:</li>
        <ul>
          <li>Your operating system version</li>
          <li>Application version</li>
          <li>Description of the problem</li>
          <li>Steps you've already tried</li>
          <li>Error messages (screenshot if possible)</li>
        </ul>
      </ol>
    </div>

    <div class="warning">
      <h3>⚠️ What NOT to Share with Support</h3>
      <ul>
        <li>Never share private keys or seed phrases</li>
        <li>Never share wallet passwords</li>
        <li>Never send wallet files via email</li>
        <li>Only share error messages and general issues</li>
      </ul>
    </div>
  </div>`;
  }

  async getAdvancedSection() {
    return `
  <div class="page-break">
    <h1>7. ⚡ Advanced Features</h1>
    
    <div class="info">
      <h3>🎯 Who This Section Is For</h3>
      <p>Advanced features are for experienced users who want maximum control and customization. Basic users can skip this section.</p>
    </div>

    <h2>🖥️ Command Line Interface</h2>
    
    <h3>Installation</h3>
    <p>The CLI tools are included with the desktop application:</p>
    <div class="code-block">
# Navigate to installation directory
cd "C:\\Program Files\\Solana Launch Suite"  # Windows
cd "/Applications/Solana Launch Suite.app/Contents/Resources"  # macOS
cd "~/Applications/solana-launch-suite"  # Linux

# Run CLI commands
node tools/wallet-cli.js --help
    </div>

    <h3>CLI Commands</h3>
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>Generate Wallets</h4>
      <div class="code-block">
# Generate 10 wallets with password
node tools/wallet-cli.js generate --count 10 --password "mySecurePass123"

# Generate with auto password
node tools/wallet-cli.js generate --count 5

# Custom output directory
node tools/wallet-cli.js generate --count 10 --output "./my-wallets"
      </div>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>Master Wallet</h4>
      <div class="code-block">
# Generate master wallet
node tools/wallet-cli.js master --password "masterPass456"

# Generate to specific directory
node tools/wallet-cli.js master --output "./secure-folder"
      </div>
    </div>

    <div class="step-box">
      <div class="step-number">3</div>
      <h4>File Management</h4>
      <div class="code-block">
# List all wallet files
node tools/wallet-cli.js list

# Load and validate file
node tools/wallet-cli.js load --file "launch_wallets_2024.json" --password "myPass"

# Run security audit
node tools/wallet-cli.js audit

# Interactive demo
node tools/wallet-cli.js demo
      </div>
    </div>

    <h2>🔧 Custom Configuration</h2>
    
    <h3>RPC Endpoints</h3>
    <p>Configure custom RPC endpoints for better performance:</p>
    <div class="code-block">
// In config file or settings
{
  "rpcUrl": "https://your-premium-rpc.com",
  "wsUrl": "wss://your-premium-ws.com",
  "commitment": "confirmed",
  "timeout": 30000
}
    </div>

    <h3>Trading Parameters</h3>
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>Advanced Buy Settings</h4>
      <ul>
        <li><strong>Slippage Tolerance:</strong> 1-20% (default: 10%)</li>
        <li><strong>Priority Fee:</strong> Micro-lamports for faster execution</li>
        <li><strong>Max Retries:</strong> Number of retry attempts</li>
        <li><strong>Retry Delay:</strong> Milliseconds between retries</li>
      </ul>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>Timing Configuration</h4>
      <div class="code-block">
{
  "coordinatedBuy": {
    "baseDelay": 1000,        // Base delay in ms
    "randomDelay": 2000,      // Additional random delay
    "maxConcurrent": 5,       // Max simultaneous transactions
    "batchSize": 3            // Wallets per batch
  }
}
      </div>
    </div>

    <h2>📊 Analytics & Reporting</h2>
    
    <h3>Custom Reports</h3>
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>Generate Trading Report</h4>
      <p>Create detailed performance reports:</p>
      <ul>
        <li>Profit/loss analysis</li>
        <li>Success rate statistics</li>
        <li>Wallet performance ranking</li>
        <li>Transaction history</li>
      </ul>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>Export Options</h4>
      <ul>
        <li><strong>CSV:</strong> For spreadsheet analysis</li>
        <li><strong>JSON:</strong> For programmatic processing</li>
        <li><strong>PDF:</strong> For presentation/reporting</li>
      </ul>
    </div>

    <h3>Performance Monitoring</h3>
    <p>Track key metrics:</p>
    <ul>
      <li><strong>Response Time:</strong> Transaction execution speed</li>
      <li><strong>Success Rate:</strong> Percentage of successful trades</li>
      <li><strong>Profit Margins:</strong> Average profit per trade</li>
      <li><strong>Gas Efficiency:</strong> Transaction fee optimization</li>
    </ul>

    <h2>🔄 Automation & Scripting</h2>
    
    <h3>Automated Trading Rules</h3>
    <div class="step-box">
      <div class="step-number">1</div>
      <h4>Profit Taking Rules</h4>
      <div class="code-block">
{
  "profitTaking": {
    "enabled": true,
    "rules": [
      {
        "trigger": "profit_percent",
        "value": 50,
        "action": "sell_percent",
        "amount": 25
      },
      {
        "trigger": "profit_percent", 
        "value": 100,
        "action": "sell_percent",
        "amount": 50
      }
    ]
  }
}
      </div>
    </div>

    <div class="step-box">
      <div class="step-number">2</div>
      <h4>Stop Loss Protection</h4>
      <div class="code-block">
{
  "stopLoss": {
    "enabled": true,
    "percentage": -20,
    "action": "sell_all",
    "cooldown": 300000  // 5 minutes
  }
}
      </div>
    </div>

    <h3>Custom Scripts</h3>
    <p>For developers who want to extend functionality:</p>
    <div class="code-block">
const { WalletGenerator } = require('./src/services/walletGenerator');
const { LaunchTradingManager } = require('./src/services/launchTradingManager');

// Custom wallet generation
const generator = new WalletGenerator({
  outputDir: './custom-wallets',
  encryptionStrength: 'maximum'
});

// Custom trading logic
const trading = new LaunchTradingManager();
await trading.loadWallets('my-wallets.json', 'password');
await trading.customStrategy({
  buyPattern: 'fibonacci',
  sellPattern: 'trailing_stop',
  riskLevel: 'conservative'
});
    </div>

    <h2>🔒 Enhanced Security</h2>
    
    <h3>Multi-Signature Integration</h3>
    <p>For team operations:</p>
    <ul>
      <li>Require multiple approvals for large transactions</li>
      <li>Distribute control among team members</li>
      <li>Prevent single points of failure</li>
      <li>Audit trails for all operations</li>
    </ul>

    <h3>Hardware Security Module (HSM)</h3>
    <p>For enterprise security:</p>
    <ul>
      <li>Hardware-based key storage</li>
      <li>Tamper-resistant operations</li>
      <li>Compliance with security standards</li>
      <li>Professional-grade protection</li>
    </ul>

    <h2>🌐 API Integration</h2>
    
    <h3>REST API Endpoints</h3>
    <p>For custom integrations:</p>
    <div class="code-block">
POST /api/v1/wallets/generate
GET  /api/v1/wallets/balance/{address}
POST /api/v1/trading/buy
POST /api/v1/trading/sell
GET  /api/v1/stats/performance
    </div>

    <h3>WebSocket Feeds</h3>
    <p>Real-time data streams:</p>
    <ul>
      <li>Transaction confirmations</li>
      <li>Balance updates</li>
      <li>Trading signals</li>
      <li>Performance metrics</li>
    </ul>

    <div class="warning">
      <h3>⚠️ Advanced Feature Disclaimer</h3>
      <p>Advanced features require technical knowledge and carry additional risks. Always test thoroughly with small amounts before using in production.</p>
    </div>
  </div>`;
  }

  async getAppendixSection() {
    return `
  <div class="page-break">
    <h1>8. 📚 Appendix & References</h1>
    
    <h2>🔗 Important Links</h2>
    
    <div class="info">
      <h3>Official Resources</h3>
      <ul>
        <li><strong>Website:</strong> https://your-official-website.com</li>
        <li><strong>Documentation:</strong> https://docs.your-website.com</li>
        <li><strong>Support:</strong> support@your-website.com</li>
        <li><strong>Community:</strong> https://discord.gg/your-discord</li>
      </ul>
    </div>

    <h3>Solana Resources</h3>
    <ul>
      <li><strong>Solana Documentation:</strong> https://docs.solana.com</li>
      <li><strong>Solana Explorer:</strong> https://explorer.solana.com</li>
      <li><strong>Phantom Wallet:</strong> https://phantom.app</li>
      <li><strong>Solflare Wallet:</strong> https://solflare.com</li>
    </ul>

    <h3>Security Resources</h3>
    <ul>
      <li><strong>BIP39 Specification:</strong> https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki</li>
      <li><strong>Hardware Wallets:</strong> https://ledger.com, https://trezor.io</li>
      <li><strong>Password Managers:</strong> https://1password.com, https://bitwarden.com</li>
    </ul>

    <h2>📋 Technical Specifications</h2>
    
    <h3>Cryptographic Standards</h3>
    <ul>
      <li><strong>Key Generation:</strong> Ed25519 elliptic curve</li>
      <li><strong>Entropy Source:</strong> Cryptographically secure random number generator</li>
      <li><strong>Mnemonic:</strong> BIP39 12-word phrases</li>
      <li><strong>Key Derivation:</strong> BIP44 standard (m/44'/501'/0'/0')</li>
      <li><strong>Encryption:</strong> AES-256-CBC with PBKDF2 (100,000 iterations)</li>
    </ul>

    <h3>File Formats</h3>
    <div class="code-block">
// Wallet file structure
{
  "metadata": {
    "version": "1.0.0",
    "created": "2024-01-15T10:30:00.000Z",
    "purpose": "Token Launch Trading",
    "totalWallets": 10,
    "warning": "KEEP THIS FILE SECURE"
  },
  "wallets": [
    {
      "id": 1,
      "name": "LaunchWallet_1", 
      "address": "Base58 encoded address",
      "privateKey": "Base64 encoded private key",
      "mnemonic": "12 word seed phrase",
      "created": "2024-01-15T10:30:00.000Z"
    }
  ]
}
    </div>

    <h2>🔧 System Requirements</h2>
    
    <h3>Minimum Requirements</h3>
    <ul>
      <li><strong>RAM:</strong> 4GB</li>
      <li><strong>Storage:</strong> 500MB free space</li>
      <li><strong>Network:</strong> Broadband internet connection</li>
      <li><strong>OS:</strong> Windows 10, macOS 10.15, Ubuntu 18.04 (or equivalent)</li>
    </ul>

    <h3>Recommended Requirements</h3>
    <ul>
      <li><strong>RAM:</strong> 8GB or more</li>
      <li><strong>Storage:</strong> 2GB free space (SSD preferred)</li>
      <li><strong>Network:</strong> Fast broadband for optimal trading</li>
      <li><strong>OS:</strong> Latest versions for best security</li>
    </ul>

    <h2>❓ Frequently Asked Questions</h2>
    
    <div class="step-box">
      <div class="step-number">Q</div>
      <h4>Is my crypto safe with this software?</h4>
      <p><strong>A:</strong> Yes, when used properly. All wallet generation happens locally on your device. Your private keys never leave your computer unless you explicitly export them. The software uses military-grade encryption and follows industry best practices.</p>
    </div>

    <div class="step-box">
      <div class="step-number">Q</div>
      <h4>Can I use this on multiple computers?</h4>
      <p><strong>A:</strong> Yes, you can install the software on multiple computers. Wallet files are portable - just copy them securely between devices. Remember to keep passwords secure and synchronized.</p>
    </div>

    <div class="step-box">
      <div class="step-number">Q</div>
      <h4>What happens if I forget my password?</h4>
      <p><strong>A:</strong> Unfortunately, there's no password recovery. This is by design for security. If you lose your password, you cannot access encrypted wallet files. This is why secure password storage is critical.</p>
    </div>

    <div class="step-box">
      <div class="step-number">Q</div>
      <h4>Do I need internet for wallet generation?</h4>
      <p><strong>A:</strong> No, wallet generation works completely offline. You only need internet for trading operations and balance checking. This ensures maximum security during wallet creation.</p>
    </div>

    <div class="step-box">
      <div class="step-number">Q</div>
      <h4>How many wallets can I generate?</h4>
      <p><strong>A:</strong> You can generate 1-50 wallets per batch through the GUI, or unlimited through the CLI. For most use cases, 10-20 wallets are sufficient.</p>
    </div>

    <div class="step-box">
      <div class="step-number">Q</div>
      <h4>Is this legal to use?</h4>
      <p><strong>A:</strong> The software itself is legal - it's just a wallet generator and trading tool. However, you're responsible for following your local regulations and platform terms of service. Use responsibly and ethically.</p>
    </div>

    <h2>📞 Support & Contact Information</h2>
    
    <div class="success">
      <h3>✅ Getting Help</h3>
      <p>If you need assistance:</p>
      <ol>
        <li><strong>Check this guide first</strong> - Most questions are answered here</li>
        <li><strong>Try the troubleshooting section</strong> - Common issues and solutions</li>
        <li><strong>Use built-in help</strong> - The app has context-sensitive help</li>
        <li><strong>Contact support</strong> - For complex issues</li>
      </ol>
    </div>

    <div class="info">
      <h3>📧 Contact Methods</h3>
      <ul>
        <li><strong>Email Support:</strong> support@your-website.com</li>
        <li><strong>Community Discord:</strong> https://discord.gg/your-server</li>
        <li><strong>Documentation:</strong> https://docs.your-website.com</li>
        <li><strong>Video Tutorials:</strong> https://youtube.com/your-channel</li>
      </ul>
    </div>

    <h2>📄 License & Legal</h2>
    
    <h3>Software License</h3>
    <p>This software is provided under a commercial license. Key points:</p>
    <ul>
      <li>Licensed for personal and commercial use</li>
      <li>No reverse engineering or redistribution</li>
      <li>Updates included with license</li>
      <li>Support included during license period</li>
    </ul>

    <h3>Disclaimer</h3>
    <div class="warning">
      <h3>⚠️ Important Legal Notice</h3>
      <p>This software is provided "as is" without warranty of any kind. Cryptocurrency trading involves substantial risk of loss. You are solely responsible for:</p>
      <ul>
        <li>Securing your wallets and private keys</li>
        <li>Following applicable laws and regulations</li>
        <li>Understanding the risks of crypto trading</li>
        <li>Platform terms of service compliance</li>
      </ul>
      <p>The developers are not responsible for any financial losses, security breaches, or legal issues arising from software use.</p>
    </div>

    <h2>🙏 Acknowledgments</h2>
    
    <p>This software was built using:</p>
    <ul>
      <li><strong>Electron:</strong> Cross-platform desktop framework</li>
      <li><strong>React:</strong> User interface library</li>
      <li><strong>Solana Web3.js:</strong> Solana blockchain interaction</li>
      <li><strong>BIP39:</strong> Mnemonic phrase generation</li>
      <li><strong>Node.js:</strong> JavaScript runtime</li>
    </ul>

    <p>Special thanks to the Solana developer community for their tools and resources.</p>

    <div style="text-align: center; margin-top: 60px; padding: 40px; background: #F7FAFC; border-radius: 12px;">
      <h2>🔐 Your keys, your crypto, your control.</h2>
      <p style="font-size: 18px; color: #4A5568; margin-top: 20px;">
        Thank you for choosing Solana Launch Suite!
      </p>
      <p style="color: #718096; margin-top: 10px;">
        Trade safely, profit responsibly.
      </p>
    </div>
  </div>`;
  }

  async generateMarkdownContent() {
    // Generate a simpler markdown version for easy editing
    return `# Solana Launch Suite - Complete User Guide

## Table of Contents
1. [Quick Start Guide](#quick-start)
2. [Installation Instructions](#installation)
3. [Wallet Generator](#wallet-generator)
4. [Launch Trading Manager](#launch-trading)
5. [Security Best Practices](#security)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Features](#advanced)
8. [FAQ & Support](#faq)

---

## Quick Start Guide {#quick-start}

### What You'll Accomplish
In just 10 minutes, you'll have secure wallets generated and be ready for token launch trading!

### Step 1: Download & Install
- **Windows:** Solana-Launch-Suite-Setup.exe
- **Mac:** Solana-Launch-Suite.dmg  
- **Linux:** Solana-Launch-Suite.AppImage

### Step 2: First Launch
1. Double-click the installed application
2. You'll see a welcome screen
3. Click "Get Started!" to begin

### Step 3: Generate Your First Wallets
1. Navigate to "Wallet Generator" tab
2. Set wallet count (start with 5-10)
3. Enter a secure password
4. Click "Generate Launch Wallets"
5. Save the file securely

**⚠️ Critical First Steps:**
- Backup wallet files immediately
- Store passwords in password manager
- Test with small amounts first

---

## Installation Instructions {#installation}

### System Requirements
- **RAM:** 4GB minimum, 8GB recommended
- **Storage:** 500MB free space
- **OS:** Windows 10+, macOS 10.15+, Ubuntu 18.04+

### Windows Installation
1. Download Solana-Launch-Suite-Setup.exe
2. Run installer (click "Run anyway" if Windows blocks it)
3. Follow installation wizard
4. Launch from Desktop shortcut

### macOS Installation  
1. Download Solana-Launch-Suite.dmg
2. Drag app to Applications folder
3. Right-click and "Open" on first launch
4. Allow in Security & Privacy if needed

### Linux Installation
\`\`\`bash
# Make executable and run
chmod +x Solana-Launch-Suite.AppImage
./Solana-Launch-Suite.AppImage
\`\`\`

---

## Wallet Generator {#wallet-generator}

### Security Features
- 100% local generation
- AES-256 encryption  
- BIP44 compliance
- Zero server storage

### Generate Launch Wallets
1. Open "Wallet Generator" tab
2. Set number of wallets (5-50)
3. Enter strong password
4. Click "Generate Launch Wallets"
5. Backup encrypted file

### Generate Master Wallet
1. Go to "Master Developer Wallet" section
2. Enter strong password
3. Click "Generate Master Wallet"
4. Use for funding operations

### Import into Wallets
**Phantom Wallet:**
1. Settings → Add Account
2. Import Private Key/Seed Phrase
3. Enter 12-word phrase or private key

**Solflare Wallet:**
1. Access Wallet → Import Wallet
2. Enter seed phrase
3. Set password and save

---

## Launch Trading Manager {#launch-trading}

### Setup Trading
1. Load wallet file with password
2. Fund wallets from master wallet
3. Set target token address
4. Configure platform (Pump.fun, etc.)

### Coordinated Buying
1. Select wallets to use
2. Set SOL amount per wallet
3. Configure timing delays (1-5 seconds)
4. Execute coordinated buy

### Profit Taking
- **Manual:** Sell 25%, 50%, 75%, or 100%
- **Automated:** Set profit targets and stop losses
- **Emergency:** Instant sell all positions

### Monitoring
- Real-time balance tracking
- Profit/loss calculations
- Success rate statistics
- Individual wallet performance

---

## Security Best Practices {#security}

### Never Do ❌
- Share private keys or seed phrases
- Store passwords with wallet files
- Use same password for multiple files
- Trust suspicious links or downloads

### Always Do ✅
- Backup files to multiple locations
- Use strong, unique passwords
- Store passwords in password manager
- Test with small amounts first
- Use hardware wallets for large amounts

### Emergency Procedures
If compromised:
1. Stop all trading immediately
2. Transfer funds to secure wallets
3. Generate new wallets
4. Scan for malware
5. Change all passwords

---

## Troubleshooting {#troubleshooting}

### Installation Issues
**Windows "Protected your PC":**
- Click "More info" → "Run anyway"

**macOS "Cannot verify developer":**
- Right-click app → "Open"
- Allow in Security & Privacy

### Wallet Issues
**"Generation Failed":**
- Check disk space (need 1GB)
- Run as administrator
- Check antivirus settings

**"Invalid Password":**
- Verify password case-sensitivity
- Try typing instead of paste
- Check file isn't corrupted

### Trading Issues
**"Transaction Failed":**
- Check SOL balance
- Verify token address
- Wait for network congestion to clear
- Increase slippage tolerance

---

## Advanced Features {#advanced}

### Command Line Interface
\`\`\`bash
# Generate wallets
node tools/wallet-cli.js generate --count 10 --password "mypass"

# Generate master wallet  
node tools/wallet-cli.js master --password "mypass"

# List files
node tools/wallet-cli.js list

# Security audit
node tools/wallet-cli.js audit
\`\`\`

### Custom Configuration
- RPC endpoints for better performance
- Advanced trading parameters
- Automated profit-taking rules
- Custom timing patterns

### API Integration
- REST API endpoints
- WebSocket data feeds
- Custom script integration
- Multi-signature support

---

## FAQ & Support {#faq}

### Common Questions

**Q: Is my crypto safe?**
A: Yes, when used properly. All generation is local, using military-grade encryption.

**Q: Can I use on multiple computers?**
A: Yes, wallet files are portable. Just copy them securely.

**Q: What if I forget my password?**
A: There's no password recovery. This is by design for security.

**Q: Do I need internet for generation?**
A: No, wallet generation works completely offline.

### Getting Help
1. Check this guide first
2. Try troubleshooting section
3. Use built-in help features
4. Contact support if needed

### Contact Information
- **Email:** support@your-website.com
- **Discord:** https://discord.gg/your-server
- **Documentation:** https://docs.your-website.com

---

## Legal & Disclaimer

⚠️ **Important Notice:**
This software is provided "as is" without warranty. Cryptocurrency trading involves substantial risk. You are responsible for:
- Securing your wallets and keys
- Following applicable laws
- Understanding trading risks
- Platform compliance

---

## 🔐 Your keys, your crypto, your control.

Thank you for choosing Solana Launch Suite! Trade safely, profit responsibly.
`;
  }
}

// Run the generator
if (require.main === module) {
  const generator = new PDFGuideGenerator();
  generator.generate().catch(console.error);
}

module.exports = PDFGuideGenerator;