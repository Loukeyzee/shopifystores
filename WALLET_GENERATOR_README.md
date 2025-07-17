# 🔐 Secure Wallet Generator

Generate completely secure wallets for Solana token launch trading. All wallets are created locally on your device with industry-standard encryption. **Nothing is stored on our servers** - you have complete control and ownership.

## 🛡️ Security Features

- **100% Local Generation** - Wallets created entirely on your device
- **Industry Standard Encryption** - AES-256-CBC with PBKDF2 key derivation
- **BIP44 Compliance** - Standard wallet derivation paths
- **128-bit Entropy** - Cryptographically secure random generation
- **Zero Server Storage** - Private keys never leave your machine
- **Password Protection** - Optional user passwords or auto-generated secure passwords

## 🚀 Quick Start

### GUI Application

1. **Open the Application**
   - Launch the Solana All-in-One Suite
   - Navigate to the "Wallet Generator" tab

2. **Generate Launch Trading Wallets**
   - Set number of wallets (1-50)
   - Enter optional password or use auto-generated
   - Click "Generate Launch Wallets"
   - Securely save the generated file and password

3. **Generate Master Wallet**
   - Click "Generate Master Wallet"
   - This will be your main funding and profit collection wallet
   - Keep extremely secure!

### Command Line Interface

```bash
# Generate 10 launch trading wallets
node tools/wallet-cli.js generate --count 10 --password mySecurePass123

# Generate master wallet
node tools/wallet-cli.js master --password mySecurePass123

# List generated wallet files
node tools/wallet-cli.js list

# Load and validate wallet file
node tools/wallet-cli.js load --file launch_wallets_2024.json --password mySecurePass123

# Run security audit
node tools/wallet-cli.js audit

# Interactive demo
node tools/wallet-cli.js demo
```

## 📁 File Structure

Generated files are stored in the `generated-wallets/` directory:

```
generated-wallets/
├── launch_wallets_2024-01-15T10-30-00.json     # Launch trading wallets
├── master_wallets_2024-01-15T10-30-00.json     # Master developer wallet
└── README_SECURITY.md                          # Security instructions
```

## 🎯 Launch Trading Workflow

### 1. Initial Setup
```javascript
// Generate wallets
const walletGenerator = new WalletGenerator();

// Generate 10 launch trading wallets
const launchWallets = await walletGenerator.generateLaunchWallets(10, 'yourPassword');

// Generate master wallet for funding
const masterWallet = await walletGenerator.generateMasterWallet('yourPassword');
```

### 2. Load Wallets for Trading
```javascript
const tradingManager = new LaunchTradingManager();

// Load wallets from encrypted file
const wallets = await tradingManager.loadWallets('launch_wallets_file.json', 'yourPassword');

// Set target token
tradingManager.setToken('YOUR_TOKEN_ADDRESS', 'pump.fun');
```

### 3. Execute Coordinated Trading
```javascript
// Coordinated buy with multiple wallets
const buyResults = await tradingManager.coordinatedBuy([1, 2, 3, 4, 5], 0.1); // 5 wallets, 0.1 SOL each

// Sell 50% when profitable
const sellResults = await tradingManager.sellAll(null, 50); // 50% sell

// Emergency sell all tokens
const emergencyResults = await tradingManager.emergencySellAll();

// Withdraw profits to master wallet
const withdrawResults = await tradingManager.withdrawProfits('MASTER_WALLET_ADDRESS');
```

## 🔒 Security Best Practices

### ❌ NEVER DO

- **Never share private keys or seed phrases** with anyone
- **Never store passwords with wallet files** in the same location
- **Never use the same password** for multiple wallet files
- **Never store large amounts** in generated trading wallets
- **Never trust screenshots** or digital copies of sensitive information

### ✅ ALWAYS DO

- **Backup wallet files** in multiple secure locations (USB drives, encrypted cloud storage)
- **Use strong, unique passwords** for each wallet file
- **Test with small amounts** before using for main operations
- **Store passwords separately** from wallet files (password manager recommended)
- **Withdraw profits regularly** to secure cold storage
- **Use hardware wallets** for storing large amounts long-term

### 🔐 Wallet Import Guide

#### Phantom Wallet
1. Open Phantom wallet extension/app
2. Click Settings → "Add Account"
3. Select "Import Private Key" or "Import from Seed Phrase"
4. Enter the mnemonic phrase (12 words) or private key
5. Name your wallet and save

#### Solflare Wallet
1. Open Solflare app
2. Click "Access Wallet"
3. Select "Import Wallet"
4. Enter your 12-word mnemonic phrase
5. Set a password and save

#### Programming Use
```javascript
const { Keypair } = require('@solana/web3.js');
const bip39 = require('bip39');

// From private key
const privateKeyArray = Buffer.from(privateKey, 'base64');
const keypair = Keypair.fromSecretKey(privateKeyArray);

// From mnemonic phrase
const seed = bip39.mnemonicToSeedSync(mnemonic);
const keypair = Keypair.fromSeed(seed.slice(0, 32));
```

## 💰 Trading Strategies

