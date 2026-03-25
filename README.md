# 🚓 LSPD Helper - Kartoteka & Overlay

Profesjonalne narzędzie wspomagające dla funkcjonariuszy LSPD w systemach Roleplay (MTA/SAMP/FiveM). Aplikacja łączy w sobie zaawansowaną kartotekę taryfikatora z lekką nakładką informacyjną na ekran gry.

## ✨ Główne Funkcje

- **🏢 Kartoteka Electron**: 
  - Przeglądarka taryfikatora z podziałem na rozdziały.
  - Wyszukiwarka paragrafów (po ID lub nazwie).
  - Generator kar z możliwością sumowania mandatów i czasu więzienia.
  - Kopiowanie gotowych raportów ("ID. TYTUŁ (KAT)").
  - Retro-stylizacja logowania w stylu Windows NT / Resident Evil.
- **🖼️ Nakładka (Overlay) Python**:
  - Podręczna ściąga z kodów radiowych, kryptonimów i stacji.
  - Wyświetlana bezpośrednio nad grą (Always on Top).
  - Sterowanie skrótami klawiszowymi (`DEL`, `PG UP`, `PG DN`).
- **🛡️ Bezpieczeństwo i Elastyczność**:
  - Możliwość edycji bazy `penal_code.json` bez rekompilacji programu.
  - Wyjątkowo lekka nakładka zoptymalizowana pod kątem wydajności.

## 🛠️ Wymagania Deweloperskie

- **Node.js** (rekomendowany pnpm)
- **Python 3.x**
- **Dodatki Python**: `pyinstaller`, `keyboard`, `pystray`, `pillow`

## 🚀 Jak Zbudować (Build)

Aby wygenerować gotowy pakiet `.exe`, użyj przygotowanego skryptu:
```cmd
build_lspd.bat
```
Skrypt automatycznie:
1. Zamknie aktywne procesy.
2. Zainstaluje zależności `pnpm`.
3. Skompiluje nakładkę Python do `.exe`.
4. Spakuje aplikację Electron do wersji Portable.
5. Przygotuje gotowy folder `LSPD_Helper_Pack`.

## 📂 Zawartość Pakietu
Po zbudowaniu, w folderze `LSPD_Helper_Pack` znajdziesz:
- `LSPD Kartoteka.exe` - Główna aplikacja.
- `lspd_overlay.exe` - Nakładka (uruchamiana automatycznie przez Kartotekę).
- `penal_code.json` - Baza danych taryfikatora (można edytować!).
- `icon.png` - Ikona aplikacji.

---
**Autor:** Allerek  
**Wersja:** 1.2.0 "Master Edition"
