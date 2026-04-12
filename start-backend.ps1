param(
    [string]$JavaHome = "C:\Program Files\Java\jdk-25.0.2",
    [string]$MysqlHost = "localhost",
    [string]$MysqlPort = "3306",
    [string]$MysqlDatabase = "posdb",
    [string]$MysqlUsername = "root",
    [string]$MysqlPassword = ""
)

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $projectRoot "backend"

if (-not (Test-Path $backendDir)) {
    Write-Error "Folder backend tidak ditemukan di $backendDir"
    exit 1
}

if (-not $env:JAVA_HOME -or -not (Test-Path $env:JAVA_HOME)) {
    if (Test-Path $JavaHome) {
        $env:JAVA_HOME = $JavaHome
    } else {
        Write-Error "JAVA_HOME belum valid. Set permanen di Windows atau ubah parameter -JavaHome."
        exit 1
    }
}

$env:MYSQL_HOST = $MysqlHost
$env:MYSQL_PORT = $MysqlPort
$env:MYSQL_DATABASE = $MysqlDatabase
$env:MYSQL_USERNAME = $MysqlUsername
$env:MYSQL_PASSWORD = $MysqlPassword

Write-Host "Menjalankan backend dari $backendDir" -ForegroundColor Green
Write-Host "JAVA_HOME: $env:JAVA_HOME" -ForegroundColor DarkGray
Write-Host "MySQL: $env:MYSQL_USERNAME@$env:MYSQL_HOST:$env:MYSQL_PORT/$env:MYSQL_DATABASE" -ForegroundColor DarkGray

Set-Location $backendDir
& .\mvnw.cmd spring-boot:run
