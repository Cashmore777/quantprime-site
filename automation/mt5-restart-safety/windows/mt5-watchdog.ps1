# MT5 Watchdog for Windows VPS
# Monitors MT5 terminals and restarts if crashed

$ErrorActionPreference = "SilentlyContinue"

# Configuration - UPDATE THESE PATHS
$MT5_PATHS = @(
    "C:\Program Files\MetaTrader 5\terminal64.exe",
    "C:\Program Files\MetaTrader 5 IC Markets\terminal64.exe"
)

$LOG_FILE = "C:\MT5\watchdog.log"
$CHECK_INTERVAL = 60  # seconds

# Create log directory
$logDir = Split-Path $LOG_FILE
if (!(Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force
}

function Write-Log {
    param($Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Out-File -Append $LOG_FILE
    Write-Host "$timestamp - $Message"
}

function Get-MT5Processes {
    Get-Process -Name "terminal64" -ErrorAction SilentlyContinue
}

function Start-MT5 {
    param($Path)
    
    if (Test-Path $Path) {
        Write-Log "Starting MT5: $Path"
        Start-Process -FilePath $Path -ArgumentList "/portable"
        Start-Sleep -Seconds 10
        
        # Wait for MT5 to fully load
        $timeout = 60
        $elapsed = 0
        while ($elapsed -lt $timeout) {
            $proc = Get-Process -Name "terminal64" -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $Path }
            if ($proc) {
                Write-Log "MT5 started successfully: PID $($proc.Id)"
                return $true
            }
            Start-Sleep -Seconds 5
            $elapsed += 5
        }
        Write-Log "WARNING: MT5 may not have started properly"
        return $false
    } else {
        Write-Log "ERROR: MT5 not found at $Path"
        return $false
    }
}

function Start-AllMT5 {
    foreach ($path in $MT5_PATHS) {
        if (Test-Path $path) {
            $running = Get-Process -Name "terminal64" -ErrorAction SilentlyContinue | 
                       Where-Object { $_.Path -eq $path }
            
            if (!$running) {
                Start-MT5 -Path $path
            }
        }
    }
}

# Main watchdog loop
Write-Log "=========================================="
Write-Log "MT5 Watchdog Started"
Write-Log "Checking every $CHECK_INTERVAL seconds"
Write-Log "=========================================="

# Initial start
Start-AllMT5

while ($true) {
    Start-Sleep -Seconds $CHECK_INTERVAL
    
    $procs = Get-MT5Processes
    
    if ($procs.Count -eq 0) {
        Write-Log "ALERT: No MT5 processes found! Restarting..."
        Start-AllMT5
    } else {
        # Optional: Log that everything is OK (comment out to reduce log spam)
        # Write-Log "OK: $($procs.Count) MT5 process(es) running"
    }
    
    # Check each configured MT5
    foreach ($path in $MT5_PATHS) {
        if (Test-Path $path) {
            $running = Get-Process -Name "terminal64" -ErrorAction SilentlyContinue | 
                       Where-Object { $_.Path -eq $path }
            
            if (!$running) {
                Write-Log "ALERT: MT5 not running: $path"
                Start-MT5 -Path $path
            }
        }
    }
}
