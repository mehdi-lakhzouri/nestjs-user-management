@echo off
echo Starting User Management Backend...
echo.

REM Check if MongoDB is running
echo Checking if MongoDB is running...
netstat -an | find ":27017" >nul 2>&1
if errorlevel 1 (
    echo WARNING: MongoDB does not appear to be running on port 27017
    echo Please start MongoDB before running the application
    echo.
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

REM Start the backend in development mode
echo Starting NestJS backend in development mode...
npm run start:dev
