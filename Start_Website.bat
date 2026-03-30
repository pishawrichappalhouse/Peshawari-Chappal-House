@echo off
title Peshawari Chappal House - Project Launcher
set PORT=8080
echo ========================================================
echo   PESHAWARI CHAPPAL HOUSE - SECURE STORE LAUNCHER
echo ========================================================
echo.
echo Checking environment...

node -v >nul 2>&1
if %errorlevel% equ 0 (
    echo Using Node.js for a robust server experience...
    echo Website will be available at http://localhost:%PORT%
    echo Starting server...
    start http://localhost:%PORT%/index.html
    npx -y http-server -p %PORT% -c-1
) else (
    python --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo Node.js not found, falling back to Python...
        echo Website will be available at http://localhost:%PORT%
        start http://localhost:%PORT%/index.html
        python -m http.server %PORT%
    ) else (
        echo ERROR: Neither Node.js nor Python found!
        echo Please install Node.js from https://nodejs.org
        pause
    )
)
pause
