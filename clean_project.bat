@echo off
echo Czyszczenie projektu przed wysylka na GitHub...
rd /s /q dist 2>nul
rd /s /q dist-electron 2>nul
rd /s /q build 2>nul
rd /s /q LSPD_Helper_Pack 2>nul
rd /s /q node_modules 2>nul
rd /s /q .gemini 2>nul
del "EXE)" 2>nul
del "LSPD Helper Kartoteka 1.0.0.exe" 2>nul
del "LSPD_Helper_Pack.rar" 2>nul
del "lspd_overlay.spec" 2>nul
echo Gotowe! Projekt jest czysty i gotowy do wysylki.