### Coordinated Launch Buying
```javascript
// Strategy: Multiple wallets buy simultaneously with delays
const walletIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const amountPerWallet = 0.1; // 0.1 SOL each

const results = await tradingManager.coordinatedBuy(
  walletIds, 
  amountPerWallet,
  { delay: 1000 } // 1 second between purchases
);
```

### Profit Taking
```javascript
// Set up automatic profit taking
const profitTakingInterval = await tradingManager.setupProfitTaking(
  100, // Take profit at 100% gain
  -20  // Stop loss at 20% loss
);

// Manual profit taking
await tradingManager.sellAll(null, 25); // Sell 25% of all positions
await tradingManager.sellAll(null, 50); // Sell 50% of all positions
await tradingManager.sellAll(null, 100); // Sell everything
```

### Risk Management
```javascript
// Check wallet balances
const stats = tradingManager.getTradingStats();
console.log(`Total profit: ${stats.totalProfit.toFixed(4)} SOL`);
console.log(`Success rate: ${stats.successRate.toFixed(2)}%`);

// Emergency exit
if (stats.totalProfit < -5) { // If losing more than 5 SOL
  await tradingManager.emergencySellAll();
}

// Regular profit withdrawal
if (stats.totalProfit > 10) { // If profit > 10 SOL
  await tradingManager.withdrawProfits('SECURE_WALLET_ADDRESS');
}
```

## 📊 File Formats

### Launch Wallets File Structure
```json
{
  "metadata": {
    "created": "2024-01-15T10:30:00.000Z",
    "purpose": "Token Launch Trading",
    "totalWallets": 10,
    "warning": "KEEP THIS FILE SECURE - Contains private keys and seed phrases"
  },
  "wallets": [
    {
      "id": 1,
      "name": "LaunchWallet_1",
      "address": "ABC123...",
      "privateKey": "base64EncodedKey...",
      "mnemonic": "word1 word2 word3 ... word12",
      "created": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Master Wallet File Structure
```json
{
  "metadata": {
    "type": "MASTER_WALLET",
    "created": "2024-01-15T10:30:00.000Z",
    "purpose": "Main developer wallet for token launches",
    "warning": "CRITICAL: This is your main wallet - Keep extremely secure!"
  },
  "wallet": {
    "name": "Master_Developer_Wallet",
    "address": "XYZ789...",
    "privateKey": "base64EncodedKey...",
    "mnemonic": "word1 word2 word3 ... word12",
    "created": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🔧 Advanced Configuration

### Custom RPC Endpoints
```javascript
const walletGenerator = new WalletGenerator({
  rpcUrl: 'https://your-custom-rpc.com',
  outputDir: './custom-wallet-dir'
});
```

### Export Options
```javascript
// Export to CSV for spreadsheet management
await walletGenerator.exportWallets(wallets, 'csv');

// Export to TXT for simple viewing
await walletGenerator.exportWallets(wallets, 'txt');
```

### Bulk Operations
```javascript
// Fund all wallets from master
await tradingManager.fundWalletsFromMaster(
  'master_wallet_file.json',
  'masterPassword',
  0.1 // 0.1 SOL per wallet
);

// Check all balances
const balances = await tradingManager.checkAllBalances(wallets);
```

## 🛠️ Troubleshooting

### Common Issues

**"Invalid password" error**
- Double-check the password is correct
- Ensure you're using the same password used for encryption
- Check for typos or case sensitivity

**"Wallet generation failed"**
- Ensure sufficient disk space
- Check write permissions to output directory
- Verify Node.js version (requires 16+)

**"Cannot load wallet file"**
- Verify the file path is correct
- Ensure the file hasn't been corrupted
- Check file permissions

**"Transaction failed"**
- Verify wallet has sufficient SOL balance
- Check network connectivity
- Ensure RPC endpoint is responsive

### Getting Help

1. **Security Audit**: Run `node tools/wallet-cli.js audit` to verify setup
2. **Demo Mode**: Try `node tools/wallet-cli.js demo` for guided walkthrough
3. **File Validation**: Use `node tools/wallet-cli.js load` to test wallet files

## ⚠️ Important Disclaimers

- **Testing**: Always test with small amounts before using large sums
- **Responsibility**: You are fully responsible for wallet security and fund management
- **Backup**: Create multiple backups of wallet files and passwords
- **Updates**: Keep the software updated for latest security improvements
- **Legal**: Ensure compliance with local regulations regarding cryptocurrency trading

## 🎯 Example Use Cases

### Small Developer (5-10 wallets)
- Generate 5 launch wallets for organic buying pattern
- Use 0.05-0.1 SOL per wallet for micro-purchases
- Perfect for testing new token launches

### Medium Project (10-25 wallets)
- Generate 15 wallets for coordinated launch support
- Use varying amounts (0.1-0.5 SOL) for natural appearance
- Implement staggered buying with 1-5 second delays

### Large Operation (25-50 wallets)
- Generate 50 wallets for comprehensive launch protection
- Use sophisticated trading patterns and profit-taking strategies
- Implement advanced risk management and monitoring

---

**Remember: With great power comes great responsibility. Use these tools ethically and in compliance with platform terms of service and local regulations.**

🔐 **Your keys, your crypto, your responsibility.**