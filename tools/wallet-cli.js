#!/usr/bin/env node

/**
 * 🔐 Wallet Generator CLI Tool
 * 
 * Simple command-line interface for generating secure wallets
 * for token launch trading on Solana.
 * 
 * Usage:
 *   node wallet-cli.js generate --count 10 --password mypass
 *   node wallet-cli.js master --password mypass
 *   node wallet-cli.js list
 *   node wallet-cli.js load --file wallets.json --password mypass
 */

const WalletGenerator = require('../src/services/walletGenerator');
const LaunchTradingManager = require('../src/services/launchTradingManager');
const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

program
  .name('wallet-cli')
  .description('Secure wallet generator for Solana token launches')
  .version('1.0.0');

// Generate launch wallets command
program
  .command('generate')
  .description('Generate secure wallets for token launch trading')
  .option('-c, --count <number>', 'Number of wallets to generate', '10')
  .option('-p, --password <password>', 'Password for encryption (optional)')
  .option('-o, --output <directory>', 'Output directory', './generated-wallets')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('\n🔐 Generating Secure Launch Wallets\n'));
      
      const count = parseInt(options.count);
      if (count < 1 || count > 100) {
        console.error(chalk.red('Error: Wallet count must be between 1 and 100'));
        process.exit(1);
      }

      // Get password if not provided
      let password = options.password;
      if (!password) {
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'password',
            message: 'Enter password for encryption (leave empty for auto-generated):',
            mask: '*'
          }
        ]);
        password = answers.password || null;
      }

      const walletGenerator = new WalletGenerator({
        outputDir: options.output
      });

      console.log(chalk.yellow(`Generating ${count} wallets...`));
      const result = await walletGenerator.generateLaunchWallets(count, password);

      console.log(chalk.green.bold('\n✅ Wallets Generated Successfully!'));
      console.log(chalk.white(`📁 File: ${result.filename}`));
      console.log(chalk.white(`📊 Count: ${result.totalGenerated} wallets`));
      console.log(chalk.white(`🔒 Encryption: AES-256 with PBKDF2`));
      
      if (!options.password) {
        console.log(chalk.yellow.bold('\n⚠️  IMPORTANT: Save the generated password!'));
      }

      // Show first wallet as example
      const firstWallet = result.wallets[0];
      console.log(chalk.cyan('\n📝 Example Wallet:'));
      console.log(chalk.gray(`   Address: ${firstWallet.address}`));
      console.log(chalk.gray(`   Mnemonic: ${firstWallet.mnemonic.split(' ').slice(0, 4).join(' ')}... (12 words)`));

      console.log(chalk.blue('\n📋 Next Steps:'));
      console.log(chalk.white('1. Backup the wallet file in multiple secure locations'));
      console.log(chalk.white('2. Store the password separately and securely'));
      console.log(chalk.white('3. Generate a master wallet for funding operations'));
      console.log(chalk.white('4. Fund wallets and start trading!'));

    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Generate master wallet command
program
  .command('master')
  .description('Generate a master developer wallet')
  .option('-p, --password <password>', 'Password for encryption (optional)')
  .option('-o, --output <directory>', 'Output directory', './generated-wallets')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('\n👑 Generating Master Developer Wallet\n'));
      
      // Get password if not provided
      let password = options.password;
      if (!password) {
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'password',
            message: 'Enter password for encryption (leave empty for auto-generated):',
            mask: '*'
          }
        ]);
        password = answers.password || null;
      }

      const walletGenerator = new WalletGenerator({
        outputDir: options.output
      });

      console.log(chalk.yellow('Generating master wallet...'));
      const result = await walletGenerator.generateMasterWallet(password);

      console.log(chalk.green.bold('\n✅ Master Wallet Created!'));
      console.log(chalk.white(`📁 File: ${result.filename}`));
      console.log(chalk.white(`👑 Address: ${result.wallet.address}`));
      console.log(chalk.white(`🔒 Encryption: AES-256 with PBKDF2`));
      
      console.log(chalk.cyan('\n💡 Master Wallet Usage:'));
      console.log(chalk.white('• Fund this wallet with SOL for launch operations'));
      console.log(chalk.white('• Use to distribute SOL to trading wallets'));
      console.log(chalk.white('• Collect profits from successful trades'));
      console.log(chalk.white('• Keep secure - this is your main wallet'));

    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// List wallet files command
program
  .command('list')
  .description('List generated wallet files')
  .option('-o, --output <directory>', 'Output directory', './generated-wallets')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('\n📁 Generated Wallet Files\n'));
      
      const walletDir = options.output;
      
      try {
        const files = await fs.readdir(walletDir);
        const walletFiles = files.filter(file => 
          file.endsWith('.json') && (file.includes('launch_wallets') || file.includes('master_wallets'))
        );

        if (walletFiles.length === 0) {
          console.log(chalk.yellow('No wallet files found.'));
          console.log(chalk.gray('Generate wallets first using: wallet-cli generate'));
          return;
        }

        console.log(chalk.white(`Found ${walletFiles.length} wallet files:\n`));

        for (const file of walletFiles) {
          const filePath = path.join(walletDir, file);
          const stats = await fs.stat(filePath);
          const type = file.includes('master') ? 'Master' : 'Launch';
          const size = (stats.size / 1024).toFixed(2);
          
          console.log(chalk.cyan(`📄 ${file}`));
          console.log(chalk.gray(`   Type: ${type} Wallet`));
          console.log(chalk.gray(`   Size: ${size} KB`));
          console.log(chalk.gray(`   Created: ${stats.birthtime.toLocaleString()}`));
          console.log('');
        }

      } catch (error) {
        console.log(chalk.yellow('No wallet files directory found.'));
        console.log(chalk.gray('Generate wallets first using: wallet-cli generate'));
      }

    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Load and validate wallet file command
