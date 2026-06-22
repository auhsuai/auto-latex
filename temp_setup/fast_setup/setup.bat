@echo off
chcp 65001 >nul
color 0A
echo ========================================================
echo   CAI DAT ADD-IN AUTO LATEX CHO MICROSOFT WORD
echo ========================================================
echo.
echo Dang dang ky Add-in vao he thong Microsoft Office...

reg add "HKCU\SOFTWARE\Microsoft\Office\16.0\WEF\Developer" /v "AutoLatex" /t REG_SZ /d "%~dp0manifest.xml" /f >nul

if %errorlevel% equ 0 (
    echo.
    echo [THANH CONG] Da cai dat xong!
    echo.
    echo Huong dan su dung:
    echo 1. Mo chuong trinh Microsoft Word.
    echo 2. Vao tab Insert (Chen) -> My Add-ins (Add-in cua toi).
    echo 3. Ban se thay "Auto LaTeX" hien ra de su dung.
) else (
    echo.
    echo [LOI] Co loi xay ra khi cai dat. Vui long thu chay bang quyen Admin (Run as Administrator).
)
echo.
pause
