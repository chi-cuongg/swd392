@echo off
setlocal EnableExtensions

title SPLA Platform Launcher
color 0B

echo =======================================================
echo      SPLA PLATFORM - MULTI-DOMAIN IOT MONITORING       
echo =======================================================
echo.

echo [1/5] Kiem tra va don dep cac tien trinh cu (Port 3000, 4060, 5173)...
call :KillPort 3000
call :KillPort 4060
call :KillPort 5173

timeout /t 2 /nobreak >nul

echo.
echo [2/5] Khoi dong n8n (Docker)...
pushd "%~dp0n8n"
start "SPLA - n8n Docker" cmd /c "start cmd /c cd n8n && docker-compose up -d"
popd

echo.
echo [3/5] Khoi dong Backend (Port 3000)...
pushd "%~dp0backend"
start "SPLA - Backend Core (Port 3000)" cmd /k "start cmd /c cd backend && npm run dev"
popd

echo.
echo [4/5] Khoi dong Frontend Dashboard (Port 5173)...
pushd "%~dp0frontend"
start "SPLA - Frontend (Port 5173)" cmd /k "start cmd /c cd frontend && npm run dev"
popd

echo.
echo [5/5] Khoi dong Simulator UI (Port 4060)...
pushd "%~dp0simulator"
start "SPLA - Simulator UI (Port 4060)" cmd /k "start cmd /c cd simulator && npm run ui"
popd

echo.
echo =======================================================
echo TAT CA CAC SERVICE DA DUOC KHOI DONG THANH CONG!
echo.
echo 1. Frontend Dashboard : http://localhost:5173
echo 2. Simulator Control  : http://localhost:4060
echo 3. n8n Workflow Admin : http://localhost:5678
echo 4. Backend API        : http://localhost:3000
echo =======================================================
echo.
echo Bam phim bat ky de thoat trinh khoi dong (Cac cua so Service van se tiep tuc chay)...
pause >nul
goto :eof

:KillPort
set "PORT=%~1"
for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "Get-NetTCPConnection -State Listen -LocalPort %PORT% -ErrorAction SilentlyContinue ^| Select-Object -ExpandProperty OwningProcess -Unique"`) do (
    if not "%%P"=="" (
        echo [!] Phat hien tien trinh dang chay o cong %PORT% - PID %%P. Dang kill...
        taskkill /F /PID %%P >nul 2>&1
    )
)
exit /b 0
