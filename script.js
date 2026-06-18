// ─── State ────────────────────────────────────────────────────────────────────

const MESSAGES = [
    "Hi Eiriel! I hope you are having a nice day :D",
    "Thank you po for taking your time as a respondent.. HAHAHAHA",
    "I want to share a scripture from Matthew 13:44-46",
    "Isa ito sa favorite scriptures ko. It gives both a sense of mystery and something that has great value... woah",
    "I like how intriguing the story presents itself to be!",
    "'What did they see?'",
    "'Why was it so enticing to them?'",
    "Similary, the world also offers things that will catch our interest.",
    "Temptations... desires...",
    "Some could be okay:) but finding /greater/ comfort outside will lead us astray.",
    "Away from the Shepherd's protection, away from God:(",
    "I like this scripture, because it is a clear message of what's worth it /above everything else/.",
    "It's much worth it to leave /every/ earthly desire or possession we have or could have...",
    "I also learned that this scripture is teaches us to be closer to God.",
    "And what other enjoyable way to be closer to God than with the good influence of a friend !",
    "Good stories, lessons, and perspectives that God teaches us individually hehe :>",
    "With this in mind, I would like to ask...",
    // pause here for YES/NO
    "YAYYY NICEE!! HAHAHA I hope you were encouraged with the scripture :D",
    "At sa pagtype... (or skip) HAHAHA",
    "I'm looking forward in spending time and helping us get closer to God!",
    "Keep safe and well!"
];

// Index where we pause and show YES/NO
const ASK_AFTER_INDEX = 16;

let state = {
    wordIndex: 0,
    charIndex: 0,
    hasError: false,
    doneAsking: false,
    gameOver: false,
};

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const typedEl       = document.getElementById('typed-text');
const cursorEl      = document.getElementById('cursor-char');
const remainEl      = document.getElementById('remaining-text');
const errorHint     = document.getElementById('error-hint');
const wordContainer = document.getElementById('word-container');
const askSegment    = document.getElementById('ask-segment');
const detailsEl     = document.getElementById('detailsSegment');
const scriptureEl   = document.getElementById('short-scripture');
const skipBtn       = document.getElementById('skip-button');
const noBtn         = document.getElementById('no-btn');
const circle        = document.getElementById('glowing-circle');
const kbContainer   = document.getElementById('keyboardContainer');
const controlsRow   = document.getElementById('controls-row');

// ─── Char → key-id map ────────────────────────────────────────────────────────

const CHAR_KEY_MAP = {
    ' ':  'spaceKey',
    '!':  '1Key', '@': '2Key', '#': '3Key', '$': '4Key',
    '%':  '5Key', '^': '6Key', '&': '7Key', '*': '8Key',
    '(':  '9Key', ')': '0Key', '_': '-Key',  '+': '=Key',
    '{':  '[Key',  '}': ']Key', '|': 'forwardSlashKey',
    '\\': 'forwardSlashKey',
    ':':  ';Key', '"': "'Key", '<': ',Key',  '>': 'periodKey',
    '.':  'periodKey',
    '?':  '/Key',  '~': '~Key',
};

function charToKeyId(ch) {
    if (CHAR_KEY_MAP[ch]) return CHAR_KEY_MAP[ch];
    const id = ch.toLowerCase() + 'Key';
    if (document.getElementById(id)) return id;
    return null;
}

// ─── Render ───────────────────────────────────────────────────────────────────

function currentMessage() {
    return MESSAGES[state.wordIndex] || '';
}

function renderWord() {
    const msg   = currentMessage();
    const typed = msg.slice(0, state.charIndex);
    const cur   = msg[state.charIndex] ?? '';
    const rest  = msg.slice(state.charIndex + 1);

    typedEl.textContent  = typed;
    cursorEl.textContent = cur === ' ' ? '\u00a0' : cur;
    remainEl.textContent = rest;

    cursorEl.classList.toggle('error', state.hasError);
}

function clearError() {
    state.hasError = false;
    errorHint.textContent = '';
    errorHint.classList.remove('visible');
    renderWord();
}

function showError(expected) {
    state.hasError = true;
    errorHint.textContent = `press "${expected === ' ' ? 'Space' : expected}"`;
    errorHint.classList.add('visible');
    const keyId = charToKeyId(expected);
    if (keyId) flashKeyError(keyId);
    renderWord();
}

