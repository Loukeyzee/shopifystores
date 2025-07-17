const AllInOneSuite = require('./services/allInOneSuite');
const readline = require('readline');
const chalk = require('chalk');

// Console interface for the All-in-One Suite
class SuiteConsole {
  constructor() {
    this.suite = null;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.isRunning = false;
    this.setupEventHandlers();
  }

  // Setup event handlers for the suite
  setupEventHandlers() {
    if (this.suite) {
      this.suite.on('suiteInitialized', (data) => {
        this.log('✅ Suite initialized with bots:', data.enabledBots.join(', '), 'success');
      });

      this.suite.on('suiteStarted', (data) => {
        this.log(`🚀 Suite started for ${data.token} on ${data.platform}`, '', 'success');
        this.log(`🤖 Active bots: ${data.activeBots.join(', ')}`, '', 'info');
      });

      this.suite.on('suiteStopped', (data) => {
        this.log('🛑 Suite stopped', '', 'info');
        this.displayStats(data.finalStats);
      });

      this.suite.on('healthCheck', (data) => {
        if (!data.overallHealth) {
          this.log('⚠️ Health check issues detected', '', 'warning');
        }
      });

      this.suite.on('emergencyStop', () => {
        this.log('🚨 EMERGENCY STOP executed', '', 'error');
      });
    }
  }

  // Initialize the suite
  async initialize() {
    this.log('🚀 Initializing All-in-One Token Promotion Suite...', '', 'info');
    
    const config = {
      // Volume Bot Configuration
      volumeBot: {
        enabled: true,
        minTradeAmount: 0.001,
        maxTradeAmount: 0.1,
        walletCount: 20,
        volumeTarget: 15
      },
      
      // Bump Bot Configuration
      bumpBot: {
        enabled: true,
        bumpAmount: 0.01,
        maxBumpsPerHour: 12,
        walletCount: 5,
        trendingTargetPosition: 10
      },
      
      // Comment Bot Configuration
      commentBot: {
        enabled: true,
        accountCount: 10,
        maxCommentsPerHour: 20,
        maxCommentsPerAccount: 3
      },
      
      // Launch Protector Configuration
      launchProtector: {
        enabled: true,
        autoProtect: true,
        protectionDuration: 300000
      },
      
      // Suite Settings
      coordinatedOperations: true,
      platforms: ['pump.fun', 'pump.swap']
    };

    this.suite = new AllInOneSuite(config);
    this.setupEventHandlers();
    
    try {
      const result = await this.suite.initialize();
      this.log('✅ All-in-One Suite ready!', '', 'success');
      this.displayMenu();
    } catch (error) {
      this.log(`❌ Failed to initialize suite: ${error.message}`, '', 'error');
    }
  }

  // Display main menu
  displayMenu() {
    console.log('\n' + chalk.cyan('═══════════════════════════════════════'));
    console.log(chalk.cyan('🚀 ALL-IN-ONE TOKEN PROMOTION SUITE 🚀'));
    console.log(chalk.cyan('═══════════════════════════════════════'));
    console.log(chalk.yellow('\nAvailable Commands:'));
    console.log(chalk.green('1.') + ' start <token_address> [platform] - Start full suite');
    console.log(chalk.green('2.') + ' stop - Stop all bots');
    console.log(chalk.green('3.') + ' status - Show suite status');
    console.log(chalk.green('4.') + ' stats - Show detailed statistics');
    console.log(chalk.green('5.') + ' bots - Show individual bot status');
    console.log(chalk.green('6.') + ' config - Show configuration');
    console.log(chalk.green('7.') + ' emergency - Emergency stop all operations');
    console.log(chalk.green('8.') + ' help - Show this menu');
    console.log(chalk.green('9.') + ' exit - Exit the application');
    
    console.log(chalk.cyan('\nBot Controls:'));
    console.log(chalk.blue('• volume') + ' <start|stop> - Control volume bot');
    console.log(chalk.blue('• bump') + ' <start|stop> - Control bump bot');
    console.log(chalk.blue('• comment') + ' <start|stop> - Control comment bot');
    console.log(chalk.blue('• protect') + ' <start|stop> - Control launch protector');
    
    console.log(chalk.cyan('\nExamples:'));
    console.log(chalk.gray('start EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v pump.fun'));
    console.log(chalk.gray('volume start'));
    console.log(chalk.gray('stats'));
    
    this.promptCommand();
  }

  // Prompt for command input
  promptCommand() {
    this.rl.question(chalk.yellow('\n> '), async (input) => {
      await this.handleCommand(input.trim());
      this.promptCommand();
    });
  }

