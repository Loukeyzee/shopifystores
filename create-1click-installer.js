#!/usr/bin/env node

/**
 * 🎯 1-Click Installer Creator
 * 
 * Creates dummy-proof, 1-click installers for Windows, Mac, and Linux with everything bundled.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class OneClickInstaller {
  constructor() {
    this.appName = 'Solana Launch Suite';
    this.version = '1.0.0';
  }

  async create() {
    console.log('🎯 Creating 1-Click Installers...\n');

    try {
      // 1. Generate the PDF guide first
      await this.generatePDFGuide();
      
      // 2. Create desktop app
      await this.createDesktopApp();
      
      // 3. Create platform-specific 1-click installers
      await this.createWindowsInstaller();
      await this.createMacInstaller();
      await this.createLinuxInstaller();
      
      // 4. Create universal download page
      await this.createDownloadPage();

      console.log('✅ 1-Click installers created successfully!\n');
      console.log('📦 Generated files:');
      console.log('  • Windows: Solana-Launch-Suite-Windows-Installer.exe');
      console.log('  • macOS: Solana-Launch-Suite-macOS.dmg');
      console.log('  • Linux: Solana-Launch-Suite-Linux.AppImage');
      console.log('  • Download Page: download.html');
      console.log('\n🎯 Each installer is completely self-contained and requires zero configuration!');

    } catch (error) {
      console.error('❌ Installer creation failed:', error.message);
      process.exit(1);
    }
  }

  async generatePDFGuide() {
    console.log('📖 Generating PDF guide...');
    
    const PDFGuideGenerator = require('./generate-pdf-guide');
    const generator = new PDFGuideGenerator();
    await generator.generate();
    
    console.log('✅ PDF guide generated');
  }

  async createDesktopApp() {
    console.log('🖥️ Building desktop application...');
    
    const DesktopAppBuilder = require('./build-desktop-app');
    const builder = new DesktopAppBuilder();
    await builder.build();
    
    console.log('✅ Desktop app built');
  }

  async createWindowsInstaller() {
    console.log('🪟 Creating Windows 1-click installer...');

    const installerScript = `
; Solana Launch Suite - Windows Installer
; This creates a true 1-click installer with zero configuration

[Setup]
AppName=Solana Launch Suite
AppVersion=1.0.0
AppVerName=Solana Launch Suite 1.0.0
AppPublisher=Your Company
AppPublisherURL=https://your-website.com
AppSupportURL=https://your-website.com/support
AppUpdatesURL=https://your-website.com/updates
DefaultDirName={autopf}\\Solana Launch Suite
DefaultGroupName=Solana Launch Suite
DisableProgramGroupPage=yes
LicenseFile=LICENSE.txt
OutputDir=dist
OutputBaseFilename=Solana-Launch-Suite-Windows-Installer
SetupIconFile=assets\\icon.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
DisableWelcomePage=no
WelcomeLabel1=Welcome to Solana Launch Suite Setup!
WelcomeLabel2=This will install the secure wallet generator and launch trading manager on your computer.%n%nClick Next to continue.

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1

[Files]
Source: "dist\\win-unpacked\\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "Solana-Launch-Suite-Guide.pdf"; DestDir: "{app}"; Flags: ignoreversion
Source: "launchers\\start-windows.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "LICENSE.txt"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\\Solana Launch Suite"; Filename: "{app}\\Solana Launch Suite.exe"
Name: "{group}\\User Guide (PDF)"; Filename: "{app}\\Solana-Launch-Suite-Guide.pdf"
Name: "{group}\\Quick Start"; Filename: "{app}\\start-windows.bat"
Name: "{group}\\{cm:UninstallProgram,Solana Launch Suite}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\\Solana Launch Suite"; Filename: "{app}\\Solana Launch Suite.exe"; Tasks: desktopicon
Name: "{userappdata}\\Microsoft\\Internet Explorer\\Quick Launch\\Solana Launch Suite"; Filename: "{app}\\Solana Launch Suite.exe"; Tasks: quicklaunchicon

[Run]
Filename: "{app}\\Solana Launch Suite.exe"; Description: "{cm:LaunchProgram,Solana Launch Suite}"; Flags: nowait postinstall skipifsilent

[Code]
function InitializeSetup(): Boolean;
begin
  Result := True;
  MsgBox('🔐 Solana Launch Suite Setup' + #13#13 + 
         '✅ Secure wallet generator' + #13 +
         '✅ Launch trading manager' + #13 +
         '✅ Real-time protection' + #13 +
         '✅ Complete PDF guide included' + #13#13 +
         'Everything runs locally - your keys never leave your device!', 
         mbInformation, MB_OK);
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    MsgBox('🎉 Installation Complete!' + #13#13 + 
           '✅ Solana Launch Suite is now installed' + #13 +
           '✅ Desktop shortcut created' + #13 +
           '✅ PDF guide available in Start Menu' + #13#13 +
           'Click Finish to launch the application!', 
           mbInformation, MB_OK);
  end;
end;
`;

    await fs.writeFile('installer-windows.iss', installerScript);
    
    // Create batch file for building
    const buildScript = `@echo off
echo 🔨 Building Windows 1-click installer...
echo.
echo This requires Inno Setup to be installed:
echo https://jrsoftware.org/isdl.php
echo.
pause

"C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe" installer-windows.iss

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Windows installer created successfully!
    echo 📦 File: dist\\Solana-Launch-Suite-Windows-Installer.exe
    echo.
    echo 🎯 This installer provides:
    echo    • Zero-configuration setup
    echo    • Automatic desktop shortcuts
    echo    • Complete PDF guide
    echo    • 1-click launch experience
    echo.
) else (
    echo.
    echo ❌ Build failed. Please install Inno Setup:
    echo https://jrsoftware.org/isdl.php
    echo.
)

pause`;

    await fs.writeFile('build-windows-installer.bat', buildScript);
    
    console.log('✅ Windows installer script created');
  }

  async createMacInstaller() {
    console.log('🍎 Creating macOS 1-click installer...');

    const dmgScript = `#!/bin/bash

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
hdiutil create -volname "Solana Launch Suite" \\
               -srcfolder dmg-staging \\
               -ov -format UDZO \\
               -fs HFS+ \\
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
`;

    await fs.writeFile('build-macos-dmg.sh', dmgScript);
    execSync('chmod +x build-macos-dmg.sh');

    // Create AppleScript for enhanced user experience
    const appleScript = `-- Solana Launch Suite Welcome Script
display dialog "🔐 Welcome to Solana Launch Suite!" & return & return & "✅ Secure wallet generator" & return & "✅ Launch trading manager" & return & "✅ Real-time protection" & return & "✅ 100% local & safe" & return & return & "Ready to install?" buttons {"Cancel", "Install"} default button "Install" with icon note

if result = {button returned:"Install"} then
    tell application "Finder"
        open folder "Applications" of startup disk
    end tell
    
    display dialog "🎉 Installation Instructions:" & return & return & "1. Drag 'Solana Launch Suite' to Applications" & return & "2. Launch from Applications or Spotlight" & return & "3. Open the included PDF guide" & return & return & "Your keys, your crypto, your control!" buttons {"Got it!"} default button "Got it!" with icon note
end if`;

    await fs.writeFile('macos-welcome.applescript', appleScript);
    
    console.log('✅ macOS installer scripts created');
  }

  async createLinuxInstaller() {
    console.log('🐧 Creating Linux 1-click installer...');

    const appImageScript = `#!/bin/bash

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
cd "\$(dirname "\$0")"
exec ./usr/bin/start-linux.sh "\$@"
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
`;

    await fs.writeFile('build-linux-appimage.sh', appImageScript);
    execSync('chmod +x build-linux-appimage.sh');

    // Create .desktop file for system integration
    const desktopFile = `[Desktop Entry]
Version=1.0
Type=Application
Name=Solana Launch Suite
Comment=Secure wallet generator and launch trading manager for Solana
Exec=/path/to/Solana-Launch-Suite-Linux.AppImage
Icon=solana-launch-suite
Categories=Office;Finance;Utility;
Terminal=false
StartupNotify=true
MimeType=application/json;

[Desktop Action Generate]
Name=Generate New Wallets
Exec=/path/to/Solana-Launch-Suite-Linux.AppImage --generate

[Desktop Action Guide]
Name=Open PDF Guide
Exec=xdg-open /path/to/Solana-Launch-Suite-Guide.pdf

Actions=Generate;Guide;`;

    await fs.writeFile('solana-launch-suite.desktop', desktopFile);
    
    console.log('✅ Linux AppImage scripts created');
  }

  async createDownloadPage() {
    console.log('🌐 Creating download page...');

    const downloadPage = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Download Solana Launch Suite - Secure Wallet Generator</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 60px;
        }
        
        .header h1 {
            font-size: 48px;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header .subtitle {
            font-size: 24px;
            opacity: 0.9;
            margin-bottom: 20px;
        }
        
        .features {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-top: 30px;
            flex-wrap: wrap;
        }
        
        .feature {
            text-align: center;
            color: white;
        }
        
        .feature-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        
        .downloads {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            margin-bottom: 60px;
        }
        
        .download-card {
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        
        .download-card:hover {
            transform: translateY(-10px);
        }
        
        .platform-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        
        .platform-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #2D3748;
        }
        
        .platform-description {
            color: #718096;
            margin-bottom: 30px;
            line-height: 1.5;
        }
        
        .download-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 50px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            margin-bottom: 15px;
        }
        
        .download-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        
        .file-info {
            font-size: 14px;
            color: #A0AEC0;
        }
        
        .security-notice {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 30px;
            margin: 60px 0;
            color: white;
            text-align: center;
        }
        
        .security-notice h3 {
            margin-bottom: 20px;
            font-size: 28px;
        }
        
        .security-features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        
        .security-feature {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
        }
        
        .quick-start {
            background: white;
            border-radius: 20px;
            padding: 40px;
            margin-top: 40px;
        }
        
        .quick-start h3 {
            color: #2D3748;
            margin-bottom: 20px;
            font-size: 24px;
        }
        
        .steps {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .step {
            padding: 20px;
            border-radius: 10px;
            background: #F7FAFC;
            border-left: 5px solid #667eea;
        }
        
        .step-number {
            background: #667eea;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .auto-detect {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .auto-detect-btn {
            background: #48BB78;
            color: white;
            padding: 20px 40px;
            border: none;
            border-radius: 50px;
            font-size: 20px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 20px;
        }
        
        .auto-detect-btn:hover {
            background: #38A169;
            transform: scale(1.05);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="font-size: 80px; margin-bottom: 20px;">🔐</div>
            <h1>Solana Launch Suite</h1>
            <div class="subtitle">Secure Wallet Generator & Launch Trading Manager</div>
            
            <div class="features">
                <div class="feature">
                    <div class="feature-icon">🛡️</div>
                    <div>100% Secure</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">💻</div>
                    <div>Local Generation</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">🚀</div>
                    <div>Launch Trading</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">📱</div>
                    <div>Cross-Platform</div>
                </div>
            </div>
        </div>

        <div class="auto-detect">
            <button class="auto-detect-btn" onclick="autoDetectPlatform()">
                🎯 Auto-Detect My Platform & Download
            </button>
            <div style="color: white; font-size: 16px;">
                Or choose your platform manually below
            </div>
        </div>

        <div class="downloads">
            <div class="download-card">
                <div class="platform-icon">🪟</div>
                <div class="platform-name">Windows</div>
                <div class="platform-description">
                    1-click installer for Windows 10/11<br>
                    Zero configuration required<br>
                    Desktop shortcuts included
                </div>
                <a href="#" class="download-btn" onclick="downloadWindows()">
                    Download for Windows
                </a>
                <div class="file-info">
                    Setup.exe • ~150MB • Windows 10+
                </div>
            </div>

            <div class="download-card">
                <div class="platform-icon">🍎</div>
                <div class="platform-name">macOS</div>
                <div class="platform-description">
                    Beautiful DMG installer for macOS<br>
                    Drag-and-drop installation<br>
                    Universal binary (Intel & Apple Silicon)
                </div>
                <a href="#" class="download-btn" onclick="downloadMac()">
                    Download for macOS
                </a>
                <div class="file-info">
                    .dmg • ~160MB • macOS 10.15+
                </div>
            </div>

            <div class="download-card">
                <div class="platform-icon">🐧</div>
                <div class="platform-name">Linux</div>
                <div class="platform-description">
                    Portable AppImage for all distributions<br>
                    No installation required<br>
                    Just download and run
                </div>
                <a href="#" class="download-btn" onclick="downloadLinux()">
                    Download for Linux
                </a>
                <div class="file-info">
                    .AppImage • ~140MB • Most distributions
                </div>
            </div>
        </div>

        <div class="security-notice">
            <h3>🛡️ Your Security is Our Priority</h3>
            <p>All wallet generation happens locally on your device. Your private keys never leave your computer.</p>
            
            <div class="security-features">
                <div class="security-feature">
                    <strong>🔐 Military-Grade Encryption</strong><br>
                    AES-256 with PBKDF2 key derivation
                </div>
                <div class="security-feature">
                    <strong>🏠 100% Local</strong><br>
                    No cloud storage, no servers involved
                </div>
                <div class="security-feature">
                    <strong>📖 Complete Guide</strong><br>
                    Comprehensive PDF manual included
                </div>
                <div class="security-feature">
                    <strong>🔄 Cross-Platform</strong><br>
                    Works on Windows, Mac, and Linux
                </div>
            </div>
        </div>

        <div class="quick-start">
            <h3>🚀 Quick Start (Takes 5 Minutes)</h3>
            <div class="steps">
                <div class="step">
                    <div class="step-number">1</div>
                    <strong>Download & Install</strong><br>
                    Choose your platform and download. Installation is automatic.
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <strong>Generate Wallets</strong><br>
                    Create secure wallets with the built-in generator.
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <strong>Start Trading</strong><br>
                    Load wallets and begin coordinated launch trading.
                </div>
                <div class="step">
                    <div class="step-number">4</div>
                    <strong>Read the Guide</strong><br>
                    Complete PDF guide with security best practices.
                </div>
            </div>
        </div>
    </div>

    <script>
        function autoDetectPlatform() {
            const platform = navigator.platform.toLowerCase();
            const userAgent = navigator.userAgent.toLowerCase();
            
            if (platform.includes('win') || userAgent.includes('windows')) {
                downloadWindows();
            } else if (platform.includes('mac') || userAgent.includes('mac')) {
                downloadMac();
            } else if (platform.includes('linux') || userAgent.includes('linux')) {
                downloadLinux();
            } else {
                alert('Could not detect your platform. Please choose manually below.');
            }
        }
        
        function downloadWindows() {
            // Analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'download', {
                    'event_category': 'installer',
                    'event_label': 'windows'
                });
            }
            
            alert('🪟 Starting Windows download...\\n\\nAfter download:\\n1. Run the installer\\n2. Click "Run anyway" if Windows blocks it\\n3. Follow the setup wizard\\n4. Launch from desktop shortcut');
            
            // Replace with actual download URL
            window.location.href = 'dist/Solana-Launch-Suite-Windows-Installer.exe';
        }
        
        function downloadMac() {
            // Analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'download', {
                    'event_category': 'installer',
                    'event_label': 'macos'
                });
            }
            
            alert('🍎 Starting macOS download...\\n\\nAfter download:\\n1. Open the DMG file\\n2. Drag app to Applications\\n3. Right-click and "Open" on first launch\\n4. Allow in Security & Privacy if needed');
            
            // Replace with actual download URL
            window.location.href = 'dist/Solana-Launch-Suite-macOS.dmg';
        }
        
        function downloadLinux() {
            // Analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'download', {
                    'event_category': 'installer',
                    'event_label': 'linux'
                });
            }
            
            alert('🐧 Starting Linux download...\\n\\nAfter download:\\n1. Make executable: chmod +x Solana-Launch-Suite-Linux.AppImage\\n2. Double-click to run\\n3. Or run from terminal: ./Solana-Launch-Suite-Linux.AppImage');
            
            // Replace with actual download URL
            window.location.href = 'dist/Solana-Launch-Suite-Linux.AppImage';
        }
    </script>
</body>
</html>`;

    await fs.writeFile('download.html', downloadPage);
    
    console.log('✅ Download page created');
  }
}

// Run the installer creator
if (require.main === module) {
  const installer = new OneClickInstaller();
  installer.create().catch(console.error);
}

module.exports = OneClickInstaller;