@echo off
echo 🔨 Building Windows 1-click installer...
echo.
echo This requires Inno Setup to be installed:
echo https://jrsoftware.org/isdl.php
echo.
pause

"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer-windows.iss

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Windows installer created successfully!
    echo 📦 File: dist\Solana-Launch-Suite-Windows-Installer.exe
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

pause