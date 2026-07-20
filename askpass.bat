@echo off
echo %1 | findstr /I "Username" >nul
if %errorlevel% == 0 (
  echo akfotos
) else (
  echo %GITHUB_TOKEN%
)
