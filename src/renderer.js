import './main.css';
import penalData from './penal_code.json';

const ipc = window.require('electron').ipcRenderer;

// --- STATE ---
const ticketEntries = [];
window.ticketEntries = ticketEntries;
const kbFiles = ['sounds/keyboard1.mp3', 'sounds/keyboard2.mp3', 'sounds/keyboard3.mp3'];
const mouseSound = new Audio('sounds/mouseClick.mp3');
let lastKBIdx = -1;

// --- AUDIO ---
function playKB() {
    let idx;
    do { idx = Math.floor(Math.random() * 3); } while(idx === lastKBIdx);
    lastKBIdx = idx;
    const a = new Audio(kbFiles[idx]);
    a.volume = 0.4;
    a.play().catch(() => {});
}

// --- IPC ---
ipc.on('overlay-status', (ev, status) => {
    const b = document.getElementById('overlay-badge');
    if (!b) return;
    b.innerText = status;
    b.className = status === 'ONLINE' 
        ? 'bg-success px-2 py-0.5 rounded-full text-[0.6rem] font-bold text-white' 
        : 'bg-slate-700 px-2 py-0.5 rounded-full text-[0.6rem] font-bold text-white';
});

// --- INTRO ANIMATION ---
async function loginAnimation() {
    const user = "Jeffrey Henderson";
    const pass = "LSPD.2024";
    
    const uInput = document.getElementById('user-input');
    const pInput = document.getElementById('pass-input');
    const lBtn = document.getElementById('login-btn');
    const cursor = document.getElementById('fake-cursor');
    const overlay = document.getElementById('login-overlay');

    await new Promise(r => setTimeout(r, 1000));
    cursor.style.display = 'block';
    
    const moveAndType = async (el, text, isMasked = false) => {
        const rect = el.getBoundingClientRect();
        cursor.style.left = (rect.left + 20) + 'px';
        cursor.style.top = (rect.top + 10) + 'px';
        await new Promise(r => setTimeout(r, 600));
        mouseSound.play().catch(() => {});
        el.classList.add('border-blue-900', 'ring-1', 'ring-blue-900/30');
        await new Promise(r => setTimeout(r, 200));

        for(let i=0; i<=text.length; i++) {
            el.innerText = isMasked ? "*".repeat(i) : text.substring(0, i);
            if (i > 0) playKB();
            await new Promise(r => setTimeout(r, 60 + Math.random() * 40));
        }
        await new Promise(r => setTimeout(r, 400));
        el.classList.remove('border-blue-900', 'ring-1', 'ring-blue-900/30');
    };

    await moveAndType(uInput, user);
    await moveAndType(pInput, pass, true);

    const bRect = lBtn.getBoundingClientRect();
    cursor.style.left = (bRect.left + 40) + 'px';
    cursor.style.top = (bRect.top + 20) + 'px';
    await new Promise(r => setTimeout(r, 800));

    mouseSound.play().catch(() => {});
    lBtn.style.background = "#808080";
    lBtn.style.borderRightColor = "#ffffff";
    lBtn.style.borderBottomColor = "#ffffff";
    lBtn.style.borderLeftColor = "#808080";
    lBtn.style.borderTopColor = "#808080";
    
    await new Promise(r => setTimeout(r, 400));
    cursor.style.display = 'none';
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.display = 'none';
        initData();
    }, 1000);
}

// --- SYNC & DATA ---
const REMOTE_URL = 'https://raw.githubusercontent.com/Allerek/devgaming-LSPD-Helper/refs/heads/main/penal_code.json';
let activePenalData = [...penalData]; // Start with bundled fallback

