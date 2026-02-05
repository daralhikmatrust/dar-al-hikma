@echo off
echo ========================================
echo Starting Dar Al Hikma Backend Server
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Please create .env file with required variables.
    echo.
    pause
    exit /b 1
)

echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

echo Installing dependencies (if needed)...
call npm install
echo.

echo Starting server...
echo.
echo Server will start on http://localhost:5000
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

call npm run dev

pause
