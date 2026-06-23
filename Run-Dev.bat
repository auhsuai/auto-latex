@echo off
chcp 65001 >nul
color 0B
echo ========================================================
echo   KHOI DONG SERVER DEV CHO AUTO LATEX
echo ========================================================
echo.
echo Dang khoi chay API Proxy Server (chong loi CORS) o cua so moi...
start "Auto LaTeX - API Proxy Server" cmd /k "npm run proxy"
echo.
echo Dang khoi chay local server...
npm run start:dev
pause