async function initData() {
    const fs = window.require('fs');
    const path = window.require('path');
    const baseDir = window.process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(window.process.execPath);
    const localPath = path.join(baseDir, 'penal_code.json');

    // 1. First, try to load from local file (if exists from previous sync or manual)
    try {
        if (!window.process.env.PORTABLE_EXECUTABLE_DIR && import.meta.env.DEV) {
            console.log("Tryb deweloperski: Wyłączono synchronizację z GitHub.");
            // In dev, we already have penalData imported from ./penal_code.json
            activePenalData = [...penalData];
            initApp();
            return;
        }

        if (fs.existsSync(localPath)) {
            const raw = fs.readFileSync(localPath, 'utf8');
            activePenalData = JSON.parse(raw);
            console.log("Wczytano lokalną kopię bazy.");
        }
    } catch (e) { console.error("Błąd wczytywania lokalnego pliku:", e); }

    // 2. Try to sync with GitHub (Background)
    try {
        console.log("Synchronizacja z chmurą...");
        const response = await fetch(REMOTE_URL);
        if (response.ok) {
            const cloudData = await response.json();
            activePenalData = cloudData;
            // Persistence: update local file for next offline launch
            fs.writeFileSync(localPath, JSON.stringify(cloudData, null, 2));
            console.log("Zsynchronizowano pomyślnie z GitHub!");
        }
    } catch (e) {
        console.warn("Brak połączenia z GitHub, używam ostatniej znanej wersji.");
    }

    initApp();
}

// --- CORE FUNCTIONS ---
function initApp() {
    const list = document.getElementById('chapter-list');
    list.innerHTML = '';
    
    activePenalData.forEach((ch, idx) => {
        const btn = document.createElement('button');
        btn.className = 'chapter-btn w-full text-left px-4 py-3 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white text-xs font-semibold transition-all border-l-2 border-transparent';
        btn.innerText = ch.chapter;
        btn.onclick = () => {
            document.querySelectorAll('.chapter-btn').forEach(b => {
                b.classList.remove('bg-white/10', 'text-white', 'border-accent');
                b.classList.add('text-slate-400');
            });
            btn.classList.add('bg-white/10', 'text-white', 'border-accent');
            renderArticles(ch.articles);
        };
        list.appendChild(btn);
    });
    if (list.firstChild) list.firstChild.click();
}

function renderArticles(articles) {
    const container = document.getElementById('articles-view');
    container.innerHTML = '';
    articles.forEach(art => {
        const card = document.createElement('div');
        card.className = 'bg-slate-800/40 p-6 rounded-2xl border border-white/5 hover:border-accent/30 hover:-translate-y-1 transition-all cursor-pointer group';
        card.onclick = () => addToTicket(art);
        card.innerHTML = `
            <div class="flex items-center gap-4 mb-4">
                <span class="bg-accent text-white px-3 py-1 rounded-lg text-xs font-black">${art.id}</span>
                <span class="font-bold text-sm group-hover:text-accent transition-colors">${art.title}</span>
            </div>
            <p class="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3">${art.description || ''}</p>
            <div class="flex justify-between items-center bg-black/20 p-3 rounded-xl">
                <span class="text-[0.65rem] font-bold text-warning uppercase tracking-tighter">Jail: ${art.penalties.Jail[0]}-${art.penalties.Jail[1]} msc</span>
                <span class="text-[0.65rem] font-bold text-success uppercase tracking-tighter">USD: ${art.penalties.USD[0]}-${art.penalties.USD[1]}$</span>
            </div>
        `;
        container.appendChild(card);
    });
}

function addToTicket(art) {
    if (ticketEntries.find(e => e.id === art.id)) return;
    ticketEntries.push({ ...art, uUSD: art.penalties.USD[1], uJail: art.penalties.Jail[1], uCat: art.categories[0] });
    renderTicket();
}

