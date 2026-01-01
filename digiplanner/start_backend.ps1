# PowerShell script to start Smart Planner Backend

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Starting Smart Planner Backend Server" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python from https://www.python.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Flask is installed
try {
    python -c "import flask" 2>&1 | Out-Null
    Write-Host "Dependencies are installed" -ForegroundColor Green
} catch {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "Starting backend server on http://localhost:5000..." -ForegroundColor Green
Write-Host "Press CTRL+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the backend
python run_backend.py
