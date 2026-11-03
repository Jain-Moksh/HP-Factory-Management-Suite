@echo off
setlocal
title HP Factory Management Suite

rem Folder the website is installed in
set "APP_DIR=C:\Users\HP\Documents\GitHub\NP-Frontend"

if exist "%APP_DIR%\" (
  cd /d "%APP_DIR%"
) else (
  rem Not on this PC: use the folder this file is in instead
  echo Folder %APP_DIR% not found, using %~dp0 instead.
  cd /d "%~dp0"
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or not on PATH. Install it from https://nodejs.org and try again.
  goto :fail
)

rem 1. Packages: installed only when missing or when package.json / package-lock.json changed
call :ensure_packages client || goto :fail
call :ensure_packages server || goto :fail

rem 2. Website: rebuilt only when its source or settings changed since the last build
echo Checking website build...
node scripts\start-check.js build
if errorlevel 1 (
  echo Building website...
  pushd client
  call npm run build
  if errorlevel 1 (
    popd
    goto :fail
  )
  popd
) else (
  echo    Website is up to date, build skipped.
)

rem 3. Server: serves the website and the API, and opens the browser
echo.
echo Starting server... keep this window open; closing it stops the website.
echo.
cd server
node server.js
echo.
echo Server stopped.
pause
exit /b 0


:ensure_packages
echo Checking %1 packages...
node scripts\start-check.js install %1
if not errorlevel 1 (
  echo    %1 packages are up to date, install skipped.
  exit /b 0
)
echo Installing %1 packages...
pushd %1
call npm install --no-audit --no-fund
set "INSTALL_ERROR=%errorlevel%"
popd
exit /b %INSTALL_ERROR%


:fail
echo.
echo Startup failed. See the messages above.
pause
exit /b 1
