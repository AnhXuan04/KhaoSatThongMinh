$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$aiPath = Join-Path $root "ai-service"
$pythonPath = Join-Path $aiPath "venv\Scripts\python.exe"
$envPath = Join-Path $aiPath ".env"

if (-not (Test-Path $pythonPath)) {
    Write-Host "AI venv not found. Recreate it first:" -ForegroundColor Yellow
    Write-Host "cd ai-service"
    Write-Host '$PY="C:\Users\ADMIN\AppData\Local\Python\pythoncore-3.14-64\python.exe"'
    Write-Host "& `$PY -m venv .\venv --clear"
    Write-Host ".\venv\Scripts\python.exe -m pip install -r requirements.txt"
    exit 1
}

Set-Location $aiPath

if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
            return
        }

        $key, $value = $line.Split("=", 2)
        $key = $key.Trim()
        $value = $value.Trim().Trim('"').Trim("'")
        if ($key) {
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

if (-not $env:LLM_PROVIDER) {
    $env:LLM_PROVIDER = "gemini"
}

if (-not $env:GEMINI_MODEL) {
    $env:GEMINI_MODEL = "gemini-2.5-flash"
}

Write-Host "AI Service: http://127.0.0.1:5000" -ForegroundColor Cyan
& $pythonPath -m uvicorn main:app --host 127.0.0.1 --port 5000