// ─── Circle positioning ───────────────────────────────────────────────────────

function positionCircle() {
    if (state.gameOver || state.hasError) return;
    const msg = currentMessage();
    const ch  = msg[state.charIndex];
    if (ch === undefined) return;
    const keyId = charToKeyId(ch);
    if (!keyId) return;
    const keyEl = document.getElementById(keyId);
    if (!keyEl) return;

    const kRect    = kbContainer.getBoundingClientRect();
    const kEl      = keyEl.getBoundingClientRect();
    const top      = kEl.top  - kRect.top;
    const left     = kEl.left - kRect.left;
    const circleSz = circle.offsetWidth;

    circle.style.top  = `${top  + (kEl.height - circleSz) / 2}px`;
    circle.style.left = `${left + (kEl.width  - circleSz) / 2}px`;
}

// ─── Advance / complete logic ─────────────────────────────────────────────────

function advanceChar() {
    const msg = currentMessage();

    if (state.charIndex < msg.length - 1) {
        state.charIndex++;
        renderWord();
        positionCircle();
        return;
    }

    state.charIndex = 0;
    state.wordIndex++;

    if (state.wordIndex === 2) {
        scriptureEl.classList.add('visible');
    }

    if (state.wordIndex > ASK_AFTER_INDEX && !state.doneAsking) {
        showAskSegment();
        return;
    }

    if (state.wordIndex >= MESSAGES.length) {
        showDetails();
        return;
    }

    renderWord();
    positionCircle();
}

function processKey(key) {
    if (state.gameOver) return;
    if (state.doneAsking && askSegment.style.display !== 'none') return;

    const msg      = currentMessage();
    const expected = msg[state.charIndex];
    if (expected === undefined) return;

    if (key === 'Backspace') {
        if (state.hasError) { clearError(); positionCircle(); }
        return;
    }

    const isLetter = expected.length === 1 && /[a-zA-Z]/.test(expected);
    const match    = isLetter ? key.toLowerCase() === expected.toLowerCase() : key === expected;

    if (match && !state.hasError) {
        flashKey(charToKeyId(expected), false);
        advanceChar();
    } else if (!match) {
        showError(expected);
    }
}

// ─── Key flash helpers ────────────────────────────────────────────────────────

function flashKey(keyId) {
    if (!keyId) return;
    const el = document.getElementById(keyId);
    if (!el) return;
    el.classList.add('pressed');
    setTimeout(() => el.classList.remove('pressed'), 120);
}

function flashKeyError(keyId) {
    if (!keyId) return;
    const el = document.getElementById(keyId);
    if (!el) return;
    el.style.animation = 'keyError 0.3s ease';
    el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
}

// ─── UI state transitions ─────────────────────────────────────────────────────

function showAskSegment() {
    state.doneAsking = true;
    wordContainer.style.display = 'none';
    kbContainer.style.display   = 'none';
    controlsRow.style.display   = 'none';
    circle.style.display        = 'none';
    scriptureEl.classList.remove('visible');
    askSegment.style.display    = 'flex';

    // NO starts inline next to YES — do NOT switch to fixed yet.
    // teleportNo() will promote it to fixed on the first hover/touch.
    noBtn.style.position = 'static';
    noBtn.style.display  = 'inline-block';
    noBtn.style.left     = '';
    noBtn.style.top      = '';
}

function showDetails() {
    state.gameOver = true;
    wordContainer.style.display = 'none';
    kbContainer.style.display   = 'none';
    controlsRow.style.display   = 'none';
    circle.style.display        = 'none';
    askSegment.style.display    = 'none';
    // Return no-btn to normal flow and hide it
    noBtn.style.position = 'static';
    noBtn.style.display  = 'none';
    detailsEl.style.display = 'flex';
}

function showGame() {
    wordContainer.style.display = 'flex';
    kbContainer.style.display   = 'flex';
    controlsRow.style.display   = 'flex';
    circle.style.display        = 'block';
    askSegment.style.display    = 'none';
    noBtn.style.position        = 'static';
    noBtn.style.display         = 'none';
    detailsEl.style.display     = 'none';
}

