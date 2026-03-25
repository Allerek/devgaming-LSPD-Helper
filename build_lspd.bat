@echo off
setlocal
echo ========================================================
echo [LSPD HELPER] ROZPOCZECIE BUDOWANIA PAKIETU - ALLEREK
echo ========================================================
echo.
echo [0/4] Zamykanie aktywnych procesow...
taskkill /F /IM "LSPD Kartoteka.exe" /T 2>nul
taskkill /F /IM lspd_overlay.exe /T 2>nul
timeout /t 1 /nobreak >nul
echo Procesy zamkniete.
echo.
echo [1/4] Czyszczenie i instalacja (pnpm)...
if exist dist rd /s /q dist
if exist build rd /s /q build
if exist dist-electron rd /s /q dist-electron
call pnpm install
if errorlevel 1 (
    echo [ERROR] Blad przy instalacji zaleznosci!
    pause
    exit /b 1
)
echo.
echo [2/4] Kompilacja Overlay'a (PyInstaller)...
call pyinstaller --noconsole --onefile --noupx --icon=icon.png lspd_overlay.py
if errorlevel 1 (
    echo [ERROR] Blad przy kompilacji Pythona!
    pause
    exit /b 1
)
echo.
echo [3/4] Budowanie Kartoteki (Vite + Tailwind + Electron)...
:: Przeskalowanie ikony do 256x256 (wymagane przez Electron-buildera)
call python -c "from PIL import Image; img = Image.open('icon.png'); img.resize((256, 256), Image.Resampling.LANCZOS).save('icon.png')"
call pnpm run build
if errorlevel 1 (
    echo [ERROR] Blad przy budowaniu Kartoteki!
    pause
    exit /b 1
)
echo.
echo [4/4] Pakowanie w folder LSPD_Helper_Pack...
if exist LSPD_Helper_Pack rd /s /q LSPD_Helper_Pack
mkdir LSPD_Helper_Pack
copy dist\lspd_overlay.exe LSPD_Helper_Pack\
copy "dist\LSPD Kartoteka*.exe" LSPD_Helper_Pack\
copy penal_code.json LSPD_Helper_Pack\
copy icon.png LSPD_Helper_Pack\
echo.
echo ========================================================
echo [LSPD HELPER] BUDOWANIE ZAKONCZONE!
echo Gotowe pliki znajdziesz w folderze: LSPD_Helper_Pack
echo ========================================================
pause
