param(
    [switch]$Install
)

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Join-Path $projectRoot "frontend"

if (-not (Test-Path $frontendDir)) {
    Write-Error "Folder frontend tidak ditemukan di $frontendDir"
    exit 1
}

Set-Location $frontendDir

if ($Install -or -not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    Write-Host "Menjalankan npm install..." -ForegroundColor Green
    npm install
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

Write-Host "Menjalankan frontend dari $frontendDir" -ForegroundColor Green
npm run dev