  // Handle user commands
  async handleCommand(input) {
    const [command, ...args] = input.split(' ');
    
    try {
      switch (command.toLowerCase()) {
        case 'start':
          await this.handleStart(args);
          break;
        case 'stop':
          await this.handleStop();
          break;
        case 'status':
          this.handleStatus();
          break;
        case 'stats':
          this.handleStats();
          break;
        case 'bots':
          this.handleBots();
          break;
        case 'config':
          this.handleConfig();
          break;
        case 'emergency':
          await this.handleEmergencyStop();
          break;
        case 'volume':
          await this.handleBotCommand('volumeBot', args);
          break;
        case 'bump':
          await this.handleBotCommand('bumpBot', args);
          break;
        case 'comment':
          await this.handleBotCommand('commentBot', args);
          break;
        case 'protect':
          await this.handleBotCommand('launchProtector', args);
          break;
        case 'help':
          this.displayMenu();
          break;
        case 'exit':
          await this.handleExit();
          break;
        case '':
          // Empty command, do nothing
          break;
        default:
          this.log(`❌ Unknown command: ${command}`, 'Type "help" for available commands', 'error');
      }
    } catch (error) {
      this.log(`❌ Error executing command: ${error.message}`, '', 'error');
    }
  }

  // Handle start command
  async handleStart(args) {
    if (!args[0]) {
      this.log('❌ Missing token address', 'Usage: start <token_address> [platform]', 'error');
      return;
    }

    const tokenAddress = args[0];
    const platform = args[1] || 'pump.fun';

    if (this.suite.isRunning) {
      this.log('❌ Suite is already running', 'Stop it first with "stop" command', 'warning');
      return;
    }

    this.log(`🚀 Starting full suite for ${tokenAddress} on ${platform}...`, '', 'info');
    
    try {
      const result = await this.suite.startFullSuite(tokenAddress, platform);
      
      if (result.success) {
        this.isRunning = true;
        this.log('✅ Full suite started successfully!', '', 'success');
        this.log(`🤖 Active bots: ${result.activeBots.join(', ')}`, '', 'info');
      }
    } catch (error) {
      this.log(`❌ Failed to start suite: ${error.message}`, '', 'error');
    }
  }

  // Handle stop command
  async handleStop() {
    if (!this.suite.isRunning) {
      this.log('❌ Suite is not running', '', 'warning');
      return;
    }

    this.log('🛑 Stopping all bots...', '', 'info');
    
    try {
      await this.suite.stopFullSuite();
      this.isRunning = false;
      this.log('✅ All bots stopped', '', 'success');
    } catch (error) {
      this.log(`❌ Failed to stop suite: ${error.message}`, '', 'error');
    }
  }

