const axios = require('axios');
const EventEmitter = require('events');
const PlatformIntegration = require('./platformIntegration');

class CommentBot extends EventEmitter {
  constructor(config = {}) {
    super();
    this.isRunning = false;
    this.commentAccounts = [];
    this.currentToken = null;
    this.platformIntegration = new PlatformIntegration();
    
    this.config = {
      commentInterval: config.commentInterval || 180000, // 3 minutes
      accountCount: config.accountCount || 10,
      platforms: config.platforms || ['pump.fun', 'pump.swap'],
      maxCommentsPerHour: config.maxCommentsPerHour || 20,
      maxCommentsPerAccount: config.maxCommentsPerAccount || 3,
      ...config
    };

    this.stats = {
      totalComments: 0,
      successfulComments: 0,
      failedComments: 0,
      engagementGenerated: 0,
      uptime: 0,
      platformStats: {
        'pump.fun': { comments: 0, engagement: 0 },
        'pump.swap': { comments: 0, engagement: 0 }
      }
    };

    // Comment templates for different scenarios
    this.commentTemplates = {
      bullish: [
        "🚀 This token is about to moon! Got my bag ready!",
        "LFG! Finally found a gem that's not a rug 💎",
        "Chart looks insane, loading up more! 📈",
        "Diamond hands on this one! 💎🙌",
        "This is the next 100x, calling it now! 🔥",
        "Perfect entry point, don't sleep on this! ⚡",
        "Dev team is legit, roadmap looks solid! ✅",
        "Volume picking up, momentum building! 📊",
        "Early bird gets the worm! Still time to get in! 🐦",
        "Technical analysis looking very bullish! 📈"
      ],
      
      fomo: [
        "Wish I bought more when it was lower! 😭",
        "Kicking myself for not buying the dip! 🤦",
        "FOMO hitting hard, buying more now! 💸",
        "Can't believe I almost missed this gem! 💎",
        "Everyone talking about this in my TG groups! 🗣️",
        "My friend made 10x on this already! 🤑",
        "This is trending everywhere, jumping in! 📈",
        "Price action is crazy, wish I found this earlier! ⚡",
        "All the smart money is flowing in! 🧠💰",
        "Community growing fast, bullish AF! 🚀"
      ],
      
      technical: [
        "RSI oversold, perfect bounce setup! 📊",
        "Breaking key resistance levels! 📈",
        "Volume surge incoming, big moves ahead! 📊",
        "Fibonacci retracement holding perfectly! 📐",
        "Bull flag formation completed! 🚩",
        "Support holding strong at this level! 💪",
        "Market structure looking very bullish! 📈",
        "Breakout confirmed on the 4h chart! ⚡",
        "Golden cross forming on the hourly! ✨",
        "Accumulation phase ending, pump incoming! 🚀"
      ],
      
      community: [
        "Best community I've seen in crypto! 🤝",
        "Devs are always active in the chat! 👨‍💻",
        "Love the transparency from the team! ✨",
        "Marketing is on point, getting noticed! 📢",
        "Telegram growing by 100s daily! 📱",
        "Twitter engagement is through the roof! 🐦",
        "Partnerships being announced weekly! 🤝",
        "Real utility behind this project! ⚙️",
        "Not just another meme, real fundamentals! 💡",
        "Team delivering on all promises! ✅"
      ],
      
      casual: [
        "Comfy hold for me! 😌",
        "Adding to my DCA bag! 💰",
        "This one feels different! ✨",
        "Good vibes only! ☀️",
        "Slow and steady wins the race! 🐢",
        "Building my position gradually! 🏗️",
        "Long term hodler here! ⏰",
        "Patience pays off! ⌛",
        "Quality over quantity! 💎",
        "In it for the long haul! 🛣️"
      ],
      
      hype: [
        "🔥🔥🔥 THIS IS IT! 🔥🔥🔥",
        "PUMP IT! PUMP IT! PUMP IT! 🚀🚀🚀",
        "TO THE MOON AND BEYOND! 🌙⭐",
        "DIAMOND HANDS ONLY! 💎🙌💎",
        "LET'S GOOOOO! 🚀💥⚡",
        "NOTHING CAN STOP US NOW! 💪🔥",
        "BEST DAY EVER! 🎉🎊🥳",
        "MILLIONAIRE MAKER! 💰💰💰",
        "HISTORIC PUMP INCOMING! 📈🚀",
        "LEGENDARY TOKEN! 👑✨🏆"
      ]
    };

    // Emoji sets for natural variation
    this.emojiSets = {
      rocket: ['🚀', '🌙', '⭐', '💫', '🔥'],
      money: ['💰', '💸', '💎', '🤑', '💵'],
      chart: ['📈', '📊', '📉', '⚡', '📐'],
      hands: ['🙌', '👐', '🤲', '💪', '👊'],
      faces: ['😎', '🤩', '🥳', '😍', '🤯']
    };

    this.commentHistory = [];
    this.accountCooldowns = new Map();
  }

