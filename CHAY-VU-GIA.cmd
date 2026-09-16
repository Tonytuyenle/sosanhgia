@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Can cai Node.js 20 hoac moi hon. Xem file HUONG-DAN.md.
  pause
  exit /b 1
)
if not exist "node_modules\express" (
  call npm ci
  if errorlevel 1 goto failed
)
if not exist "dist\index.html" (
  call npm run build
  if errorlevel 1 goto failed
)
echo.
echo VU GIA V2 - Mo http://localhost:4173 trong trinh duyet.
echo Lan dau: tao tai khoan quan tri. Giu cua so nay mo khi su dung.
echo.
call npm start
goto end
:failed
echo Khong khoi dong duoc. Xem thong bao phia tren.
:end
pause
