@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PORT=8000

echo.
echo ================================================
echo          КОТОМАТИКА — ЛОКАЛЬНЫЙ СЕРВЕР
echo ================================================
echo.
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /R /C:"IPv4 Address" /C:"IPv4-адрес"') do (
  for /f "tokens=*" %%B in ("%%A") do echo Для iPhone: http://%%B:%PORT%/
)
echo.
echo Для этого компьютера: http://localhost:%PORT%/
echo.
echo Не закрывайте это окно, пока смотрите сайт.
echo Для остановки нажмите Ctrl+C.
echo.

where py >nul 2>&1
if %errorlevel%==0 (
  py -m http.server %PORT% --bind 0.0.0.0
  goto :eof
)

where python >nul 2>&1
if %errorlevel%==0 (
  python -m http.server %PORT% --bind 0.0.0.0
  goto :eof
)

echo Python не найден. Установите Python или запустите сайт другим локальным сервером.
pause
