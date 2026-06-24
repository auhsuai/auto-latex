@echo off
chcp 65001 >nul
color 0B
echo ========================================================
echo   KHOI DONG SERVER DEV CHO AUTO LATEX
echo ========================================================
echo.
echo Dang khoi chay local server...
npm run start:dev
pause
