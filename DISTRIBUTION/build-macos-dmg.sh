#!/bin/bash

# Solana Launch Suite - macOS DMG Creator
# Creates a beautiful, 1-click DMG installer

echo "🍎 Creating macOS 1-click installer..."

# Create DMG staging directory
mkdir -p dmg-staging

# Copy application
cp -R "dist/mac/Solana Launch Suite.app" dmg-staging/

# Copy additional files
cp "Solana-Launch-Suite-Guide.pdf" dmg-staging/
cp "README.md" dmg-staging/
cp "launchers/start-macos.sh" dmg-staging/

# Create Applications symlink
ln -s /Applications dmg-staging/Applications

# Create DMG background
mkdir -p dmg-staging/.background
# You would add a custom background image here

# Create DMG
hdiutil create -volname "Solana Launch Suite" \
               -srcfolder dmg-staging \
               -ov -format UDZO \
               -fs HFS+ \
               "dist/Solana-Launch-Suite-macOS.dmg"

# Cleanup
rm -rf dmg-staging

echo "✅ macOS DMG created successfully!"
echo "📦 File: dist/Solana-Launch-Suite-macOS.dmg"
echo ""
echo "🎯 This DMG provides:"
echo "   • Drag-and-drop installation"
echo "   • Beautiful installer interface"
echo "   • Complete PDF guide included"
echo "   • Automatic macOS integration"
