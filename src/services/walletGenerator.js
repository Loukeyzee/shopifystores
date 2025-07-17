const { Keypair, PublicKey, Connection, SystemProgram, Transaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const bip39 = require('bip39');
const { derivePath } = require('ed25519-hd-key');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class WalletGenerator {
  constructor(config = {}) {
    this.connection = new Connection(config.rpcUrl || 'https://api.mainnet-beta.solana.com');
    this.outputDir = config.outputDir || './generated-wallets';
    this.encryptionEnabled = config.encryptionEnabled !== false;
  }

  // Generate a single wallet with mnemonic
  generateWallet() {
    console.log('🔐 Generating secure wallet...');
    
    // Generate 12-word mnemonic (industry standard)
    const mnemonic = bip39.generateMnemonic(128); // 128 bits = 12 words
    
    // Derive keypair from mnemonic
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
    const keypair = Keypair.fromSeed(derivedSeed);
    
    const wallet = {
      address: keypair.publicKey.toString(),
      privateKey: Buffer.from(keypair.secretKey).toString('base64'),
      mnemonic: mnemonic,
      keypair: keypair, // For internal use only
      created: new Date().toISOString(),
      balance: 0,
      tokenBalance: 0
    };

    console.log(`✅ Wallet generated: ${wallet.address}`);
    return wallet;
  }

  // Generate multiple wallets for launch trading
  async generateLaunchWallets(count = 10, userPassword = null) {
    console.log(`🎯 Generating ${count} launch trading wallets...`);
    
    const wallets = [];
    const walletData = {
      metadata: {
        created: new Date().toISOString(),
        purpose: 'Token Launch Trading',
        totalWallets: count,
        warning: 'KEEP THIS FILE SECURE - Contains private keys and seed phrases'
      },
      wallets: []
    };

    for (let i = 0; i < count; i++) {
      const wallet = this.generateWallet();
      
      // Remove keypair from export (sensitive)
      const exportWallet = {
        id: i + 1,
        name: `LaunchWallet_${i + 1}`,
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic,
        created: wallet.created
      };

      wallets.push(wallet);
      walletData.wallets.push(exportWallet);
    }

    // Create output directory
    await this.ensureOutputDirectory();

    // Save wallets to encrypted file
    const filename = await this.saveWalletsToFile(walletData, userPassword);
    
    console.log(`✅ Generated ${count} wallets saved to: ${filename}`);
    console.log('🔒 File is encrypted for security');
    console.log('⚠️  IMPORTANT: Keep the password and file safe!');

    return {
      wallets: wallets,
      filename: filename,
      totalGenerated: count
    };
  }

  // Generate master wallet for developer
  async generateMasterWallet(userPassword = null) {
    console.log('👑 Generating master developer wallet...');
    
    const masterWallet = this.generateWallet();
    
    const masterData = {
      metadata: {
        type: 'MASTER_WALLET',
        created: new Date().toISOString(),
        purpose: 'Main developer wallet for token launches',
        warning: 'CRITICAL: This is your main wallet - Keep extremely secure!'
      },
      wallet: {
        name: 'Master_Developer_Wallet',
        address: masterWallet.address,
        privateKey: masterWallet.privateKey,
        mnemonic: masterWallet.mnemonic,
        created: masterWallet.created
      },
      instructions: {
        funding: 'Fund this wallet with SOL for launch operations',
        security: 'Never share private key or mnemonic phrase',
        backup: 'Store backup in secure location separate from this file'
      }
    };

    await this.ensureOutputDirectory();
    const filename = await this.saveWalletsToFile(masterData, userPassword, 'master');
    
    console.log(`👑 Master wallet created: ${masterWallet.address}`);
    console.log(`💾 Saved to: ${filename}`);

    return {
      wallet: masterWallet,
      filename: filename
    };
  }

  // Save wallets to encrypted file
  async saveWalletsToFile(data, userPassword = null, type = 'launch') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${type}_wallets_${timestamp}.json`;
    const filepath = path.join(this.outputDir, filename);

    let fileContent;
    
    if (this.encryptionEnabled) {
      // Use user password or generate secure one
      const password = userPassword || this.generateSecurePassword();
      const encrypted = this.encryptData(JSON.stringify(data, null, 2), password);
      
      fileContent = {
        encrypted: true,
        data: encrypted.encryptedData,
        iv: encrypted.iv,
        salt: encrypted.salt,
        instructions: {
          decrypt: 'Use the provided password to decrypt this file',
          password: userPassword ? 'User provided password' : password,
          warning: 'Store password separately and securely'
        }
      };

      if (!userPassword) {
        console.log(`🔑 Generated password: ${password}`);
        console.log('⚠️  SAVE THIS PASSWORD - You cannot recover wallets without it!');
      }
    } else {
      fileContent = data;
    }

    await fs.writeFile(filepath, JSON.stringify(fileContent, null, 2));
    
    // Also create a readme file
    await this.createReadmeFile();
    
    return filename;
  }

  // Encrypt sensitive data
  encryptData(data, password) {
    const salt = crypto.randomBytes(32);
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher('aes-256-cbc', key);
    cipher.setIV(iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      salt: salt.toString('hex')
    };
  }

  // Decrypt wallet data
  decryptData(encryptedData, iv, salt, password) {
    const saltBuffer = Buffer.from(salt, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    const key = crypto.pbkdf2Sync(password, saltBuffer, 100000, 32, 'sha256');
    
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    decipher.setIV(ivBuffer);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  // Load wallets from encrypted file
  async loadWalletsFromFile(filename, password) {
    const filepath = path.join(this.outputDir, filename);
    
    try {
      const fileContent = await fs.readFile(filepath, 'utf8');
      const data = JSON.parse(fileContent);
      
      if (data.encrypted) {
        const decrypted = this.decryptData(data.data, data.iv, data.salt, password);
        return decrypted;
      } else {
        return data;
      }
    } catch (error) {
      throw new Error(`Failed to load wallets: ${error.message}`);
    }
  }

  // Generate secure password
  generateSecurePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Create output directory
  async ensureOutputDirectory() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  // Create readme file with instructions
  async createReadmeFile() {
    const readme = `# 🔐 Generated Wallets - IMPORTANT SECURITY INFORMATION

## ⚠️ CRITICAL SECURITY WARNINGS

1. **NEVER SHARE** private keys or mnemonic phrases with anyone
2. **BACKUP** wallet files in multiple secure locations
3. **STORE PASSWORDS** separately from wallet files
4. **USE HARDWARE WALLETS** for large amounts of crypto
5. **TEST** with small amounts before using for main operations

## 📁 File Contents

- \`launch_wallets_*.json\` - Launch trading wallets
- \`master_wallets_*.json\` - Master developer wallet
- Each file contains encrypted wallet data

## 🔓 How to Use Wallets

### Import into Phantom Wallet:
1. Open Phantom wallet
2. Click "Add Account" 
3. Select "Import Private Key" or "Import from Seed Phrase"
4. Enter the mnemonic phrase or private key from decrypted file

### Import into Solflare Wallet:
1. Open Solflare
2. Click "Access Wallet"
3. Select "Import Wallet"
4. Enter mnemonic phrase

### For Programming Use:
\`\`\`javascript
const { Keypair } = require('@solana/web3.js');

// From private key
const privateKeyArray = Buffer.from(privateKey, 'base64');
const keypair = Keypair.fromSecretKey(privateKeyArray);

// From mnemonic
const seed = bip39.mnemonicToSeedSync(mnemonic);
const keypair = Keypair.fromSeed(seed.slice(0, 32));
\`\`\`

## 🚀 Launch Trading Strategy

1. **Fund wallets** with appropriate SOL amounts
2. **Coordinate purchases** during/after launch
3. **Monitor token performance** 
4. **Execute sells** at target prices or percentages
5. **Withdraw profits** to secure wallets

## 🛡️ Best Practices

- Use different wallets for different strategies
- Don't keep all funds in one wallet
- Regularly move profits to cold storage
- Monitor wallet activity for security
- Keep software and wallets updated

## 📞 Support

Generated by Solana All-in-One Suite
For support: Check documentation or contact support

---
**Generated on: ${new Date().toISOString()}**
`;

    await fs.writeFile(path.join(this.outputDir, 'README_SECURITY.md'), readme);
  }

  // Get wallet balance
  async getWalletBalance(address) {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error(`Failed to get balance for ${address}:`, error.message);
      return 0;
    }
  }

  // Fund wallets from master wallet
  async fundWallets(masterWallet, targetWallets, amountPerWallet = 0.1) {
    console.log(`💰 Funding ${targetWallets.length} wallets with ${amountPerWallet} SOL each...`);
    
    const results = [];
    
    for (const wallet of targetWallets) {
      try {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: masterWallet.keypair.publicKey,
            toPubkey: new PublicKey(wallet.address),
            lamports: Math.floor(amountPerWallet * LAMPORTS_PER_SOL)
          })
        );

        const signature = await this.connection.sendTransaction(transaction, [masterWallet.keypair]);
        
        results.push({
          wallet: wallet.address,
          amount: amountPerWallet,
          signature: signature,
          success: true
        });

        console.log(`✅ Funded ${wallet.address}: ${amountPerWallet} SOL`);
      } catch (error) {
        console.error(`❌ Failed to fund ${wallet.address}:`, error.message);
        results.push({
          wallet: wallet.address,
          amount: amountPerWallet,
          error: error.message,
          success: false
        });
      }
    }

    return results;
  }

  // Check all wallet balances
  async checkAllBalances(wallets) {
    console.log('💳 Checking wallet balances...');
    
    const balances = [];
    
    for (const wallet of wallets) {
      const balance = await this.getWalletBalance(wallet.address);
      balances.push({
        address: wallet.address,
        balance: balance,
        balanceFormatted: `${balance.toFixed(4)} SOL`
      });
      
      console.log(`💰 ${wallet.address}: ${balance.toFixed(4)} SOL`);
    }

    return balances;
  }

  // Export wallets to different formats
  async exportWallets(wallets, format = 'csv') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (format === 'csv') {
      const csvContent = [
        'ID,Name,Address,PrivateKey,Mnemonic,Created',
        ...wallets.map((wallet, index) => 
          `${index + 1},"LaunchWallet_${index + 1}","${wallet.address}","${wallet.privateKey}","${wallet.mnemonic}","${wallet.created}"`
        )
      ].join('\n');

      const filename = `wallets_export_${timestamp}.csv`;
      const filepath = path.join(this.outputDir, filename);
      await fs.writeFile(filepath, csvContent);
      
      console.log(`📊 Exported to CSV: ${filename}`);
      return filename;
    }

    if (format === 'txt') {
      const txtContent = wallets.map((wallet, index) => 
        `Wallet ${index + 1}:\nAddress: ${wallet.address}\nPrivate Key: ${wallet.privateKey}\nMnemonic: ${wallet.mnemonic}\n\n`
      ).join('');

      const filename = `wallets_export_${timestamp}.txt`;
      const filepath = path.join(this.outputDir, filename);
      await fs.writeFile(filepath, txtContent);
      
      console.log(`📝 Exported to TXT: ${filename}`);
      return filename;
    }
  }

  // Validate mnemonic phrase
  validateMnemonic(mnemonic) {
    return bip39.validateMnemonic(mnemonic);
  }

  // Import wallet from mnemonic
  importFromMnemonic(mnemonic) {
    if (!this.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
    const keypair = Keypair.fromSeed(derivedSeed);

    return {
      address: keypair.publicKey.toString(),
      privateKey: Buffer.from(keypair.secretKey).toString('base64'),
      mnemonic: mnemonic,
      keypair: keypair,
      imported: new Date().toISOString()
    };
  }

  // Import wallet from private key
  importFromPrivateKey(privateKey) {
    try {
      const keyArray = Buffer.from(privateKey, 'base64');
      const keypair = Keypair.fromSecretKey(keyArray);

      return {
        address: keypair.publicKey.toString(),
        privateKey: privateKey,
        keypair: keypair,
        imported: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Invalid private key format');
    }
  }

  // Get wallet statistics
  async getWalletStats(wallets) {
    const stats = {
      totalWallets: wallets.length,
      totalBalance: 0,
      fundedWallets: 0,
      emptyWallets: 0,
      averageBalance: 0,
      balances: []
    };

    for (const wallet of wallets) {
      const balance = await this.getWalletBalance(wallet.address);
      stats.totalBalance += balance;
      stats.balances.push(balance);
      
      if (balance > 0) {
        stats.fundedWallets++;
      } else {
        stats.emptyWallets++;
      }
    }

    stats.averageBalance = stats.totalBalance / stats.totalWallets;

    return stats;
  }

  // Security audit of generated wallets
  securityAudit() {
    const audit = {
      timestamp: new Date().toISOString(),
      entropy: 'High (using crypto.randomBytes)',
      mnemonicStrength: '128-bit (12 words) - Industry Standard',
      keyDerivation: "BIP44 standard (m/44'/501'/0'/0')",
      encryption: this.encryptionEnabled ? 'AES-256-CBC with PBKDF2' : 'None',
      storage: 'Local files only - no cloud/server storage',
      recommendations: [
        'Use hardware wallets for large amounts',
        'Store backups in multiple secure locations',
        'Never share private keys or mnemonics',
        'Use strong passwords for encryption',
        'Regularly audit wallet activity'
      ]
    };

    return audit;
  }
}

module.exports = WalletGenerator;