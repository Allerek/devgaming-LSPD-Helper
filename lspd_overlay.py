import tkinter as tk
import os
import threading
import json
from PIL import Image, ImageDraw

# Próba importu bibliotek dla globalnych skrótów i ikony zasobnika.
try:
    import keyboard
except ImportError:
    keyboard = None

try:
    import pystray
    from pystray import MenuItem as item
except ImportError:
    pystray = None

# --- DANE EMBEDDED ---
EMBEDDED_DATA = """PODSTAWOWE KODY RADIOWE:
Kod 1: Potrzebna asysta Supervisory Staff.
Kod 2: Pilna odpowiedź na wezwanie, bez sygnałów (domyślny kod patrolowy).
Kod 3: Alarmowa odpowiedź na wezwanie, użycie sygnałów świetlnych i dźwiękowych.
Kod 4: Sytuacja opanowana, dalsze wsparcie niepotrzebne.
Kod 4A (Adam): Sytuacja nieopanowana, ale jednostek na miejscu jest wystarczająco.
Kod 4N (Nora): Fałszywe zgłoszenie 911 (fake call).
Kod 5: Omijać daną lokalizację (prowadzone działania).
Kod 6: Interwencja poza pojazdem (Out of Car Investigation).
Kod 6A (Adam): Interwencja poza pojazdem z wymaganą asystą.
Kod 6G (George): Interwencja poza pojazdem z asystą, aktywność gangowa.
Kod 7: Przerwa w patrolu (np. na posiłek).
Kod 10: Prośba o sprawdzenie danych personalnych.
Kod 12: Poszukiwany w zasięgu wzroku.
Kod 12A (Adam): Poszukiwany w zasięgu wzroku (w pojazdach).
Kod 12B (Boy): Poszukiwany pojazd w zasięgu wzroku.
Kod 12G (George): Poszukiwany za felony (przestępstwo) w zasięgu wzroku.
Kod 100: Podejrzany prawdopodobnie uciekł.

KODY PRZESTĘPSTW:
148 – Opór przy zatrzymaniu
187 – Zabójstwo
207 – Porwanie
211 – Napad z bronią
240 – Napaść
245 – Napaść z użyciem niebezpiecznego narzędzia
246 – Strzały oddane w stronę zamieszkałego budynku/mieszkania
247 – Napad zbrojny, rabunek
261 – Gwałt
288 – Nieobyczajne zachowanie
311 – Obnażanie się
390 – Osoba pod wpływem (np. alkoholu)
415 – Osoba zakłócająca porządek
451 – Podpalenie
459 – Włamanie do mieszkania
480 – Potrącenie z ucieczką sprawcy
502 – DUI (Jazda pod wpływem)

KRYPTONIMY JEDNOSTEK:
Lincoln: Jednostka jednoosobowa oznakowana.
Adam: Jednostka dwuosobowa oznakowana.
AIR: Jednostka wsparcia powietrznego (ASD).
Mary: Patrol motocyklowy.
Ocean: Jednostka wodna.
Cycle: Patrol rowerowy.
Foot-Beat: Patrol pieszy.
Ida: Internal Affairs Division (Biuro Spraw Wewnętrznych).
Xray: Metro Division (oznakowana).
George: Gang and Narcotics Division (oznakowana).
Robert-David: Jednostka Metro/SWAT.
4 King: Robbery-Homicide Division.
5 King: Gang and Narcotics Division (specjalistyczna).

STACJE:
1: Central Station
2: Mission Row Station (Główna)
3: Newton Station
7: Wilshire Station"""

# --- KONFIGURACJA ---
BG_COLOR = "#000000"
TEXT_COLOR = "#ffffff"
HEADER_COLOR = "#00aaff"
OPACITY = 0.8
MAX_WIDTH = 450 # Maksymalna szerokość

