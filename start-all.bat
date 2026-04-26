@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0start-all.ps1" %*
if errorlevel 1 (
  echo.
  echo Gagal menjalankan start-all.ps1
  pause
)
