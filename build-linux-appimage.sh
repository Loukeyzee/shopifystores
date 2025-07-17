#!/bin/bash

# Solana Launch Suite - Linux AppImage Creator
# Creates a portable, 1-click AppImage

echo "🐧 Creating Linux 1-click installer..."

# Download AppImageTool if not present
if [ ! -f "appimagetool-x86_64.AppImage" ]; then
    echo "📥 Downloading AppImageTool..."
    wget -q https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage
    chmod +x appimagetool-x86_64.AppImage
fi

# Create AppDir structure
mkdir -p appdir/usr/bin
mkdir -p appdir/usr/share/applications
mkdir -p appdir/usr/share/icons/hicolor/256x256/apps
mkdir -p appdir/usr/share/doc/solana-launch-suite

# Copy application files
cp -R dist/linux-unpacked/* appdir/usr/bin/
cp assets/icon.png appdir/usr/share/icons/hicolor/256x256/apps/solana-launch-suite.png
cp Solana-Launch-Suite-Guide.pdf appdir/usr/share/doc/solana-launch-suite/
cp README.md appdir/usr/share/doc/solana-launch-suite/
cp launchers/start-linux.sh appdir/usr/bin/

# Create desktop file
cat > appdir/usr/share/applications/solana-launch-suite.desktop << EOF
[Desktop Entry]
Type=Application
Name=Solana Launch Suite
Comment=Secure wallet generator and launch trading manager
Exec=solana-launch-suite
Icon=solana-launch-suite
Categories=Office;Finance;
Terminal=false
EOF

# Create AppRun
cat > appdir/AppRun << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
exec ./usr/bin/start-linux.sh "$@"
EOF
chmod +x appdir/AppRun

# Copy desktop file and icon to root
cp appdir/usr/share/applications/solana-launch-suite.desktop appdir/
cp appdir/usr/share/icons/hicolor/256x256/apps/solana-launch-suite.png appdir/

# Create AppImage
./appimagetool-x86_64.AppImage appdir dist/Solana-Launch-Suite-Linux.AppImage

# Cleanup
rm -rf appdir

echo "✅ Linux AppImage created successfully!"
echo "📦 File: dist/Solana-Launch-Suite-Linux.AppImage"
echo ""
echo "🎯 This AppImage provides:"
echo "   • Zero installation required"
echo "   • Portable across distributions"
echo "   • Complete PDF guide included"
echo "   • 1-click launch experience"