// ─── NO button — teleport on hover & click ────────────────────────────────────
function teleportNo() {
    const PAD = 12;

    // Pretend the button is always 300x300
    const btnW = 300;
    const btnH = 300;

    noBtn.style.position = 'fixed';

    const maxX = Math.max(PAD, window.innerWidth - btnW - PAD);
    const maxY = Math.max(PAD, window.innerHeight - btnH - PAD);

    const x = Math.floor(Math.random() * (maxX - PAD + 1)) + PAD;
    const y = Math.floor(Math.random() * (maxY - PAD + 1)) + PAD;

    noBtn.style.left = `${x}px`;
    noBtn.style.top = `${y}px`;
}

// Teleport on hover and click
noBtn.addEventListener('mouseenter', teleportNo);
noBtn.addEventListener('touchstart', teleportNo, { passive: true });
noBtn.addEventListener('click',      teleportNo);

// Re-clamp if screen resizes while NO is floating
window.addEventListener('resize', () => {
    if (noBtn.style.position === 'fixed') teleportNo();
});

// ─── YES button ───────────────────────────────────────────────────────────────

window.yesButton = function () {
    // Return no-btn to normal flow before switching screens
    noBtn.style.position = 'static';
    noBtn.style.display  = 'none';

    showGame();
    skipBtn.style.display = 'block';
    renderWord();
    positionCircle();
};

// ─── Skip button ──────────────────────────────────────────────────────────────

skipBtn.addEventListener('click', () => {
    if (state.gameOver) return;
    clearError();
    state.charIndex = 0;
    state.wordIndex++;

    if (state.wordIndex === 2) {
        scriptureEl.classList.add('visible');
    }

    if (state.wordIndex > ASK_AFTER_INDEX && !state.doneAsking) {
        showAskSegment();
        return;
    }

    if (state.wordIndex >= MESSAGES.length) {
        showDetails();
        return;
    }

    renderWord();
    positionCircle();
});

// ─── Scripture close ──────────────────────────────────────────────────────────

document.getElementById('scripture-close').addEventListener('click', () => {
    scriptureEl.classList.remove('visible');
});

// ─── Restart ──────────────────────────────────────────────────────────────────

window.restartGame = function () {
    state.wordIndex  = 0;
    state.charIndex  = 0;
    state.hasError   = false;
    state.doneAsking = false;
    state.gameOver   = false;

    noBtn.style.position = 'static';
    noBtn.style.display  = 'none';

    scriptureEl.classList.remove('visible');
    clearError();
    showGame();
    skipBtn.style.display = 'block';
    renderWord();
    positionCircle();
};

// ─── Physical keyboard ────────────────────────────────────────────────────────

const IGNORED_KEYS = new Set([
    'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Escape', 'Enter', 'Insert', 'Delete', 'Home', 'End',
    'PageUp', 'PageDown', 'F1','F2','F3','F4','F5','F6',
    'F7','F8','F9','F10','F11','F12',
]);

document.addEventListener('keydown', (e) => {
    if (IGNORED_KEYS.has(e.key)) return;
    const keyId = charToKeyId(e.key) ?? (e.key.toLowerCase() + 'Key');
    const el    = document.getElementById(keyId);
    if (el) el.classList.add('pressed');
    processKey(e.key);
    if (e.key === ' ') e.preventDefault();
});

document.addEventListener('keyup', (e) => {
    if (IGNORED_KEYS.has(e.key)) return;
    const keyId = charToKeyId(e.key) ?? (e.key.toLowerCase() + 'Key');
    const el    = document.getElementById(keyId);
    if (el) el.classList.remove('pressed');
});

// ─── On-screen keyboard clicks ────────────────────────────────────────────────

kbContainer.addEventListener('click', (e) => {
    const keyEl = e.target.closest('.key');
    if (!keyEl) return;
    const rawKey = keyEl.dataset.key;
    if (!rawKey || rawKey === 'Tab' || rawKey === 'CapsLock'
        || rawKey === 'Shift' || rawKey === 'Control' || rawKey === 'Alt') return;
    keyEl.classList.add('pressed');
    setTimeout(() => keyEl.classList.remove('pressed'), 120);
    processKey(rawKey);
});

circle.addEventListener('click', () => {
    const msg      = currentMessage();
    const expected = msg[state.charIndex];
    if (expected === undefined) return;
    if (state.hasError) { clearError(); positionCircle(); return; }
    flashKey(charToKeyId(expected));
    advanceChar();
});

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // no-btn starts hidden inside the ask-segment (static flow), invisible until ask screen
    noBtn.style.display = 'none';
    renderWord();
    positionCircle();
    skipBtn.style.display = 'block';
});