# 🚀 Solana All-in-One Token Promotion Suite

**The Complete Token Launch & Promotion Toolkit for Pump.fun & Pump.swap**

A comprehensive suite of automated bots designed to help your Solana token succeed by providing protection, volume, visibility, and social proof.

## 🌟 Features Overview

### 🛡️ Launch Protection
- **Anti-Sniper Technology**: Detects and blocks sniper bots using behavioral analysis
- **MEV Protection**: Jito integration prevents sandwich attacks and frontrunning  
- **Real-time Monitoring**: 5 simultaneous detection methods with sub-50ms response time
- **Smart Filtering**: Wallet age analysis, transaction pattern detection, success rate monitoring

### 📊 Volume Generation
- **Organic Trading Patterns**: 20+ wallets with realistic trader profiles (scalper, swing, hodler, degen)
- **Multiple Strategies**: Organic, aggressive, and stealth trading patterns
- **Volume Waves**: Coordinated buying/selling for maximum impact
- **Platform Support**: Pump.fun and Pump.swap compatible

### 📈 Trending & Bump Bot
- **Smart Position Monitoring**: Real-time tracking of trending positions
- **Adaptive Bumping**: Frequency adjusts based on current position
- **Strategy Auto-Selection**: Gentle, moderate, or aggressive based on performance
- **Cost Optimization**: Calculates optimal bump amounts for maximum efficiency

### 💬 Social Proof & Comments
- **10+ Realistic Accounts**: Each with unique personality and commenting style
- **6 Comment Categories**: Bullish, FOMO, Technical, Community, Casual, Hype
- **Context-Aware**: Comments adapt to market conditions and trends
- **Engagement Tracking**: Monitors likes, replies, and mentions for optimization

### 🤝 Coordinated Operations
- **Cross-Bot Synergy**: Bots work together for maximum impact
- **Wave Attacks**: Coordinated volume + bump + comments every 10-20 minutes
- **Event-Driven Actions**: Automatic responses to price movements and trends
- **Health Monitoring**: Continuous system health checks and auto-recovery

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://your-repo/solana-suite.git
cd solana-suite

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration
```

### Environment Configuration

```env
# Solana Configuration
RPC_URL=https://api.mainnet-beta.solana.com
JITO_BLOCK_ENGINE_URL=https://mainnet.block-engine.jito.wtf

# Wallet Configuration (for funding bots)
PRIVATE_KEY=your_base58_private_key

# Platform APIs (optional for enhanced features)
PUMP_FUN_API_KEY=your_api_key
PUMP_SWAP_API_KEY=your_api_key

# Bot Configuration
VOLUME_TARGET=15  # SOL per hour
BUMP_TARGET_POSITION=10  # Top 10 trending
MAX_COMMENTS_PER_HOUR=20
```

### Basic Usage

#### Command Line Interface

```bash
# Start the suite console
node src/suiteMain.js

# Available commands:
start <token_address> [platform]  # Start full suite
stop                              # Stop all bots
status                           # Show suite status
stats                           # Show detailed statistics
bots                            # Show individual bot status
emergency                       # Emergency stop all operations
```

#### GUI Application

```bash
# Start the desktop application
npm start
```

## 📖 Detailed Bot Documentation

### 🛡️ Launch Protector

**Purpose**: Protect your token launch from sniper bots and MEV attacks.

**Key Features**:
- Wallet age analysis (flags wallets < 24 hours old)
- Transaction pattern detection (50+ tx/hour = suspicious)
- MEV behavior detection (programmatic trading patterns)
- Jito bundle protection with atomic execution

**Configuration**:
```javascript
launchProtector: {
  enabled: true,
  autoProtect: true,
  protectionDuration: 300000, // 5 minutes
  walletAgeThreshold: 86400000, // 24 hours
  suspiciousTxThreshold: 50, // transactions per hour
  jitoTipMultiplier: 3.0
}
```

**Usage Example**:
```bash
# Start protection for a token
protect start EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v pump.fun

# Monitor protection status
protect status

