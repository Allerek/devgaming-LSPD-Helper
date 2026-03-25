# LSPD Helper - System Wspomagania Frakcji Porządkowych

Profesjonalne oprogramowanie wspierające funkcjonariuszy Los Santos Police Department (LSPD) na serwerze **.devGaming** platformy **ALT:V**. Narzędzie integruje bazę danych taryfikatora karnego z dynamiczną nakładką systemową, optymalizując czas pracy i dokładność wystawianych mandatów.

## ⚖️ Główne Moduły

- **Kartoteka (Electron/Vite)**: 
  - Pełna baza taryfikatora karnego zgodna z kodeksem serwera .devGaming.
  - System **Cloud-Sync**: Automatyczne pobieranie aktualizacji taryfikatora prosto z repozytorium GitHub przy każdym uruchomieniu.
  - Zaawansowany generator raportów z funkcją sumowania kary więzienia i grzywny.
  - Szybkie wyszukiwanie paragrafów po identyfikatorze (ID) lub nazwie.
- **System Overlay (Python)**:
  - Przejrzysta ściąga kodów radiowych, kryptonimów oraz stacji.
  - Funkcja "Always on Top" pozwalająca na korzystanie z informacji bez minimalizowania gry.
  - Obsługa skrótów klawiszowych dla szybkiej nawigacji w terenie.

## 🛠️ Architektura Techniczna

- **Frontend**: Vite + Tailwind CSS v4 (nowoczesny, wydajny interfejs).
- **Backend**: Electron (opakowanie desktopowe).
- **Nakładka**: Python (skompilowany do EXE za pomocą PyInstallera).
- **Synchronizacja**: API GitHub (pobieranie surowych danych JSON).

## 🚀 Instrukcja Instalacji i Budowania

Wymagane środowiska: **Node.js** (pnpm) oraz **Python 3.x**.

1. **Pobranie zależności**:
   ```cmd
   pnpm install
   ```
2. **Budowanie pakietu końcowego**:
   Uruchom skrypt `build_lspd.bat`, który automatycznie przygotuje gotowy do pracy folder `LSPD_Helper_Pack`.

## 📦 Struktura Plików
- `src/` - Kod źródłowy interfejsu (Vite).
- `main.js` - Główny proces aplikacji Electron.
- `lspd_overlay.py` - Kod źródłowy nakładki Python.
- `penal_code.json` - Lokalna kopia bazy danych (synchronizowana automatycznie).

---
Projekt dedykowany dla graczy frakcji porządkowych na serwerze [devGaming.pl](https://forum.devgaming.pl/).  
*Wersja oprogramowania: 1.2.0 Stable.*
