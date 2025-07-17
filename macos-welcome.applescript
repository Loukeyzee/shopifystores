-- Solana Launch Suite Welcome Script
display dialog "🔐 Welcome to Solana Launch Suite!" & return & return & "✅ Secure wallet generator" & return & "✅ Launch trading manager" & return & "✅ Real-time protection" & return & "✅ 100% local & safe" & return & return & "Ready to install?" buttons {"Cancel", "Install"} default button "Install" with icon note

if result = {button returned:"Install"} then
    tell application "Finder"
        open folder "Applications" of startup disk
    end tell
    
    display dialog "🎉 Installation Instructions:" & return & return & "1. Drag 'Solana Launch Suite' to Applications" & return & "2. Launch from Applications or Spotlight" & return & "3. Open the included PDF guide" & return & return & "Your keys, your crypto, your control!" buttons {"Got it!"} default button "Got it!" with icon note
end if