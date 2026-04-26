param(
    [string]$JavaHome = "C:\Program Files\Java\jdk-25.0.2",
    [string]$MysqlHost = "localhost",
    [string]$MysqlPort = "3306",
    [string]$MysqlDatabase = "posdb",
    [string]$MysqlUsername = "root",
    [string]$MysqlPassword = "",
    [string]$XamppPath = "C:\xampp",
    [int]$MysqlStartTimeoutSeconds = 30,
    [switch]$InstallFrontend,
    [switch]$SkipMysql,
    [switch]$SkipMysqlCredentialCheck,
    [switch]$RequireMysqlPassword,
    [switch]$SeedUsers,
    [string]$SeedOwnerPassword = "",
    [string]$SeedStaff1Password = "",
    [string]$SeedStaff2Password = ""
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendScript = Join-Path $projectRoot "start-backend.ps1"
$frontendScript = Join-Path $projectRoot "start-frontend.ps1"

function Test-TcpPort {
    param(
        [string]$HostName,
        [string]$Port
    )

    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $connect = $client.BeginConnect($HostName, [int]$Port, $null, $null)
        if (-not $connect.AsyncWaitHandle.WaitOne(1000, $false)) {
            return $false
        }
        $client.EndConnect($connect)
        return $true
    } catch {
        return $false
    } finally {
        $client.Close()
    }
}

function Start-XamppMysql {
    if ($SkipMysql) {
        Write-Host "Lewati start MySQL XAMPP karena -SkipMysql dipakai." -ForegroundColor Yellow
        return
    }

    if (Test-TcpPort -HostName $MysqlHost -Port $MysqlPort) {
        Write-Host "MySQL sudah aktif di $MysqlHost`:$MysqlPort." -ForegroundColor Green
        return
    }

    $mysqlStartBat = Join-Path $XamppPath "mysql_start.bat"
    $mysqldExe = Join-Path $XamppPath "mysql\bin\mysqld.exe"
    $myIni = Join-Path $XamppPath "mysql\bin\my.ini"

    if (Test-Path $mysqlStartBat) {
        Write-Host "Menyalakan MySQL XAMPP dari $mysqlStartBat ..." -ForegroundColor Green
        Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "`"$mysqlStartBat`"") -WorkingDirectory $XamppPath -WindowStyle Hidden
    } elseif (Test-Path $mysqldExe) {
        Write-Host "Menyalakan MySQL XAMPP dari $mysqldExe ..." -ForegroundColor Green
        $mysqlArgs = @()
        if (Test-Path $myIni) {
            $mysqlArgs += "--defaults-file=$myIni"
        }
        $mysqlArgs += "--standalone"
        Start-Process -FilePath $mysqldExe -ArgumentList $mysqlArgs -WorkingDirectory (Split-Path -Parent $mysqldExe) -WindowStyle Hidden
    } else {
        Write-Warning "XAMPP MySQL tidak ditemukan di $XamppPath. Jalankan XAMPP manual atau pakai -XamppPath."
        return
    }

    $deadline = (Get-Date).AddSeconds($MysqlStartTimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 1
        if (Test-TcpPort -HostName $MysqlHost -Port $MysqlPort) {
            Write-Host "MySQL sudah siap di $MysqlHost`:$MysqlPort." -ForegroundColor Green
            return
        }
    }

    Write-Warning "MySQL belum terdeteksi setelah $MysqlStartTimeoutSeconds detik. Backend tetap akan dijalankan."
}

function Start-PowershellScript {
    param(
        [string]$ScriptPath,
        [string[]]$ScriptArgs
    )

    if (-not (Test-Path $ScriptPath)) {
        throw "Script tidak ditemukan: $ScriptPath"
    }

    $args = @("-NoExit", "-ExecutionPolicy", "Bypass", "-File", $ScriptPath)
    $args += $ScriptArgs
    $argumentLine = ($args | ForEach-Object { ConvertTo-CommandLineArgument $_ }) -join " "
    Start-Process -FilePath "powershell.exe" -ArgumentList $argumentLine -WorkingDirectory $projectRoot
}

function ConvertTo-CommandLineArgument {
    param([AllowNull()][string]$Value)

    if ($null -eq $Value) {
        return '""'
    }

    if ($Value -notmatch '[\s"]' -and $Value.Length -gt 0) {
        return $Value
    }

    $escaped = $Value -replace '(\\+)$', '$1$1'
    $escaped = $escaped -replace '"', '\"'
    return '"' + $escaped + '"'
}

function ConvertFrom-SecureStringToPlainText {
    param([System.Security.SecureString]$SecureValue)

    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    } finally {
        if ($ptr -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
        }
    }
}

