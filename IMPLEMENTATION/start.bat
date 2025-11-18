@echo off
echo ========================================
echo   SpecForge - Starting Services
echo ========================================
echo.
echo This will open 4 terminal windows:
echo   1. Backend (Port 3003)
echo   2. INPUT (Port 3001)
echo   3. DISPLAY (Port 3002)
echo   4. BROWSE (Port 3000)
echo.
echo Press any key to continue...
pause >nul

echo.
echo Starting Backend...
start "SpecForge Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 >nul

echo Starting INPUT...
start "SpecForge INPUT" cmd /k "cd input && npm start"

timeout /t 2 >nul

echo Starting DISPLAY...
start "SpecForge DISPLAY" cmd /k "cd display && npm start"

timeout /t 2 >nul

echo Starting BROWSE...
start "SpecForge BROWSE" cmd /k "cd browse && npm start"

echo.
echo ========================================
echo   All services starting...
echo ========================================
echo.
echo Waiting for services to start (15 seconds)...
timeout /t 15 >nul

echo Opening browser windows...
start http://localhost:3001
timeout /t 1 >nul
start http://localhost:3002
timeout /t 1 >nul
start http://localhost:3000

echo.
echo ========================================
echo   Services are running!
echo ========================================
echo.
echo The services are running in separate windows:
echo   - Backend: http://localhost:3003 (API)
echo   - INPUT: http://localhost:3001 (Specification Input)
echo   - DISPLAY: http://localhost:3002 (Visualization Wall)
echo   - BROWSE: http://localhost:3000 (Browse and Manage)
echo.
echo To stop all services, close the terminal windows
echo or press Ctrl+C in each window.
echo.
pause