  // Initialize comment bot
  async initialize() {
    console.log('💬 Initializing Comment Bot...');
    
    try {
      // Generate comment accounts
      await this.setupCommentAccounts();
      
      console.log(`✅ Comment Bot initialized with ${this.commentAccounts.length} accounts`);
      return { success: true, accounts: this.commentAccounts.length };
    } catch (error) {
      console.error('❌ Failed to initialize comment bot:', error);
      throw error;
    }
  }

  // Set up comment accounts
  async setupCommentAccounts() {
    console.log(`👥 Setting up ${this.config.accountCount} comment accounts...`);
    
    const usernames = this.generateUsernames();
    const avatars = this.generateAvatars();
    
    for (let i = 0; i < this.config.accountCount; i++) {
      this.commentAccounts.push({
        id: `account_${i + 1}`,
        username: usernames[i],
        avatar: avatars[i],
        commentsPosted: 0,
        lastCommentTime: 0,
        personality: this.generatePersonality(),
        preferredStyle: this.getRandomCommentStyle(),
        engagement: {
          likes: 0,
          replies: 0,
          mentions: 0
        }
      });
    }
    
    console.log(`✅ Generated ${this.commentAccounts.length} comment accounts`);
  }

  // Generate realistic usernames
  generateUsernames() {
    const prefixes = ['Crypto', 'Moon', 'Diamond', 'Rocket', 'Alpha', 'Degen', 'Ape', 'Bull', 'Chad', 'Sigma'];
    const suffixes = ['Trader', 'Hunter', 'Hodler', 'Mania', 'King', 'Lord', 'Pro', 'Master', 'Wizard', 'Legend'];
    const numbers = ['69', '420', '100', '1000', '2024', '99', '777', '888'];
    
    const usernames = [];
    for (let i = 0; i < this.config.accountCount; i++) {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      const number = Math.random() > 0.5 ? numbers[Math.floor(Math.random() * numbers.length)] : '';
      
      usernames.push(`${prefix}${suffix}${number}`);
    }
    
    return usernames;
  }

  // Generate avatar URLs (placeholder)
  generateAvatars() {
    const avatars = [];
    for (let i = 0; i < this.config.accountCount; i++) {
      avatars.push(`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`);
    }
    return avatars;
  }

  // Generate account personality
  generatePersonality() {
    const personalities = [
      { type: 'hype_beast', confidence: 0.9, aggression: 0.8, optimism: 0.9 },
      { type: 'technical_analyst', confidence: 0.7, aggression: 0.3, optimism: 0.6 },
      { type: 'cautious_investor', confidence: 0.5, aggression: 0.2, optimism: 0.5 },
      { type: 'degen_gambler', confidence: 0.8, aggression: 0.7, optimism: 0.8 },
      { type: 'community_builder', confidence: 0.6, aggression: 0.1, optimism: 0.7 },
      { type: 'whale_spotter', confidence: 0.7, aggression: 0.4, optimism: 0.6 }
    ];
    
    return personalities[Math.floor(Math.random() * personalities.length)];
  }

  // Get random comment style
  getRandomCommentStyle() {
    const styles = Object.keys(this.commentTemplates);
    return styles[Math.floor(Math.random() * styles.length)];
  }