function Test-MysqlLogin {
    param([AllowNull()][string]$Password)

    if ($SkipMysqlCredentialCheck) {
        return $null
    }

    $mysqlClient = Join-Path $XamppPath "mysql\bin\mysql.exe"
    if (-not (Test-Path $mysqlClient)) {
        Write-Host "Client mysql.exe tidak ditemukan, cek kredensial MySQL dilewati." -ForegroundColor Yellow
        return $null
    }

    $stdout = [System.IO.Path]::GetTempFileName()
    $stderr = [System.IO.Path]::GetTempFileName()
    try {
        $mysqlArgs = @(
            "--protocol=tcp",
            "-h", $MysqlHost,
            "-P", $MysqlPort,
            "-u", $MysqlUsername
        )

        if (-not [string]::IsNullOrEmpty($Password)) {
            $mysqlArgs += "-p$Password"
        }

        $mysqlArgs += @("--batch", "--skip-column-names", "-e", "SELECT 1;")

        $argumentLine = ($mysqlArgs | ForEach-Object { ConvertTo-CommandLineArgument $_ }) -join " "

        $process = Start-Process `
            -FilePath $mysqlClient `
            -ArgumentList $argumentLine `
            -NoNewWindow `
            -Wait `
            -PassThru `
            -RedirectStandardOutput $stdout `
            -RedirectStandardError $stderr

        return $process.ExitCode -eq 0
    } finally {
        Remove-Item -LiteralPath $stdout, $stderr -ErrorAction SilentlyContinue
    }
}

function Resolve-MysqlPassword {
    if ($SkipMysql -or $SkipMysqlCredentialCheck) {
        return
    }

    $loginOk = Test-MysqlLogin -Password $MysqlPassword
    if ($null -eq $loginOk) {
        return
    }

    if ($loginOk) {
        Write-Host "Login MySQL berhasil untuk user $MysqlUsername." -ForegroundColor Green
        return
    }

    if (-not [string]::IsNullOrEmpty($MysqlPassword)) {
        throw "Password MySQL untuk user '$MysqlUsername' ditolak. Jalankan ulang dengan password yang benar."
    }

    Write-Warning "MySQL menolak login $MysqlUsername tanpa password."
    $securePassword = Read-Host "Masukkan password MySQL untuk user $MysqlUsername" -AsSecureString
    $candidate = ConvertFrom-SecureStringToPlainText $securePassword

    if ([string]::IsNullOrEmpty($candidate)) {
        throw "Password MySQL kosong masih ditolak. Isi password MySQL yang benar atau reset password root XAMPP."
    }

    $loginOk = Test-MysqlLogin -Password $candidate
    if (-not $loginOk) {
        throw "Password MySQL yang dimasukkan masih ditolak."
    }

    $script:MysqlPassword = $candidate
    Write-Host "Login MySQL berhasil. Backend akan memakai password tersebut." -ForegroundColor Green
}

function Test-BackendReady {
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:8080/api/master/products" -TimeoutSec 3
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
    } catch {
        return $false
    }
}

Start-XamppMysql
Resolve-MysqlPassword

$backendArgs = @(
    "-JavaHome", $JavaHome,
    "-MysqlHost", $MysqlHost,
    "-MysqlPort", $MysqlPort,
    "-MysqlDatabase", $MysqlDatabase,
    "-MysqlUsername", $MysqlUsername
)

if (-not [string]::IsNullOrEmpty($MysqlPassword)) {
    $backendArgs += @("-MysqlPassword", $MysqlPassword)
}

if (-not $RequireMysqlPassword -and [string]::IsNullOrEmpty($MysqlPassword)) {
    $backendArgs += "-AllowEmptyMysqlPassword"
}

if ($SeedUsers) {
    $backendArgs += @(
        "-SeedUsers",
        "-SeedOwnerPassword", $SeedOwnerPassword,
        "-SeedStaff1Password", $SeedStaff1Password,
        "-SeedStaff2Password", $SeedStaff2Password
    )
}

$frontendArgs = @()
if ($InstallFrontend) {
    $frontendArgs += "-Install"
}

if (Test-BackendReady) {
    Write-Host "Backend sudah aktif di http://localhost:8080, tidak membuka backend baru." -ForegroundColor Green
} else {
    Write-Host "Menjalankan backend..." -ForegroundColor Green
    Start-PowershellScript -ScriptPath $backendScript -ScriptArgs $backendArgs
}

if (Test-TcpPort -HostName "localhost" -Port "5173") {
    Write-Host "Frontend sudah aktif di http://localhost:5173, tidak membuka frontend baru." -ForegroundColor Green
} else {
    Write-Host "Menjalankan frontend..." -ForegroundColor Green
    Start-PowershellScript -ScriptPath $frontendScript -ScriptArgs $frontendArgs
}

Write-Host ""
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend : http://localhost:8080" -ForegroundColor Cyan