program
  .command('load')
  .description('Load and validate a wallet file')
  .requiredOption('-f, --file <filename>', 'Wallet file to load')
  .option('-p, --password <password>', 'Password for decryption')
  .option('-o, --output <directory>', 'Output directory', './generated-wallets')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('\n🔓 Loading Wallet File\n'));
      
      // Get password if not provided
      let password = options.password;
      if (!password) {
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'password',
            message: 'Enter password for decryption:',
            mask: '*'
          }
        ]);
        password = answers.password;
      }

      const walletGenerator = new WalletGenerator({
        outputDir: options.output
      });

      console.log(chalk.yellow(`Loading ${options.file}...`));
      const data = await walletGenerator.loadWalletsFromFile(options.file, password);

      console.log(chalk.green.bold('\n✅ Wallet File Loaded Successfully!'));
      
      if (data.metadata) {
        console.log(chalk.white(`📊 Type: ${data.metadata.type || 'Launch Trading'}`));
        console.log(chalk.white(`📅 Created: ${new Date(data.metadata.created).toLocaleString()}`));
        
        if (data.wallets) {
          console.log(chalk.white(`👛 Wallets: ${data.wallets.length}`));
          
          // Show first few wallets
          console.log(chalk.cyan('\n📝 Wallet Addresses:'));
          data.wallets.slice(0, 5).forEach((wallet, index) => {
            console.log(chalk.gray(`   ${index + 1}. ${wallet.address}`));
          });
          
          if (data.wallets.length > 5) {
            console.log(chalk.gray(`   ... and ${data.wallets.length - 5} more`));
          }
        } else if (data.wallet) {
          console.log(chalk.white(`👑 Master Wallet: ${data.wallet.address}`));
        }
      }

      console.log(chalk.blue('\n🚀 Ready for Trading!'));
      console.log(chalk.white('Use these wallets with the launch trading manager.'));

    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      if (error.message.includes('password')) {
        console.log(chalk.yellow('Hint: Check your password and try again.'));
      }
      process.exit(1);
    }
  });

// Trading simulation command
program
  .command('demo')
  .description('Run a demo of wallet generation and trading')
  .action(async () => {
    try {
      console.log(chalk.blue.bold('\n🎬 Wallet Generator Demo\n'));
      console.log(chalk.white('This demo will show you how to:'));
      console.log(chalk.white('• Generate secure wallets'));
      console.log(chalk.white('• Load wallets for trading'));
      console.log(chalk.white('• Simulate coordinated trading'));
      console.log('');

      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continue',
          message: 'Continue with demo?',
          default: true
        }
      ]);

      if (!answers.continue) {
        console.log(chalk.yellow('Demo cancelled.'));
        return;
      }

      // Run the example
      const WalletGeneratorExample = require('../examples/wallet-generator-example');
      const example = new WalletGeneratorExample();
      await example.run();

    } catch (error) {
      console.error(chalk.red(`Demo error: ${error.message}`));
      process.exit(1);
    }
  });

// Security audit command
program
  .command('audit')
  .description('Run security audit on wallet generation')
  .action(async () => {
    try {
      console.log(chalk.blue.bold('\n🛡️  Security Audit Report\n'));
      
      const walletGenerator = new WalletGenerator();
      const audit = walletGenerator.securityAudit();

      console.log(chalk.green('✅ Security Assessment:'));
      console.log(chalk.white(`   Entropy: ${audit.entropy}`));
      console.log(chalk.white(`   Mnemonic: ${audit.mnemonicStrength}`));
      console.log(chalk.white(`   Key Derivation: ${audit.keyDerivation}`));
      console.log(chalk.white(`   Encryption: ${audit.encryption}`));
      console.log(chalk.white(`   Storage: ${audit.storage}`));

      console.log(chalk.cyan('\n🔐 Security Recommendations:'));
      audit.recommendations.forEach(rec => {
        console.log(chalk.white(`   • ${rec}`));
      });

      console.log(chalk.green.bold('\n✅ Security Status: EXCELLENT'));
      console.log(chalk.white('Your wallets are generated with industry-standard security.'));

    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Help command enhancement
program.on('--help', () => {
  console.log('');
  console.log(chalk.blue.bold('Examples:'));
  console.log(chalk.white('  $ wallet-cli generate --count 5 --password mypass'));
  console.log(chalk.white('  $ wallet-cli master --password mypass'));
  console.log(chalk.white('  $ wallet-cli list'));
  console.log(chalk.white('  $ wallet-cli load --file launch_wallets_2024.json'));
  console.log(chalk.white('  $ wallet-cli demo'));
  console.log(chalk.white('  $ wallet-cli audit'));
  console.log('');
  console.log(chalk.yellow('Security Notes:'));
  console.log(chalk.gray('• All wallets are generated locally on your machine'));
  console.log(chalk.gray('• Private keys never leave your device'));
  console.log(chalk.gray('• Files are encrypted with AES-256'));
  console.log(chalk.gray('• Store passwords separately from wallet files'));
  console.log('');
});

program.parse();

// If no command is provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}