function renderTicket() {
    const container = document.getElementById('ticket-items');
    container.innerHTML = '';
    ticketEntries.forEach((e, idx) => {
        const div = document.createElement('div');
        div.className = 'bg-slate-800/60 p-4 rounded-xl border border-white/5 animate-in fade-in zoom-in duration-200';
        div.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <span class="font-bold text-[0.8rem] text-accent tracking-tight">[${e.id}] ${e.title}</span>
                <button onclick="window.removeEntry(${idx})" class="text-danger hover:scale-110 transition-transform font-black text-xs">✕</button>
            </div>
            <div class="grid grid-cols-3 gap-2">
                <div class="space-y-1">
                    <label class="text-[0.55rem] font-black text-accent uppercase opacity-60">USD</label>
                    <input type="number" 
                        value="${e.uUSD}" 
                        min="${e.penalties.USD[0]}" 
                        max="${e.penalties.USD[1]}" 
                        oninput="window.updateEntry(${idx}, 'uUSD', this.value)" 
                        onblur="this.value = window.ticketEntries[${idx}].uUSD"
                        class="w-full bg-[#0c0e14] border-none rounded p-1.5 text-xs text-white">
                </div>
                <div class="space-y-1">
                    <label class="text-[0.55rem] font-black text-accent uppercase opacity-60">Jail</label>
                    <input type="number" 
                        value="${e.uJail}" 
                        min="${e.penalties.Jail[0]}" 
                        max="${e.penalties.Jail[1]}" 
                        oninput="window.updateEntry(${idx}, 'uJail', this.value)" 
                        onblur="this.value = window.ticketEntries[${idx}].uJail"
                        class="w-full bg-[#0c0e14] border-none rounded p-1.5 text-xs text-white">
                </div>
                <div class="space-y-1">
                    <label class="text-[0.55rem] font-black text-accent uppercase opacity-60">KAT</label>
                    <select onchange="window.updateEntry(${idx}, 'uCat', this.value)" class="w-full bg-[#0c0e14] border-none rounded p-1.5 text-xs text-white">
                        ${e.categories.map(c => `<option value="${c}" ${e.uCat === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
    updateTotals();
}

function updateTotals() {
    let sU = 0, sJ = 0;
    ticketEntries.forEach(e => { 
        sU += Math.max(0, parseInt(e.uUSD) || 0); 
        sJ += Math.max(0, parseInt(e.uJail) || 0); 
    });
    document.getElementById('total-text').innerText = `${sU}$ / ${sJ}msc`;
}

// --- GLOBALS FOR ONCLICK ---
window.updateEntry = (idx, field, val) => {
    if (field === 'uCat') {
        ticketEntries[idx][field] = val;
    } else {
        const entry = ticketEntries[idx];
        const range = field === 'uUSD' ? entry.penalties.USD : entry.penalties.Jail;
        let v = parseInt(val) || 0;
        // Clamp:
        v = Math.max(range[0], Math.min(v, range[1]));
        ticketEntries[idx][field] = v;
    }
    updateTotals();
};
window.removeEntry = (idx) => {
    ticketEntries.splice(idx, 1);
    renderTicket();
};
window.generateReport = () => {
    if (ticketEntries.length === 0) return;
    const articles = ticketEntries.map(e => `${e.id}. ${e.title} (${e.uCat})`).join(', ');
    navigator.clipboard.writeText(articles.trim()).then(() => {
        const btn = document.querySelector('button[onclick="generateReport()"]');
        const oldText = btn.innerText;
        btn.innerText = 'SKOPIOWANO!';
        btn.classList.add('bg-success', 'text-white');
        btn.classList.remove('bg-white', 'text-black');
        setTimeout(() => {
            btn.innerText = oldText;
            btn.classList.remove('bg-success', 'text-white');
            btn.classList.add('bg-white', 'text-black');
        }, 800);
    });
};
window.clearTicket = () => {
    ticketEntries.length = 0;
    renderTicket();
};

// --- EVENTS ---
document.getElementById('search-input').oninput = (e) => {
    const q = e.target.value.toLowerCase();
    if (!q) {
        document.querySelector('.chapter-btn.bg-white\\/10')?.click();
        return;
    }
    const res = [];
    activePenalData.forEach(ch => {
        ch.articles.forEach(art => {
            if (art.id.toLowerCase().includes(q) || art.title.toLowerCase().includes(q)) {
                res.push(art);
            }
        });
    });
    renderArticles(res);
};

// --- START ---
loginAnimation();