class LSPD_Overlay:
    def __init__(self, root):
        self.root = root
        self.root.title("LSPD Helper")
        self.root.attributes("-topmost", True)
        self.root.attributes("-alpha", OPACITY)
        self.root.overrideredirect(True)
        self.root.configure(bg=BG_COLOR)

        self.sections = self.load_data()
        self.current_index = 0
        self.is_hidden = True 
        self.root.withdraw() # Startuj ukryty

        # Ramka główna
        self.main_frame = tk.Frame(root, bg=BG_COLOR, padx=15, pady=15)
        self.main_frame.pack(fill="both", expand=True)

        # UI
        self.label_header = tk.Label(self.main_frame, text="", font=("Segoe UI", 12, "bold"), 
                                     fg=HEADER_COLOR, bg=BG_COLOR, anchor="w", justify="left")
        self.label_header.pack(fill="x", pady=(0, 10))

        self.label_body = tk.Label(self.main_frame, text="", font=("Segoe UI", 10), 
                                    fg=TEXT_COLOR, bg=BG_COLOR, justify="left", anchor="nw",
                                    wraplength=MAX_WIDTH - 30)
        self.label_body.pack(fill="both", expand=True)

        # Klawisze
        if keyboard:
            keyboard.add_hotkey('page up', self.prev_section)
            keyboard.add_hotkey('page down', self.next_section)
            keyboard.add_hotkey('delete', self.toggle_visibility)
        else:
            root.bind_all("<Prior>", self.prev_section)
            root.bind_all("<Next>", self.next_section)
            root.bind_all("<Delete>", self.toggle_visibility)
        
        # Możliwość przesuwania okna
        self.root.bind("<Button-1>", self.start_move)
        self.root.bind("<B1-Motion>", self.do_move)

        # Ukrycie kursora po najechaniu na okno
        self.root.config(cursor="none")
        self.main_frame.config(cursor="none")
        self.update_view()
        
        # Uruchomienie zasobnika (tray)
        if pystray:
            threading.Thread(target=self.setup_tray, daemon=True).start()

    def create_tray_icon_image(self):
        # Tworzy prostą ikonkę (niebieskie koło)
        width, height = 64, 64
        image = Image.new('RGB', (width, height), (30, 30, 30))
        dc = ImageDraw.Draw(image)
        dc.ellipse([10, 10, 54, 54], fill=(0, 170, 255))
        return image

    def monitor_parent(self):
        # Proste monitorowanie PPID - jeśli nadrzędny proces (Electron) zniknie, Python też kończy pracę
        import time
        ppid = os.getppid()
        while True:
            try:
                # Sprawdź czy PPID nadal istnieje (na Windowsie jeśli PPID to 1, to proces nadrzędny nie żyje)
                if os.getppid() == 1:
                    break
            except:
                break
            time.sleep(2)
        print("ELECTRON ZAMKNIĘTY - Zamykanie Overlay'a...")
        self.close_app()

    def setup_tray(self):
        menu = (item('Pokaż/Ukryj Overlay', self.toggle_visibility),
                item('Wyjście', self.close_app))
        self.icon = pystray.Icon("LSPDHelper", self.create_tray_icon_image(), "LSPD Helper", menu)
        self.icon.run()

    def toggle_visibility(self, event=None):
        if self.is_hidden:
            self.root.after(0, self.root.deiconify)
            self.root.after(10, lambda: self.root.attributes("-topmost", True))
            self.is_hidden = False
        else:
            self.root.after(0, self.root.withdraw)
            self.is_hidden = True

    def close_app(self, event=None):
        if pystray and hasattr(self, 'icon'):
            self.icon.stop()
        self.root.after(0, self.root.destroy)
        os._exit(0)

    def load_data(self):
        sections = []
        
        # Wczytaj tylko dane z EMBEDDED_DATA (Kody radiowe, kryptonimy, stacje)
        parts = EMBEDDED_DATA.strip().split("\n\n")
        for part in parts:
            lines = [l for l in part.strip().split("\n") if l.strip()]
            if lines:
                header = lines[0]
                body = "\n".join(lines[1:])
                sections.append((header, body))
            
        if not sections:
            sections = [("PUSTO", "Brak danych do wyświetlenia.")]
            
        return sections

    def update_view(self):
        header, body = self.sections[self.current_index]
        self.label_header.config(text=header)
        self.label_body.config(text=body)
        self.root.geometry("") 
        self.root.update_idletasks()

    def next_section(self, event=None):
        self.current_index = (self.current_index + 1) % len(self.sections)
        self.root.after(0, self.update_view)

    def prev_section(self, event=None):
        self.current_index = (self.current_index - 1) % len(self.sections)
        self.root.after(0, self.update_view)

    def start_move(self, event):
        self.x = event.x
        self.y = event.y

    def do_move(self, event):
        deltax = event.x - self.x
        deltay = event.y - self.y
        x = self.root.winfo_x() + deltax
        y = self.root.winfo_y() + deltay
        self.root.geometry(f"+{x}+{y}")

if __name__ == "__main__":
    root = tk.Tk()
    app = LSPD_Overlay(root)
    root.mainloop()
