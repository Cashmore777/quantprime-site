# MT5 Restart Safety System

Ensures MT5 and EAs automatically restart after VPS reboot or crash.

## Components

### For Windows VPS:
1. `mt5-watchdog.ps1` - PowerShell watchdog script
2. `setup-windows.bat` - One-time setup to create scheduled tasks

### For Linux VPS (Wine):
1. `mt5-watchdog.sh` - Bash watchdog script  
2. `mt5.service` - Systemd service file
3. `setup-linux.sh` - One-time setup script

## How It Works

1. **On Boot**: Automatically starts MT5 terminal(s)
2. **Watchdog**: Checks every 60 seconds if MT5 is running
3. **Auto-Restart**: If MT5 crashes, restarts it within 2 minutes
4. **EA Persistence**: EAs are loaded via chart templates (must be configured in MT5)

## Setup Instructions

### Windows VPS:
```powershell
# Run as Administrator
.\setup-windows.bat
```

### Linux VPS:
```bash
chmod +x setup-linux.sh
sudo ./setup-linux.sh
```

## MT5 Configuration Required

1. Save chart templates with EAs attached:
   - Right-click chart → Template → Save Template → "recoil-eurusd"
   - Right-click chart → Template → Save Template → "meridian-eurusd"

2. Set MT5 to load templates on startup:
   - Tools → Options → Charts → "Default template" = your template

3. Enable auto-trading:
   - Tools → Options → Expert Advisors → "Allow automated trading"
   - Check "Allow DLL imports" if needed

## Monitoring

Check status:
```bash
# Linux
sudo systemctl status mt5-watchdog

# Windows
Get-ScheduledTask -TaskName "MT5-Watchdog"
```

## Logs

- Windows: `C:\MT5\watchdog.log`
- Linux: `/var/log/mt5-watchdog.log`
