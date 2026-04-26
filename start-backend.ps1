param(
    [string]$JavaHome = "C:\Program Files\Java\jdk-25.0.2",
    [string]$MysqlHost = "localhost",
    [string]$MysqlPort = "3306",
    [string]$MysqlDatabase = "posdb",
    [string]$MysqlUsername = "root",
    [string]$MysqlPassword = "",
    [switch]$AllowEmptyMysqlPassword,
    [switch]$SeedUsers,
    [string]$SeedOwnerPassword = "",
    [string]$SeedStaff1Password = "",
    [string]$SeedStaff2Password = ""
)

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $projectRoot "backend"

function Test-BackendReady {
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:8080/api/master/products" -TimeoutSec 3
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
    } catch {
        return $false
    }
}

if (-not (Test-Path $backendDir)) {
    Write-Error "Folder backend tidak ditemukan di $backendDir"
    exit 1
}

if (Test-BackendReady) {
    Write-Host "Backend sudah aktif di http://localhost:8080" -ForegroundColor Green
    exit 0
}

if ($MysqlPassword -eq '""' -or $MysqlPassword -eq "''") {
    $MysqlPassword = ""
}

if (-not $env:JAVA_HOME -or -not (Test-Path $env:JAVA_HOME)) {
    if (Test-Path $JavaHome) {
        $env:JAVA_HOME = $JavaHome
    } else {
        Write-Error "JAVA_HOME belum valid. Set permanen di Windows atau ubah parameter -JavaHome."
        exit 1
    }
}

if (-not $AllowEmptyMysqlPassword -and [string]::IsNullOrEmpty($MysqlPassword)) {
    Write-Error "MYSQL_PASSWORD is required. Pass -MysqlPassword or use -AllowEmptyMysqlPassword only for a local throwaway database."
    exit 1
}

if ($SeedUsers -and (
        [string]::IsNullOrWhiteSpace($SeedOwnerPassword) -or
        [string]::IsNullOrWhiteSpace($SeedStaff1Password) -or
        [string]::IsNullOrWhiteSpace($SeedStaff2Password))) {
    Write-Error "Seed user passwords are required when -SeedUsers is enabled."
    exit 1
}

$env:MYSQL_HOST = $MysqlHost
$env:MYSQL_PORT = $MysqlPort
$env:MYSQL_DATABASE = $MysqlDatabase
$env:MYSQL_USERNAME = $MysqlUsername
$env:MYSQL_PASSWORD = $MysqlPassword
$env:POS_SEED_USERS_ENABLED = $SeedUsers.ToString().ToLowerInvariant()
$env:POS_SEED_OWNER_PASSWORD = $SeedOwnerPassword
$env:POS_SEED_STAFF1_PASSWORD = $SeedStaff1Password
$env:POS_SEED_STAFF2_PASSWORD = $SeedStaff2Password

Write-Host "Menjalankan backend dari $backendDir" -ForegroundColor Green
Write-Host "JAVA_HOME: $env:JAVA_HOME" -ForegroundColor DarkGray
Write-Host ("MySQL: {0}@{1}:{2}/{3}" -f $env:MYSQL_USERNAME, $env:MYSQL_HOST, $env:MYSQL_PORT, $env:MYSQL_DATABASE) -ForegroundColor DarkGray
Write-Host "Seed users enabled: $env:POS_SEED_USERS_ENABLED" -ForegroundColor DarkGray

Set-Location $backendDir
& .\mvnw.cmd spring-boot:run
