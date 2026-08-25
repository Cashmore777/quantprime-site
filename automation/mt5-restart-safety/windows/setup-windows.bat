@echo off
:: MT5 Restart Safety - Windows Setup
:: Run this as Administrator

echo ==========================================
echo MT5 Restart Safety Setup
echo ==========================================
echo.

:: Create directory
if not exist "C:\MT5" mkdir "C:\MT5"

:: Copy watchdog script
copy /Y "mt5-watchdog.ps1" "C:\MT5\mt5-watchdog.ps1"

:: Create scheduled task to run watchdog on startup
echo Creating startup task...
schtasks /create /tn "MT5-Watchdog" /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File C:\MT5\mt5-watchdog.ps1" /sc onstart /ru SYSTEM /rl HIGHEST /f

:: Create scheduled task to run watchdog every 5 minutes (backup)
echo Creating periodic task...
schtasks /create /tn "MT5-Watchdog-Periodic" /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File C:\MT5\mt5-watchdog.ps1" /sc minute /mo 5 /ru SYSTEM /rl HIGHEST /f

:: Enable auto-login (optional - requires password)
:: reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v AutoAdminLogon /t REG_SZ /d 1 /f
:: reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v DefaultUserName /t REG_SZ /d YOUR_USERNAME /f
:: reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v DefaultPassword /t REG_SZ /d YOUR_PASSWORD /f

echo.
echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo Tasks created:
echo  - MT5-Watchdog (runs on startup)
echo  - MT5-Watchdog-Periodic (runs every 5 minutes)
echo.
echo Next steps:
echo  1. Update MT5 paths in C:\MT5\mt5-watchdog.ps1
echo  2. Configure MT5 to save chart templates with EAs
echo  3. Reboot to test
echo.
pause