# Stop protection
protect stop
```

### 📊 Volume Bot

**Purpose**: Generate organic-looking trading volume to improve token metrics.

**Trading Patterns**:
- **Organic**: 60% buys, 40% sells, 15-45 second intervals
- **Aggressive**: 80% buys, 20% sells, 5-30 second intervals  
- **Stealth**: 55% buys, 45% sells, 1-5 minute intervals

**Trader Profiles**:
- **Scalper**: 5-minute hold time, high risk tolerance
- **Swing Trader**: 1-hour hold time, medium risk tolerance
- **Hodler**: 24-hour hold time, low risk tolerance
- **Degen**: 1-minute hold time, very high risk tolerance

**Configuration**:
```javascript
volumeBot: {
  enabled: true,
  minTradeAmount: 0.001,      // Minimum SOL per trade
  maxTradeAmount: 0.1,        // Maximum SOL per trade
  walletCount: 20,            // Number of trading wallets
  volumeTarget: 15,           // SOL volume per hour
  tradingInterval: 30000      // Base interval between trades
}
```

**Usage Examples**:
```bash
# Start volume generation
volume start EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v pump.fun

# Show volume statistics
volume stats

# Trigger manual volume boost
volume boost 1.5x

# Stop volume generation
volume stop
```

### 📈 Bump Bot

**Purpose**: Maintain trending position by executing strategic small trades.

**Strategies**:
- **Gentle**: 10-30 minute intervals, 10% size variation, maintenance mode
- **Moderate**: 5-15 minute intervals, 20% size variation, balanced approach
- **Aggressive**: 2-10 minute intervals, 30% size variation, rapid climbing

**Smart Features**:
- Position-based frequency adjustment
- Trend analysis with strategy auto-switching
- Cost optimization based on current position
- Hourly bump limits to prevent over-spending

**Configuration**:
```javascript
bumpBot: {
  enabled: true,
  bumpAmount: 0.01,           // Base SOL amount per bump
  maxBumpsPerHour: 12,        // Rate limiting
  walletCount: 5,             // Number of bump wallets
  trendingTargetPosition: 10   // Target top 10
}
```

**Usage Examples**:
```bash
# Start bump bot with moderate strategy
bump start EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v pump.fun moderate

# Manual bump trigger
bump manual 0.02

# Set strategy
bump strategy aggressive

# Show position history
bump history
```

### 💬 Comment Bot

**Purpose**: Create social proof and hype through realistic community engagement.

**Comment Categories**:
- **Bullish**: "🚀 This token is about to moon! Got my bag ready!"
- **FOMO**: "Wish I bought more when it was lower! 😭"
- **Technical**: "RSI oversold, perfect bounce setup! 📊"
- **Community**: "Best community I've seen in crypto! 🤝"
- **Casual**: "Comfy hold for me! 😌"
- **Hype**: "🔥🔥🔥 THIS IS IT! 🔥🔥🔥"

**Account Personalities**:
- **Hype Beast**: High confidence, high aggression, very optimistic
- **Technical Analyst**: Medium confidence, low aggression, analytical
- **Cautious Investor**: Low confidence, very low aggression, conservative
- **Degen Gambler**: High confidence, high aggression, risk-taking
- **Community Builder**: Medium confidence, very low aggression, positive
- **Whale Spotter**: High confidence, medium aggression, observant

**Configuration**:
```javascript
commentBot: {
  enabled: true,
  accountCount: 10,                    // Number of comment accounts
  maxCommentsPerHour: 20,             // Rate limiting
  maxCommentsPerAccount: 3,           // Per account daily limit
  commentInterval: 180000             // 3 minutes between comments
}
```

**Usage Examples**:
```bash
# Start comment bot
comment start EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v pump.fun

# Post manual comment
comment post "LFG! This is going to the moon! 🚀" 

# Show account statistics
comment accounts

