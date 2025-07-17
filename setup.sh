#!/bin/bash

# Solana Bundler Bot Setup Script
# This script helps you set up the project for first-time use

set -e

echo "🚀 Setting up Solana Bundler Bot..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+ and try again."
    exit 1
fi

echo "✅ Node.js version $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
if command -v yarn &> /dev/null; then
    yarn install
else
    npm install
fi

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration before running the bot"
else
    echo "✅ .env file already exists"
fi

# Build the project
echo "🔨 Building TypeScript project..."
if command -v yarn &> /dev/null; then
    yarn build
else
    npm run build
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit the .env file with your configuration:"
echo "   nano .env"
echo ""
echo "2. Start the bot:"
echo "   npm start"
echo ""
echo "3. Or run in development mode:"
echo "   npm run dev"
echo ""
echo "4. For help and documentation:"
echo "   npm start -- --help"
echo "   cat README.md"
echo "   cat SOLANA_BUNDLER_GUIDE.md"
echo ""
echo "⚠️  Important: Make sure you have:"
echo "   - A Solana wallet with SOL for gas fees"
echo "   - Configured the .env file with your private keys"
echo "   - Tested on devnet before using mainnet"
echo ""
echo "Happy bundling! 🛡️"