  // Handle status command
  handleStatus() {
    const stats = this.suite.getSuiteStats();
    
    console.log('\n' + chalk.cyan('📊 SUITE STATUS'));
    console.log(chalk.cyan('══════════════'));
    
    console.log(chalk.yellow('Overall Status:'));
    console.log(`• Running: ${this.suite.isRunning ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`• Active Bots: ${chalk.blue(stats.suite.activeBots?.length || 0)}`);
    console.log(`• Current Token: ${chalk.green(stats.suite.currentToken?.address || 'None')}`);
    console.log(`• Platform: ${chalk.green(stats.suite.currentToken?.platform || 'None')}`);
    
    console.log(chalk.yellow('\nQuick Stats:'));
    console.log(`• Total Operations: ${chalk.blue(stats.suite.totalOperations || 0)}`);
    console.log(`• Success Rate: ${chalk.green(stats.suite.successRate || '0%')}`);
    console.log(`• Total Cost: ${chalk.yellow((stats.suite.totalCost || 0).toFixed(4))} SOL`);
    console.log(`• Uptime: ${chalk.cyan(Math.floor((stats.suite.runtime || 0) / 60000))} minutes`);
  }

  // Handle stats command
  handleStats() {
    const stats = this.suite.getSuiteStats();
    this.displayStats(stats);
  }

  // Handle bots command
  handleBots() {
    const stats = this.suite.getSuiteStats();
    
    console.log('\n' + chalk.cyan('🤖 BOT STATUS'));
    console.log(chalk.cyan('═════════════'));
    
    ['volumeBot', 'bumpBot', 'commentBot', 'launchProtector'].forEach(botName => {
      const isActive = this.suite.activeBots.has(botName);
      const botStats = stats.bots[botName];
      
      console.log(`\n${chalk.yellow(botName.toUpperCase())}:`);
      console.log(`• Status: ${isActive ? chalk.green('ACTIVE') : chalk.red('INACTIVE')}`);
      
      if (botStats) {
        Object.entries(botStats).forEach(([key, value]) => {
          if (typeof value === 'object') return; // Skip complex objects
          console.log(`• ${key}: ${chalk.blue(value)}`);
        });
      }
    });
  }

  // Handle config command
  handleConfig() {
    console.log('\n' + chalk.cyan('⚙️ CONFIGURATION'));
    console.log(chalk.cyan('════════════════'));
    console.log(JSON.stringify(this.suite.config, null, 2));
  }

  // Handle emergency stop
  async handleEmergencyStop() {
    this.log('🚨 EXECUTING EMERGENCY STOP...', '', 'error');
    this.suite.emergencyStopAll();
    this.isRunning = false;
    this.log('🛑 All operations halted', '', 'info');
  }

  // Handle individual bot commands
  async handleBotCommand(botName, args) {
    const action = args[0];
    
    if (!action) {
      this.log(`❌ Missing action for ${botName}`, 'Usage: <bot> <start|stop>', 'error');
      return;
    }

    try {
      if (action.toLowerCase() === 'start') {
        await this.suite.startBot(botName);
        this.log(`✅ ${botName} started`, '', 'success');
      } else if (action.toLowerCase() === 'stop') {
        await this.suite.stopBot(botName);
        this.log(`🛑 ${botName} stopped`, '', 'info');
      } else {
        this.log(`❌ Invalid action: ${action}`, 'Use "start" or "stop"', 'error');
      }
    } catch (error) {
      this.log(`❌ Failed to ${action} ${botName}: ${error.message}`, '', 'error');
    }
  }

  // Handle exit command
  async handleExit() {
    this.log('👋 Shutting down All-in-One Suite...', '', 'info');
    
    if (this.suite.isRunning) {
      await this.suite.stopFullSuite();
    }
    
    this.rl.close();
    process.exit(0);
  }

  // Display detailed statistics
  displayStats(stats) {
    console.log('\n' + chalk.cyan('📈 DETAILED STATISTICS'));
    console.log(chalk.cyan('═════════════════════'));
    
    // Suite stats
    const suiteStats = stats.suite || {};
    console.log(chalk.yellow('\nSuite Overview:'));
    console.log(`• Total Operations: ${chalk.blue(suiteStats.totalOperations || 0)}`);
    console.log(`• Successful: ${chalk.green(suiteStats.successfulOperations || 0)}`);
    console.log(`• Failed: ${chalk.red(suiteStats.failedOperations || 0)}`);
    console.log(`• Success Rate: ${chalk.green(suiteStats.successRate || '0%')}`);
    console.log(`• Operations/Hour: ${chalk.cyan((suiteStats.operationsPerHour || 0).toFixed(2))}`);
    console.log(`• Total Cost: ${chalk.yellow((suiteStats.totalCost || 0).toFixed(4))} SOL`);
    console.log(`• Cost/Hour: ${chalk.yellow((suiteStats.costPerHour || 0).toFixed(4))} SOL`);
    console.log(`• Uptime: ${chalk.cyan(Math.floor((suiteStats.runtime || 0) / 60000))} minutes`);
    
    // Individual bot stats
    const botStats = stats.bots || {};
    Object.entries(botStats).forEach(([botName, stats]) => {
      console.log(chalk.yellow(`\n${botName.toUpperCase()} Stats:`));
      Object.entries(stats).forEach(([key, value]) => {
        if (typeof value === 'object') return; // Skip complex objects
        console.log(`• ${key}: ${chalk.blue(value)}`);
      });
    });
    
    // Platform breakdown
    console.log(chalk.yellow('\nPlatform Breakdown:'));
    Object.entries(suiteStats.platformStats || {}).forEach(([platform, stats]) => {
      console.log(`• ${platform}: ${stats.operations || 0} ops, ${(stats.cost || 0).toFixed(4)} SOL`);
    });
  }

  // Utility logging function
  log(message, details = '', type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = chalk.gray(`[${timestamp}]`);
    
    let coloredMessage;
    switch (type) {
      case 'success':
        coloredMessage = chalk.green(message);
        break;
      case 'error':
        coloredMessage = chalk.red(message);
        break;
      case 'warning':
        coloredMessage = chalk.yellow(message);
        break;
      case 'info':
      default:
        coloredMessage = chalk.blue(message);
        break;
    }
    
    console.log(`${prefix} ${coloredMessage}`);
    if (details) {
      console.log(chalk.gray(`   ${details}`));
    }
  }
}

// Main execution
async function main() {
  console.log(chalk.rainbow('\n🚀 SOLANA ALL-IN-ONE TOKEN PROMOTION SUITE 🚀'));
  console.log(chalk.cyan('Volume Bot + Bump Bot + Comment Bot + Launch Protector'));
  console.log(chalk.gray('Built for Pump.fun & Pump.swap\n'));

  const suiteConsole = new SuiteConsole();
  
  try {
    await suiteConsole.initialize();
  } catch (error) {
    console.error(chalk.red(`❌ Failed to start suite: ${error.message}`));
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n🛑 Graceful shutdown initiated...'));
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection:'), reason);
});

// Start the application
if (require.main === module) {
  main().catch(console.error);
}

module.exports = SuiteConsole;