# Show comment history
comment history
```

## 🎯 Suite Coordination

### Coordinated Wave Attacks

Every 10-20 minutes, the suite executes coordinated operations:

1. **Volume Surge** (1.5x multiplier) - 30 seconds
2. **Strategic Bump** - triggered 30 seconds after volume
3. **Hype Comments** - posted 60 seconds after volume starts

### Event-Driven Coordination

- **Sniper Detection** → Volume boost (2x) + protective comments
- **Position Drop** → Aggressive bumping + FOMO comments  
- **Large Volume** → Complementary comments within 15-45 seconds
- **Successful Bump** → Volume amplification after 30-90 seconds

### Health Monitoring

- **Bot Status**: Continuous monitoring of all bot operations
- **Performance Metrics**: Success rates, cost efficiency, response times
- **Auto-Recovery**: Automatic restart of failed operations
- **Alert System**: Real-time notifications of issues or opportunities

## 📊 Analytics & Monitoring

### Real-Time Dashboard

The GUI provides comprehensive monitoring:

- **Live Activity**: Real-time operation tracking
- **Performance Metrics**: Success rates, costs, volumes
- **Bot Status**: Individual bot health and statistics
- **Position Tracking**: Trending position history and trends
- **Cost Analysis**: Detailed breakdown of expenses by bot and platform

### Detailed Statistics

```bash
# Suite overview
stats

# Individual bot stats
stats volume
stats bump
stats comment
stats protect

# Platform breakdown
stats platform pump.fun
stats platform pump.swap

# Historical analysis
stats history 24h
stats history 7d
```

### Export & Reporting

- **CSV Export**: Historical data for analysis
- **Performance Reports**: Daily/weekly/monthly summaries
- **Cost Tracking**: Detailed expense tracking for ROI analysis
- **Success Metrics**: Launch success rate and factor analysis

## ⚙️ Advanced Configuration

### Custom Trading Patterns

```javascript
// Add custom volume pattern
volumeBot.tradingPatterns.custom = {
  buySellRatio: 0.7,
  minInterval: 20000,
  maxInterval: 180000,
  sizeVariation: 0.25
};
```

### Custom Comment Templates

```javascript
// Add custom comment category
commentBot.commentTemplates.moonboy = [
  "When moon? Soon moon! 🌙",
  "Diamond hands never fold! 💎🙌",
  "This is financial advice: BUY MORE! 🚀"
];
```

### Platform-Specific Settings

```javascript
// Different settings per platform
config = {
  'pump.fun': {
    volumeTarget: 20,
    bumpAmount: 0.015,
    maxCommentsPerHour: 25
  },
  'pump.swap': {
    volumeTarget: 15,
    bumpAmount: 0.01,
    maxCommentsPerHour: 15
  }
};
```

## 🔒 Security & Best Practices

### Wallet Security

- **Separate Wallets**: Each bot uses dedicated wallets
- **Funding Limits**: Maximum balance limits prevent excessive losses
- **Key Rotation**: Regular rotation of bot wallets
- **Cold Storage**: Main funds kept in secure cold storage

### Operational Security

- **Rate Limiting**: Built-in rate limits prevent detection
- **Pattern Variation**: Randomized timing and amounts
- **Error Handling**: Graceful failure and automatic recovery
- **Audit Logging**: Comprehensive operation logging

### Risk Management

- **Maximum Daily Spend**: Configurable spending limits
- **Success Rate Monitoring**: Auto-stop if success rates drop
- **Market Condition Checks**: Pause operations during high volatility
- **Emergency Stops**: Instant halt of all operations

## 💰 Pricing & Economics

### Operational Costs

| Bot | Cost per Hour | Description |
|-----|---------------|-------------|
| Volume Bot | ~0.15 SOL | 15 SOL volume target with ~1% cost |
| Bump Bot | ~0.12 SOL | 12 bumps at 0.01 SOL each |
| Comment Bot | ~0.002 SOL | Minimal gas for comment transactions |
| Launch Protector | ~0.03 SOL | Jito tips and protection costs |
| **Total** | **~0.3 SOL/hour** | **Complete suite operation** |

### ROI Considerations

- **Trending Position**: Top 10 position can increase volume 10-50x
- **Social Proof**: Comments and activity attract organic traders
- **Protection Value**: Preventing 10% sniper tax on launch
- **Volume Benefits**: Higher volume improves DEX listing chances

### Cost Optimization

- **Selective Operation**: Run only needed bots
- **Time-Based Scaling**: Higher activity during peak hours
- **Performance-Based Adjustment**: Increase spend when working
- **Platform Selection**: Focus on most effective platform

## 🛠️ Troubleshooting

### Common Issues

**"No available wallets"**
- Check wallet funding levels
- Verify wallet cooldown periods
- Increase wallet count in configuration

**"Failed to fetch trending position"**
- Verify API endpoints are accessible
- Check rate limiting status
- Confirm token address format

**"Transaction failed"**
- Increase priority fees
- Check Solana network status
- Verify sufficient SOL balance

**"Comments not posting"**
- Verify platform API access
- Check account cooldown periods
- Confirm comment content guidelines

### Performance Optimization

**Increase Success Rate**:
- Higher priority fees during network congestion
- More diverse wallet distribution
- Better timing coordination between bots

**Reduce Costs**:
- Lower volume targets during stable periods
- Fewer bump operations when position is good
- Optimize comment frequency

**Improve Detection**:
- Faster RPC endpoints
- Multiple redundant connections
- Lower detection thresholds

### Monitoring & Alerts

```bash
# Check system health
health