  // Start comment bot for a token
  async startCommenting(tokenAddress, platform = 'pump.fun') {
    if (this.isRunning) {
      console.log('Comment bot already running');
      return;
    }

    console.log(`💬 Starting comment bot for ${tokenAddress} on ${platform}`);
    this.isRunning = true;
    this.startTime = Date.now();
    this.currentToken = { address: tokenAddress, platform };

    try {
      // Start intelligent commenting
      this.startIntelligentCommenting();
      
      // Start engagement monitoring
      this.startEngagementMonitoring();
      
      // Start trend-based commenting
      this.startTrendBasedCommenting();
      
      this.emit('commentingStarted', {
        token: tokenAddress,
        platform,
        accounts: this.commentAccounts.length
      });

      console.log(`✅ Comment bot active for ${tokenAddress}`);
    } catch (error) {
      console.error('❌ Failed to start comment bot:', error);
      this.isRunning = false;
      throw error;
    }
  }

  // Start intelligent commenting
  startIntelligentCommenting() {
    const commentInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(commentInterval);
        return;
      }

      try {
        await this.executeIntelligentComment();
      } catch (error) {
        console.error('Intelligent comment failed:', error);
      }
    }, this.getRandomInterval(120000, 300000)); // 2-5 minutes
  }

  // Start engagement monitoring
  startEngagementMonitoring() {
    const engagementInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(engagementInterval);
        return;
      }

      try {
        await this.monitorEngagement();
      } catch (error) {
        console.error('Engagement monitoring failed:', error);
      }
    }, 60000); // Check every minute
  }

  // Start trend-based commenting
  startTrendBasedCommenting() {
    const trendInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(trendInterval);
        return;
      }

      try {
        await this.executeTrendBasedComment();
      } catch (error) {
        console.error('Trend-based comment failed:', error);
      }
    }, this.getRandomInterval(180000, 420000)); // 3-7 minutes
  }

  // Execute intelligent comment
  async executeIntelligentComment() {
    // Check if we should comment based on limits
    if (!this.shouldComment()) {
      return;
    }

    const account = this.getAvailableAccount();
    if (!account) {
      console.log('⚠️ No available comment accounts');
      return;
    }

    // Analyze current market conditions
    const marketCondition = await this.analyzeMarketCondition();
    
    // Generate contextual comment
    const comment = this.generateContextualComment(account, marketCondition);
    
    console.log(`💬 Posting comment: "${comment.text}" | ${account.username}`);
    
    try {
      const result = await this.postComment(account, comment);
      
      if (result.success) {
        this.updateCommentStats(true);
        
        // Record comment in history
        this.commentHistory.push({
          timestamp: Date.now(),
          account: account.username,
          text: comment.text,
          style: comment.style,
          platform: this.currentToken.platform,
          marketCondition
        });

        // Update account stats
        account.commentsPosted++;
        account.lastCommentTime = Date.now();

        this.emit('commentPosted', {
          account: account.username,
          text: comment.text,
          platform: this.currentToken.platform,
          result
        });
      } else {
        this.updateCommentStats(false);
      }
    } catch (error) {
      console.error(`❌ Comment posting failed: ${error.message}`);
      this.updateCommentStats(false);
    }
  }

  // Check if we should comment
  shouldComment() {
    // Check hourly limit
    const commentsThisHour = this.getCommentsInLastHour();
    if (commentsThisHour >= this.config.maxCommentsPerHour) {
      return false;
    }

    // Check if any accounts are available
    const availableAccounts = this.getAvailableAccounts();
    return availableAccounts.length > 0;
  }

  // Get available account for commenting
  getAvailableAccount() {
    const availableAccounts = this.getAvailableAccounts();
    
    if (availableAccounts.length === 0) return null;
    
    // Prefer accounts that haven't commented recently
    const sortedAccounts = availableAccounts.sort((a, b) => 
      a.lastCommentTime - b.lastCommentTime
    );
    
    return sortedAccounts[0];
  }

  // Get available accounts
  getAvailableAccounts() {
    const now = Date.now();
    const cooldownPeriod = 600000; // 10 minutes between comments per account
    
    return this.commentAccounts.filter(account => {
      // Check cooldown
      if (now - account.lastCommentTime < cooldownPeriod) {
        return false;
      }
      
      // Check daily limit per account
      const commentsToday = this.getAccountCommentsToday(account.id);
      if (commentsToday >= this.config.maxCommentsPerAccount) {
        return false;
      }
      
      return true;
    });
  }

  // Analyze current market condition
  async analyzeMarketCondition() {
    try {
      // Simulate market analysis (in production, use real data)
      const conditions = ['bullish', 'bearish', 'sideways', 'volatile', 'breakout'];
      const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
      
      return {
        trend: randomCondition,
        volume: Math.random() > 0.5 ? 'high' : 'low',
        volatility: Math.random() > 0.5 ? 'high' : 'low',
        sentiment: Math.random() > 0.5 ? 'positive' : 'neutral'
      };
    } catch (error) {
      return { trend: 'neutral', volume: 'low', volatility: 'low', sentiment: 'neutral' };
    }
  }

  // Generate contextual comment
  generateContextualComment(account, marketCondition) {
    const personality = account.personality;
    
    // Choose comment style based on market condition and personality
    let style = account.preferredStyle;
    
    if (marketCondition.trend === 'bullish' && personality.optimism > 0.7) {
      style = Math.random() > 0.5 ? 'bullish' : 'hype';
    } else if (marketCondition.volume === 'high' && personality.aggression > 0.6) {
      style = 'fomo';
    } else if (personality.type === 'technical_analyst') {
      style = 'technical';
    }

    // Get base comment
    let baseComment = this.getRandomTemplate(style);
    
    // Add personality touches
    const comment = this.addPersonalityTouch(baseComment, personality);
    
    // Add random emojis
    const finalComment = this.addRandomEmojis(comment);
    
    return {
      text: finalComment,
      style: style,
      personality: personality.type
    };
  }

  // Get random template from style
  getRandomTemplate(style) {
    const templates = this.commentTemplates[style] || this.commentTemplates.casual;
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // Add personality touch to comment
  addPersonalityTouch(comment, personality) {
    // Modify comment based on personality traits
    if (personality.confidence > 0.8) {
      comment = comment.replace(/might|maybe|probably/gi, 'definitely will');
    }
    
    if (personality.aggression > 0.7) {
      comment = comment.toUpperCase();
    }
    
    if (personality.optimism > 0.8 && Math.random() > 0.7) {
      comment += ' ' + this.getRandomTemplate('hype').split(' ')[0];
    }
    
    return comment;
  }

  // Add random emojis to comment
  addRandomEmojis(comment) {
    // Don't add emojis if comment already has many
    const emojiCount = (comment.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
    
    if (emojiCount >= 3) return comment;
    
    // Randomly add 1-2 emojis
    if (Math.random() > 0.3) {
      const emojiTypes = Object.keys(this.emojiSets);
      const randomType = emojiTypes[Math.floor(Math.random() * emojiTypes.length)];
      const emojis = this.emojiSets[randomType];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      
      // Add at random position
      if (Math.random() > 0.5) {
        comment = randomEmoji + ' ' + comment;
      } else {
        comment = comment + ' ' + randomEmoji;
      }
    }
    
    return comment;
  }

  // Post comment to platform
  async postComment(account, comment) {
    try {
      console.log(`📝 ${account.username}: "${comment.text}" on ${this.currentToken.platform}`);
      
      // Use platform integration to post comment
      const result = await this.platformIntegration.postComment(
        this.currentToken.platform,
        this.currentToken.address,
        comment.text,
        account
      );
      
      if (result.success) {
        console.log(`✅ Comment posted successfully: ${result.threadUrl}`);
        
        // Track engagement after posting
        setTimeout(async () => {
          const engagement = await this.platformIntegration.trackCommentEngagement(
            result.platform,
            result.commentId
          );
          account.engagement.likes += engagement.likes;
          account.engagement.replies += engagement.replies;
        }, 60000); // Check after 1 minute
      }
      
      return result;
    } catch (error) {
      console.error('Failed to post comment:', error);
      return { success: false, error: error.message };
    }
  }

  // Execute trend-based comment
  async executeTrendBasedComment() {
    // Get market trends and post relevant comments
    const trendData = await this.getTrendingData();
    
    if (trendData.isPositive) {
      const account = this.getAvailableAccount();
      if (account) {
        const comment = this.generateTrendComment(account, trendData);
        await this.postComment(account, comment);
      }
    }
  }

  // Get trending data
  async getTrendingData() {
    // Simulate trend analysis
    return {
      isPositive: Math.random() > 0.4,
      momentum: Math.random() > 0.5 ? 'strong' : 'weak',
      volume: Math.random() > 0.5 ? 'increasing' : 'stable'
    };
  }

  // Generate trend-based comment
  generateTrendComment(account, trendData) {
    let style = 'bullish';
    
    if (trendData.momentum === 'strong') {
      style = 'hype';
    } else if (trendData.volume === 'increasing') {
      style = 'fomo';
    }
    
    const baseComment = this.getRandomTemplate(style);
    return {
      text: this.addRandomEmojis(baseComment),
      style: style,
      personality: account.personality.type
    };
  }

  // Monitor engagement
  async monitorEngagement() {
    // Track engagement on posted comments
    for (const account of this.commentAccounts) {
      // Simulate engagement tracking
      const randomEngagement = Math.floor(Math.random() * 5);
      account.engagement.likes += randomEngagement;
      
      if (randomEngagement > 3) {
        account.engagement.replies += 1;
        this.stats.engagementGenerated += randomEngagement;
      }
    }
  }

  // Get comments in last hour
  getCommentsInLastHour() {
    const oneHourAgo = Date.now() - 3600000;
    return this.commentHistory.filter(comment => comment.timestamp > oneHourAgo).length;
  }

  // Get account comments today
  getAccountCommentsToday(accountId) {
    const oneDayAgo = Date.now() - 86400000;
    return this.commentHistory.filter(comment => 
      comment.account === accountId && comment.timestamp > oneDayAgo
    ).length;
  }

  // Get random interval
  getRandomInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Update comment statistics
  updateCommentStats(success) {
    this.stats.totalComments++;
    
    if (success) {
      this.stats.successfulComments++;
      this.stats.platformStats[this.currentToken.platform].comments++;
    } else {
      this.stats.failedComments++;
    }

    this.stats.uptime = Date.now() - this.startTime;
  }

  // Stop comment bot
  async stopCommenting() {
    if (!this.isRunning) return;

    console.log('🛑 Stopping comment bot...');
    this.isRunning = false;

    this.emit('commentingStopped', {
      stats: this.getStats(),
      runtime: Date.now() - this.startTime
    });

    console.log('✅ Comment bot stopped');
  }

  // Get comment bot statistics
  getStats() {
    const runtime = this.isRunning ? Date.now() - this.startTime : this.stats.uptime;
    const commentsPerHour = this.stats.totalComments * (3600000 / runtime);
    
    return {
      ...this.stats,
      runtime,
      commentsPerHour: commentsPerHour.toFixed(2),
      successRate: (this.stats.successfulComments / this.stats.totalComments * 100).toFixed(2) + '%',
      averageEngagement: (this.stats.engagementGenerated / this.stats.successfulComments).toFixed(2),
      accountsActive: this.commentAccounts.filter(a => a.commentsPosted > 0).length,
      totalEngagement: this.getTotalEngagement()
    };
  }

  // Get total engagement across all accounts
  getTotalEngagement() {
    return this.commentAccounts.reduce((total, account) => {
      return total + account.engagement.likes + account.engagement.replies + account.engagement.mentions;
    }, 0);
  }

  // Get comment history
  getCommentHistory(limit = 50) {
    return this.commentHistory.slice(-limit);
  }

  // Get account statistics
  getAccountStats() {
    return this.commentAccounts.map(account => ({
      username: account.username,
      commentsPosted: account.commentsPosted,
      engagement: account.engagement,
      personality: account.personality.type,
      preferredStyle: account.preferredStyle,
      lastActive: account.lastCommentTime
    }));
  }

  // Manual comment trigger
  async postManualComment(text, accountId = null) {
    if (!this.isRunning) {
      throw new Error('Comment bot not running');
    }

    let account;
    if (accountId) {
      account = this.commentAccounts.find(a => a.id === accountId);
    } else {
      account = this.getAvailableAccount();
    }

    if (!account) {
      throw new Error('No available accounts');
    }

    const comment = {
      text: text,
      style: 'manual',
      personality: account.personality.type
    };

    console.log(`🔧 Manual comment posted: "${text}"`);
    
    return await this.postComment(account, comment);
  }

  // Emergency stop
  emergencyStop() {
    console.log('🚨 EMERGENCY STOP - Halting all commenting');
    this.isRunning = false;
    this.emit('emergencyStop', { timestamp: Date.now() });
  }
}

module.exports = CommentBot;