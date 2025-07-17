
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
DefaultDirName={autopf}\Solana Launch Suite
DefaultGroupName=Solana Launch Suite
DisableProgramGroupPage=yes
LicenseFile=LICENSE.txt
OutputDir=dist
OutputBaseFilename=Solana-Launch-Suite-Windows-Installer
SetupIconFile=assets\icon.ico
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
Source: "dist\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "Solana-Launch-Suite-Guide.pdf"; DestDir: "{app}"; Flags: ignoreversion
Source: "launchers\start-windows.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "LICENSE.txt"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Solana Launch Suite"; Filename: "{app}\Solana Launch Suite.exe"
Name: "{group}\User Guide (PDF)"; Filename: "{app}\Solana-Launch-Suite-Guide.pdf"
Name: "{group}\Quick Start"; Filename: "{app}\start-windows.bat"
Name: "{group}\{cm:UninstallProgram,Solana Launch Suite}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Solana Launch Suite"; Filename: "{app}\Solana Launch Suite.exe"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\Solana Launch Suite"; Filename: "{app}\Solana Launch Suite.exe"; Tasks: quicklaunchicon

[Run]
Filename: "{app}\Solana Launch Suite.exe"; Description: "{cm:LaunchProgram,Solana Launch Suite}"; Flags: nowait postinstall skipifsilent

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