# Monitor error rates
errors last-hour

# View recent failures
failures 10

# System diagnostics
diagnose
```

## 📈 Success Metrics

### Key Performance Indicators

- **Trending Position**: Target top 10 consistently
- **Volume Increase**: 50-200% above natural volume
- **Social Engagement**: 3-5x more comments and activity  
- **Protection Effectiveness**: 95%+ sniper block rate
- **Cost Efficiency**: <2% of total volume in operational costs

### Benchmarking

| Metric | Without Suite | With Suite | Improvement |
|--------|---------------|------------|-------------|
| Peak Trending Position | #50-100 | #5-15 | 5-10x better |
| Daily Volume | 10-50 SOL | 100-500 SOL | 10x increase |
| Comment Activity | 5-20/day | 50-200/day | 10x increase |
| Launch Success Rate | 60% | 95% | 35% improvement |

## 🚀 Advanced Usage Scenarios

### New Token Launch

```bash
# 1. Start protection immediately
start EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v pump.fun

# 2. Monitor launch for 15 minutes
sleep 900

# 3. Scale up volume for trending push
volume boost 2.0

# 4. Add aggressive bumping
bump strategy aggressive

# 5. Increase comment frequency
comment boost
```

### Trending Recovery

```bash
# Check current position
status

# If position > 50, execute recovery
bump strategy aggressive
volume boost 1.5
comment style hype

# Monitor for 30 minutes
sleep 1800

# Return to normal operations
bump strategy moderate
volume boost 1.0
comment style balanced
```

### Maintenance Mode

```bash
# Light operations to maintain position
bump strategy gentle
volume target 5
comment frequency low

# Minimal cost maintenance
config cost-optimize true
```

## 🔮 Future Enhancements

### Roadmap

- **AI-Powered Comments**: GPT integration for more natural comments
- **Multi-Chain Support**: Ethereum, BSC, and other chain support
- **Advanced Analytics**: ML-powered success prediction
- **Mobile App**: iOS/Android companion app
- **API Integration**: Third-party service integrations
- **Automated Strategies**: Pre-built launch and promotion strategies

### Community Features

- **Strategy Sharing**: Share successful bot configurations
- **Performance Leaderboards**: Compare results with other users
- **Best Practices**: Community-driven optimization guides
- **Template Library**: Pre-built comment and trading templates

## 📞 Support & Community

### Documentation

- **API Reference**: Complete API documentation
- **Video Tutorials**: Step-by-step usage guides
- **Case Studies**: Real-world success stories
- **Best Practices**: Optimization strategies

### Community

- **Discord Server**: Real-time support and discussion
- **Telegram Group**: Quick questions and updates
- **GitHub Issues**: Bug reports and feature requests
- **Knowledge Base**: Searchable help articles

### Professional Support

- **Setup Assistance**: Professional configuration help
- **Custom Development**: Bespoke features and integrations
- **Managed Service**: Fully managed operation service
- **Training**: Team training and best practices

---

## ⚖️ Legal & Disclaimers

**Important**: This software is for educational and research purposes. Users are responsible for compliance with all applicable laws and platform terms of service. Token promotion activities may be subject to securities regulations in some jurisdictions.

**Risk Warning**: Cryptocurrency trading involves significant risk. Never invest more than you can afford to lose. Past performance does not guarantee future results.

**Platform Compliance**: Ensure your usage complies with Pump.fun, Pump.swap, and other platform terms of service. Some activities may violate platform policies.

---

*Built with ❤️ for the Solana ecosystem*