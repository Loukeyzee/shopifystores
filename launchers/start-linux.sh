#!/bin/bash
echo "🚀 Starting Solana Launch Suite..."
echo ""
echo "✅ Secure wallet generator"
echo "✅ Launch trading manager"
echo "✅ Real-time protection"  
echo ""
echo "Please wait while the application loads..."

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Make executable and launch
chmod +x "./Solana Launch Suite.AppImage"
"./Solana Launch Suite.AppImage"

exit 0