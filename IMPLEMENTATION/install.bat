@echo off
echo ========================================
echo   SpecForge - Installation Script
echo ========================================
echo.

echo [1/4] Installing Backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend installation failed!
    pause
    exit /b 1
)
cd ..
echo checkmark Backend dependencies installed
echo.

echo [2/4] Installing INPUT dependencies...
cd input
call npm install
if %errorlevel% neq 0 (
    echo ERROR: INPUT installation failed!
    pause
    exit /b 1
)
cd ..
echo checkmark INPUT dependencies installed
echo.

echo [3/4] Installing DISPLAY dependencies...
cd display
call npm install
if %errorlevel% neq 0 (
    echo ERROR: DISPLAY installation failed!
    pause
    exit /b 1
)
cd ..
echo checkmark DISPLAY dependencies installed
echo.

echo [4/4] Installing BROWSE dependencies...
cd browse
call npm install
if %errorlevel% neq 0 (
    echo ERROR: BROWSE installation failed!
    pause
    exit /b 1
)
cd ..
echo checkmark BROWSE dependencies installed
echo.

echo Setting up configuration files...
if not exist backend\.env (
    copy backend\.env.example backend\.env 2>nul
    if %errorlevel% equ 0 (
        echo checkmark Created backend/.env
    ) else (
        echo ! backend/.env.example not found - please create backend/.env manually
    )
) else (
    echo checkmark backend/.env already exists
)

if not exist input\.env (
    copy input\.env.example input\.env 2>nul
    if %errorlevel% equ 0 (
        echo checkmark Created input/.env
    ) else (
        echo ! input/.env.example not found - using defaults
    )
) else (
    echo checkmark input/.env already exists
)

if not exist display\.env (
    copy display\.env.example display\.env 2>nul
    if %errorlevel% equ 0 (
        echo checkmark Created display/.env
    ) else (
        echo ! display/.env.example not found - using defaults
    )
) else (
    echo checkmark display/.env already exists
)

if not exist browse\.env (
    copy browse\.env.example browse\.env 2>nul
    if %errorlevel% equ 0 (
        echo checkmark Created browse/.env
    ) else (
        echo ! browse/.env.example not found - using defaults
    )
) else (
    echo checkmark browse/.env already exists
)
echo.

echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo NEXT STEPS:
echo 1. Edit backend/.env and add your OPENAI_API_KEY
echo 2. Run start.bat to launch all services
echo.
echo See START_HERE.md for detailed instructions
echo.
pause
