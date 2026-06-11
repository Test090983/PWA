// ══════════════════════════════════════════════════════════
//  Spruch des Tages – app.js
//  Features: Swipe, TTS, Streak, Favoriten, KI, Bild-Export, Vibration
// ══════════════════════════════════════════════════════════

const quotes = [
  { text: "Der einzige Weg, großartige Arbeit zu leisten, ist zu lieben, was man tut.", author: "Steve Jobs",          tag: "Arbeit"      },
  { text: "Es ist nicht genug zu wissen – man muss auch anwenden.",                    author: "J. W. v. Goethe",      tag: "Weisheit"    },
  { text: "Wer aufhört besser zu werden, hat aufgehört gut zu sein.",                  author: "Philip Rosenthal",     tag: "Wachstum"    },
  { text: "Träume nicht dein Leben, lebe deinen Traum.",                               author: "Unbekannt",            tag: "Inspiration" },
  { text: "Der Klügere gibt nach – aber nicht auf.",                                   author: "Unbekannt",            tag: "Stärke"      },
  { text: "Das Geheimnis des Erfolgs ist anzufangen.",                                 author: "Mark Twain",           tag: "Erfolg"      },
  { text: "Jeder Tag ist eine neue Chance, dein Leben zu verändern.",                  author: "Unbekannt",            tag: "Motivation"  },
  { text: "Du musst die Veränderung sein, die du in der Welt sehen möchtest.",         author: "Mahatma Gandhi",       tag: "Wandel"      },
  { text: "Scheitern ist nur die Möglichkeit, es beim nächsten Mal besser zu machen.", author: "Henry Ford",           tag: "Resilienz"   },
  { text: "Erfolg ist die Summe kleiner Anstrengungen, die man Tag für Tag wiederholt.",author: "Robert Collier",      tag: "Disziplin"   }
];

// ── DOM ────────────────────────────────────────────────────
const cardFront   = document.getElementById('card-front');
const cardBack    = document.getElementById('card-back');
const quoteText   = document.getElementById('quote-text');
const quoteAuthor = document.getElementById('quote-author');
const quoteTag    = document.getElementById('quote-tag');
const backText    = document.getElementById('back-text');
const backAuthor  = document.getElementById('back-author');
const newBtn      = document.getElementById('new-quote-btn');
const ttsBtn      = document.getElementById('tts-btn');
const favBtn      = document.getElementById('fav-btn');
const favIcon     = document.getElementById('fav-icon');
const shareBtn    = document.getElementById('share-btn');
const copyBtn     = document.getElementById('copy-btn');
const aiBtn       = document.getElementById('ai-btn');
const notifyBtn   = document.getElementById('notify-btn');
const statusMsg   = document.getElementById('status-msg');
const streakBadge = document.getElementById('streak-badge');
const streakCount = document.getElementById('streak-count');
const favsSection = document.getElementById('favs-section');
const favsList    = document.getElementById('favs-list');
const labelSkip   = document.getElementById('label-skip');
const labelLike   = document.getElementById('label-like');
const swipeArea   = document.getElementById('swipe-area');

// ── State ──────────────────────────────────────────────────
let currentIndex = new Date().getDate() % quotes.length;
let dotIndex     = 0;
let isSpeaking   = false;
let statusTimer  = null;
let favorites    = JSON.parse(localStorage.getItem('favs') || '[]');
let isDragging   = false;

// ── Vibration helper (nur nach User-Interaktion) ───────────
function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

// ── Streak-Logik ───────────────────────────────────────────
function updateStreak() {
  const today     = new Date().toDateString();
  const lastVisit = localStorage.getItem('lastVisit');
  let   streak    = parseInt(localStorage.getItem('streak') || '0');

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (lastVisit === today) {
    // Schon heute besucht – nix ändern
  } else if (lastVisit === yesterday.toDateString()) {
    streak += 1;
    streakBadge.classList.add('pop');
    setTimeout(() => streakBadge.classList.remove('pop'), 400);
  } else {
    streak = 1;
  }

  localStorage.setItem('streak', streak);
  localStorage.setItem('lastVisit', today);
  streakCount.textContent = streak;
}

updateStreak();

// ── Spruch anzeigen ────────────────────────────────────────
function displayQuote(quote) {
  quoteText.textContent   = quote.text;
  quoteAuthor.textContent = '— ' + quote.author;
  quoteTag.textContent    = quote.tag;
  updateFavBtn();
}

function displayBackQuote(quote) {
  if (!quote) return;
  backText.textContent   = quote.text;
  backAuthor.textContent = '— ' + quote.author;
}

displayQuote(quotes[currentIndex]);
const nextIdx = (currentIndex + 1) % quotes.length;
displayBackQuote(quotes[nextIdx]);

// ── Dot ────────────────────────────────────────────────────
function advanceDot() {
  const dots = document.querySelectorAll('.dot');
  dots[dotIndex].classList.remove('active');
  dotIndex = (dotIndex + 1) % dots.length;
  dots[dotIndex].classList.add('active');
}

// ── Status-Meldung ─────────────────────────────────────────
function showStatus(msg, ms = 3000) {
  clearTimeout(statusTimer);
  statusMsg.textContent = msg;
  if (ms > 0) statusTimer = setTimeout(() => { statusMsg.textContent = ''; }, ms);
}

// ── Favoriten ──────────────────────────────────────────────
function saveFavs() { localStorage.setItem('favs', JSON.stringify(favorites)); }

function isFav(text) { return favorites.some(f => f.text === text); }

function updateFavBtn() {
  if (isFav(quoteText.textContent)) {
    favBtn.classList.add('active');
    favIcon.setAttribute('fill', '#f472b6');
    favIcon.setAttribute('stroke', '#f472b6');
  } else {
    favBtn.classList.remove('active');
    favIcon.setAttribute('fill', 'none');
    favIcon.setAttribute('stroke', 'currentColor');
  }
}

function renderFavs() {
  if (favorites.length === 0) {
    favsSection.style.display = 'none';
    return;
  }
  favsSection.style.display = 'block';
  favsList.innerHTML = favorites.map((f, i) => `
    <div class="fav-item">
      <button class="fav-remove" data-i="${i}" aria-label="Entfernen">✕</button>
      <p class="fav-text">"${f.text}"</p>
      <span class="fav-author">— ${f.author}</span>
    </div>
  `).join('');

  favsList.querySelectorAll('.fav-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      favorites.splice(parseInt(btn.dataset.i), 1);
      saveFavs();
      renderFavs();
      updateFavBtn();
    });
  });
}

renderFavs();

favBtn.addEventListener('click', () => {
  const q = quotes[currentIndex];
  if (isFav(q.text)) {
    favorites = favorites.filter(f => f.text !== q.text);
    showStatus('Aus Favoriten entfernt.');
  } else {
    favorites.unshift(q);
    showStatus('❤️ Zu Favoriten hinzugefügt!');
    if (navigator.vibrate) navigator.vibrate(50);
  }
  saveFavs();
  renderFavs();
  updateFavBtn();
});

// ── Neuer Spruch (Button) ──────────────────────────────────
newBtn.addEventListener('click', () => nextQuote());

function nextQuote() {
  stopSpeech();
  currentIndex = (currentIndex + 1) % quotes.length;
  displayQuote(quotes[currentIndex]);
  const nxt = (currentIndex + 1) % quotes.length;
  displayBackQuote(quotes[nxt]);
  advanceDot();
}

// ── Swipe ──────────────────────────────────────────────────
let startX = 0, startY = 0, currentX = 0;

function onDragStart(x, y) {
  isDragging = true;
  startX = x;
  startY = y;
  currentX = x;
  cardFront.style.transition = 'none';
}

function onDragMove(x) {
  if (!isDragging) return;
  currentX = x;
  const dx  = x - startX;
  const rot = dx / 15;
  cardFront.style.transform = `translateX(${dx}px) rotate(${rot}deg)`;

  const ratio = Math.min(Math.abs(dx) / 80, 1);
  if (dx < -20) {
    labelSkip.style.opacity = ratio;
    labelLike.style.opacity = 0;
  } else if (dx > 20) {
    labelLike.style.opacity = ratio;
    labelSkip.style.opacity = 0;
  } else {
    labelSkip.style.opacity = 0;
    labelLike.style.opacity = 0;
  }
}

function onDragEnd() {
  if (!isDragging) return;
  isDragging = false;
  const dx = currentX - startX;
  labelSkip.style.opacity = 0;
  labelLike.style.opacity = 0;
  cardFront.style.transition = '';

  if (dx < -60) {
    swipeOut('left');
  } else if (dx > 60) {
    swipeOut('right');
  } else {
    cardFront.style.transform = '';
  }
}

function swipeOut(dir) {
  cardFront.classList.add(dir === 'left' ? 'fly-left' : 'fly-right');

  if (dir === 'right') {
    // Like / Favorit
    const q = quotes[currentIndex];
    if (!isFav(q.text)) {
      favorites.unshift(q);
      saveFavs();
      renderFavs();
      showStatus('❤️ Favorit gespeichert!');
    }
    if (navigator.vibrate) navigator.vibrate([40, 20, 40]);
  } else {
    if (navigator.vibrate) navigator.vibrate(30);
  }

  setTimeout(() => {
    cardFront.classList.remove('fly-left', 'fly-right');
    cardFront.style.transform = '';
    stopSpeech();
    currentIndex = (currentIndex + 1) % quotes.length;
    displayQuote(quotes[currentIndex]);
    const nxt = (currentIndex + 1) % quotes.length;
    displayBackQuote(quotes[nxt]);
    advanceDot();
    updateFavBtn();
  }, 360);
}

// Touch events
swipeArea.addEventListener('touchstart', e => onDragStart(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
swipeArea.addEventListener('touchmove',  e => onDragMove(e.touches[0].clientX),  { passive: true });
swipeArea.addEventListener('touchend',   onDragEnd);

// Mouse events
swipeArea.addEventListener('mousedown',  e => onDragStart(e.clientX, e.clientY));
window.addEventListener('mousemove',     e => { if (isDragging) onDragMove(e.clientX); });
window.addEventListener('mouseup',       onDragEnd);

// ── Text-to-Speech ─────────────────────────────────────────
function stopSpeech() {
  if (speechSynthesis.speaking) speechSynthesis.cancel();
  isSpeaking = false;
  ttsBtn.classList.remove('speaking');
}

ttsBtn.addEventListener('click', () => {
  if (!('speechSynthesis' in window)) {
    showStatus('❌ TTS nicht unterstützt.');
    return;
  }

  if (isSpeaking) {
    stopSpeech();
    return;
  }

  const q    = quotes[currentIndex];
  const text = `${q.text} — ${q.author}`;
  const utt  = new SpeechSynthesisUtterance(text);
  utt.lang   = 'de-DE';
  utt.rate   = 0.92;
  utt.pitch  = 1.0;

  // Bevorzugt eine deutsche Stimme
  const voices = speechSynthesis.getVoices();
  const deVoice = voices.find(v => v.lang.startsWith('de'));
  if (deVoice) utt.voice = deVoice;

  utt.onstart = () => { isSpeaking = true; ttsBtn.classList.add('speaking'); };
  utt.onend   = () => { isSpeaking = false; ttsBtn.classList.remove('speaking'); };
  utt.onerror = () => { isSpeaking = false; ttsBtn.classList.remove('speaking'); };

  speechSynthesis.speak(utt);
  if (navigator.vibrate) navigator.vibrate(30);
});

// Stimmen laden (Chrome lädt sie async)
speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();

// ── Kopieren ───────────────────────────────────────────────
copyBtn.addEventListener('click', () => {
  const q    = quotes[currentIndex];
  const text = `"${q.text}" — ${q.author}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
      .then(() => showStatus('✓ Kopiert!'))
      .catch(() => showStatus('Kopieren fehlgeschlagen.'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta); showStatus('✓ Kopiert!');
  }
  if (navigator.vibrate) navigator.vibrate(30);
});

// ── Bild-Export (Instagram Story) ─────────────────────────
shareBtn.addEventListener('click', async () => {
  const q = quotes[currentIndex];

  const canvas  = document.getElementById('export-canvas');
  const ctx     = canvas.getContext('2d');
  canvas.width  = 1080;
  canvas.height = 1920;

  // Hintergrund
  const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
  grad.addColorStop(0,   '#0f0c29');
  grad.addColorStop(0.5, '#302b63');
  grad.addColorStop(1,   '#24243e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  // Orb
  const orb = ctx.createRadialGradient(200, 300, 0, 200, 300, 500);
  orb.addColorStop(0, 'rgba(124,58,237,0.35)');
  orb.addColorStop(1, 'transparent');
  ctx.fillStyle = orb;
  ctx.fillRect(0, 0, 1080, 1920);

  // Card background
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  roundRect(ctx, 80, 700, 920, 520, 48);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  roundRect(ctx, 80, 700, 920, 520, 48);
  ctx.stroke();

  // Quote mark
  ctx.font = 'italic 160px Georgia, serif';
  ctx.fillStyle = 'rgba(167,139,250,0.30)';
  ctx.fillText('"', 110, 830);

  // Quote text (wrapped)
  ctx.font = 'italic 52px Georgia, serif';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  wrapText(ctx, q.text, 120, 900, 840, 68);

  // Divider
  const divGrad = ctx.createLinearGradient(120, 0, 280, 0);
  divGrad.addColorStop(0, '#a78bfa');
  divGrad.addColorStop(1, '#fb923c');
  ctx.fillStyle = divGrad;
  ctx.fillRect(120, 1148, 160, 6);

  // Author
  ctx.font = '500 38px DM Sans, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.40)';
  ctx.fillText('— ' + q.author.toUpperCase(), 120, 1210);

  // App name watermark
  ctx.font = '500 32px DM Sans, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.textAlign = 'center';
  ctx.fillText('🌅 Spruch des Tages', 540, 1800);

  // Download
  const link  = document.createElement('a');
  link.href   = canvas.toDataURL('image/png');
  link.download = 'spruch-story.png';
  link.click();

  showStatus('📸 Story-Bild gespeichert!');
  if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
});

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + ' ';
    if (ctx.measureText(test).width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
}

// ── KI-Spruch (Claude API) ─────────────────────────────────
aiBtn.addEventListener('click', async () => {
  aiBtn.disabled = true;
  aiBtn.innerHTML = '<div class="spinner"></div> Generiere…';

  try {
    // Proxy auf eigenem Server – vermeidet CORS-Fehler
    // Erstelle api-proxy.php auf deinem Server (siehe Kommentar unten)
    const response = await fetch('api-proxy.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Erstelle einen einzigen kurzen, inspirierenden Motivationsspruch auf Deutsch. Antworte NUR im Format: SPRUCH|||AUTOR (z.B. Träume groß.|||Unbekannt). Kein anderer Text.'
      })
    });

    if (!response.ok) throw new Error('Proxy nicht erreichbar');
    const data = await response.json();
    const raw  = (data.text || '').trim();
    const parts = raw.split('|||');

    if (parts.length === 2) {
      const aiQuote = { text: parts[0].trim(), author: parts[1].trim(), tag: 'KI-Spruch' };
      stopSpeech();
      quoteText.textContent   = aiQuote.text;
      quoteAuthor.textContent = '— ' + aiQuote.author;
      quoteTag.textContent    = '✨ KI-Spruch';
      quotes.splice(currentIndex + 1, 0, aiQuote);
      currentIndex++;
      advanceDot();
      updateFavBtn();
      showStatus('✨ KI-Spruch generiert!');
      if (navigator.vibrate) navigator.vibrate([40, 20, 80]);
    } else {
      throw new Error('Ungültiges Format');
    }
  } catch (err) {
    console.warn('API-Proxy Fehler, nutze lokalen Fallback:', err);
    // Lokaler Fallback – zufälliger Spruch aus erweiterter Liste
    const fallbackQuotes = [
      { text: 'Jeder Moment ist ein Neuanfang.', author: 'T.S. Eliot' },
      { text: 'Deine Einschränkungen sind nur in deinem Kopf.', author: 'Unbekannt' },
      { text: 'Wachstum beginnt am Ende deiner Komfortzone.', author: 'Unbekannt' },
      { text: 'Kleine Fortschritte sind immer noch Fortschritte.', author: 'Unbekannt' },
      { text: 'Der beste Zeitpunkt war gestern. Der zweitbeste ist heute.', author: 'Sprichwort' },
      { text: 'Du musst nicht perfekt sein, um anzufangen. Aber du musst anfangen, um perfekt zu werden.', author: 'Unbekannt' },
      { text: 'Glaube an dich selbst und an alles, was du bist.', author: 'Christian D. Larson' },
    ];
    const fb = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    const aiQuote = { text: fb.text, author: fb.author, tag: 'KI-Spruch' };
    stopSpeech();
    quoteText.textContent   = aiQuote.text;
    quoteAuthor.textContent = '— ' + aiQuote.author;
    quoteTag.textContent    = '✨ Spruch';
    quotes.splice(currentIndex + 1, 0, aiQuote);
    currentIndex++;
    advanceDot();
    updateFavBtn();
    showStatus('✨ Neuer Spruch!');
  }

  aiBtn.disabled = false;
  aiBtn.innerHTML = `<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/></svg> ✨ KI-Spruch generieren`;
});

// ── Push-Benachrichtigungen ────────────────────────────────
notifyBtn.addEventListener('click', async () => {
  if (!('Notification' in window)) { showStatus('❌ Nicht unterstützt.'); return; }
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    setNotifyActive();
    sendQuoteNotification();
    scheduleDailyNotification();
    showStatus('✓ Täglich um 7:00 Uhr!', 0);
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
  } else {
    showStatus('❌ Berechtigung verweigert.', 4000);
  }
});

function setNotifyActive() {
  notifyBtn.innerHTML = `<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="m9 3 1.2 1.5M15 3l-1.2 1.5"/></svg> ✅ Aktiviert`;
  notifyBtn.disabled = true;
}

function getDailyQuote() { return quotes[new Date().getDate() % quotes.length]; }

function sendQuoteNotification() {
  if (Notification.permission !== 'granted') return;
  const q = getDailyQuote();
  new Notification('🌅 Dein Spruch des Tages', {
    body: `"${q.text}" — ${q.author}`,
    icon: 'icons/icon-192.png', badge: 'icons/favicon-32.png'
  });
}

function scheduleDailyNotification() {
  if (Notification.permission !== 'granted') return;
  const now = new Date(), next7 = new Date();
  next7.setHours(7, 0, 0, 0);
  if (now >= next7) next7.setDate(next7.getDate() + 1);
  const delay = next7 - now;
  setTimeout(() => {
    sendQuoteNotification();
    setInterval(sendQuoteNotification, 86400000);
  }, delay);
}

if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
  setNotifyActive();
  scheduleDailyNotification();
}

// ── Service Worker ─────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(reg => console.log('SW registriert:', reg.scope))
    .catch(err => console.error('SW Fehler:', err));
}

// ══════════════════════════════════════════════════════════
//  EXTRA FEATURES: Taschenlampe, Location, Schritte, Ambient
// ══════════════════════════════════════════════════════════

const torchBtn    = document.getElementById('torch-btn');
const locationBtn = document.getElementById('location-btn');
const stepsBtn    = document.getElementById('steps-btn');
const ambientBtn  = document.getElementById('ambient-btn');

const locationPanel = document.getElementById('location-panel');
const locationContent = document.getElementById('location-content');
const stepsPanel    = document.getElementById('steps-panel');
const stepsCount    = document.getElementById('steps-count');
const stepsBar      = document.getElementById('steps-bar');
const ambientPanel  = document.getElementById('ambient-panel');
const ambientRing   = document.getElementById('ambient-ring');
const ambientValue  = document.getElementById('ambient-value');
const ambientLabel  = document.getElementById('ambient-label');

// ── 🔦 Taschenlampe ────────────────────────────────────────
let torchStream = null;
let torchOn = false;

torchBtn.addEventListener('click', async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showStatus('❌ Kamera nicht unterstützt.');
    return;
  }
  try {
    if (!torchOn) {
      torchStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', advanced: [{ torch: true }] }
      });
      // Try to enable torch via track constraints
      const track = torchStream.getVideoTracks()[0];
      if (track && track.applyConstraints) {
        await track.applyConstraints({ advanced: [{ torch: true }] });
      }
      torchOn = true;
      torchBtn.classList.add('torch-on');
      torchBtn.querySelector('span').textContent = 'AUS';
      showStatus('🔦 Taschenlampe an!');
      if (navigator.vibrate) navigator.vibrate([30, 20, 60]);
    } else {
      if (torchStream) {
        const track = torchStream.getVideoTracks()[0];
        if (track && track.applyConstraints) {
          await track.applyConstraints({ advanced: [{ torch: false }] });
        }
        torchStream.getTracks().forEach(t => t.stop());
        torchStream = null;
      }
      torchOn = false;
      torchBtn.classList.remove('torch-on');
      torchBtn.querySelector('span').textContent = 'Taschenlampe';
      showStatus('🔦 Taschenlampe aus.');
    }
  } catch (err) {
    console.error(err);
    showStatus('❌ Kamera-Berechtigung nötig.');
  }
});

// ── 📍 Standort ────────────────────────────────────────────
let locationOpen = false;

const WEATHER_EMOJIS = [
  { max: 2,  emoji: '⛈️',  label: 'Gewitter' },
  { max: 3,  emoji: '🌨️',  label: 'Schneesturm' },
  { max: 5,  emoji: '🌧️',  label: 'Starkregen' },
  { max: 45, emoji: '🌦️',  label: 'Schauer' },
  { max: 48, emoji: '🌫️',  label: 'Nebel' },
  { max: 65, emoji: '🌧️',  label: 'Regen' },
  { max: 77, emoji: '🌨️',  label: 'Schnee' },
  { max: 82, emoji: '🌦️',  label: 'Regenschauer' },
  { max: 99, emoji: '⛈️',  label: 'Gewitter' },
];

function getWeatherEmoji(wmo) {
  if (wmo <= 1)  return { emoji: '☀️',  label: 'Sonnig' };
  if (wmo <= 3)  return { emoji: '⛅',  label: 'Bewölkt' };
  for (const w of WEATHER_EMOJIS) if (wmo <= w.max) return w;
  return { emoji: '🌤️', label: 'Wechselhaft' };
}

const LOCATION_QUOTES = [
  'Jeder Ort hat seine eigene Magie.',
  'Wo du auch bist – du bist genau richtig.',
  'Der schönste Platz ist der, wo du gerade bist.',
  'Heimat ist dort, wo das Herz ist.',
  'Reise mit offenen Augen und offenem Herzen.'
];

locationBtn.addEventListener('click', async () => {
  if (locationOpen) {
    locationPanel.style.display = 'none';
    locationOpen = false;
    locationBtn.classList.remove('active-feature');
    return;
  }

  if (!navigator.geolocation) {
    showStatus('❌ GPS nicht unterstützt.');
    return;
  }

  locationPanel.style.display = 'block';
  locationOpen = true;
  locationBtn.classList.add('active-feature');
  locationContent.innerHTML = '<div class="panel-spinner"></div>';

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude: lat, longitude: lon, accuracy } = pos.coords;
    try {
      // Reverse geocode via nominatim
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      const geo = await geoRes.json();
      const city = geo.address?.city || geo.address?.town || geo.address?.village || geo.address?.county || 'Unbekannt';
      const country = geo.address?.country || '';

      // Weather via open-meteo
      const wxRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m`
      );
      const wx = await wxRes.json();
      const temp  = Math.round(wx.current?.temperature_2m ?? 0);
      const wcode = wx.current?.weathercode ?? 0;
      const wind  = Math.round(wx.current?.windspeed_10m ?? 0);
      const { emoji, label } = getWeatherEmoji(wcode);

      const quote = LOCATION_QUOTES[Math.floor(Math.random() * LOCATION_QUOTES.length)];
      const accStr = accuracy < 50 ? '🎯 Genau' : accuracy < 200 ? '📡 Ca.' : '🔄 Ungefähr';

      locationContent.innerHTML = `
        <div class="location-city">${emoji} ${city}</div>
        <div class="location-coords">${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E · ${accStr} ±${Math.round(accuracy)}m</div>
        <div class="location-meta">
          <span class="location-chip">🌡️ ${temp}°C</span>
          <span class="location-chip">💨 ${wind} km/h</span>
          <span class="location-chip">${label}</span>
          <span class="location-chip">🌍 ${country}</span>
        </div>
        <div class="location-quote">"${quote}"</div>
      `;
      if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
    } catch (err) {
      locationContent.innerHTML = `<div class="location-city">📍 Ort gefunden</div>
        <div class="location-coords">${lat.toFixed(5)}, ${lon.toFixed(5)}</div>`;
    }
  }, (err) => {
    locationContent.innerHTML = '<span style="color:rgba(248,113,113,0.9);font-size:.85rem">❌ GPS-Berechtigung verweigert</span>';
    locationBtn.classList.remove('active-feature');
  }, { enableHighAccuracy: true, timeout: 10000 });
});

// ── 👟 Schrittzähler ───────────────────────────────────────
let stepCount = parseInt(localStorage.getItem('steps_today') || '0');
let lastStepDate = localStorage.getItem('steps_date') || '';
let stepsOpen = false;
let motionActive = false;
let lastAccelMag = 0;
const STEP_THRESHOLD = 12;
const STEP_COOLDOWN = 350;
let lastStepTime = 0;

// Reset daily
const todayStr = new Date().toDateString();
if (lastStepDate !== todayStr) {
  stepCount = 0;
  localStorage.setItem('steps_today', '0');
  localStorage.setItem('steps_date', todayStr);
}

function updateStepsUI() {
  stepsCount.textContent = stepCount.toLocaleString('de-DE');
  const pct = Math.min((stepCount / 10000) * 100, 100);
  stepsBar.style.width = pct + '%';
}

updateStepsUI();

function handleMotion(event) {
  const { x, y, z } = event.accelerationIncludingGravity || {};
  if (x == null) return;
  const mag = Math.sqrt(x*x + y*y + z*z);
  const delta = Math.abs(mag - lastAccelMag);
  lastAccelMag = mag;
  const now = Date.now();
  if (delta > STEP_THRESHOLD && (now - lastStepTime) > STEP_COOLDOWN) {
    stepCount++;
    lastStepTime = now;
    localStorage.setItem('steps_today', stepCount);
    updateStepsUI();
    if (stepCount % 100 === 0 && navigator.vibrate) navigator.vibrate(40);
  }
}

stepsBtn.addEventListener('click', async () => {
  if (stepsOpen) {
    stepsPanel.style.display = 'none';
    stepsOpen = false;
    stepsBtn.classList.remove('active-feature');
    if (motionActive) {
      window.removeEventListener('devicemotion', handleMotion);
      motionActive = false;
    }
    return;
  }

  stepsPanel.style.display = 'block';
  stepsOpen = true;
  stepsBtn.classList.add('active-feature');
  updateStepsUI();

  // Request permission on iOS 13+
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    try {
      const perm = await DeviceMotionEvent.requestPermission();
      if (perm === 'granted') {
        window.addEventListener('devicemotion', handleMotion);
        motionActive = true;
        showStatus('👟 Schrittzähler aktiv!');
      } else {
        showStatus('❌ Bewegungssensor verweigert.');
      }
    } catch(e) {
      showStatus('❌ Sensor-Fehler.');
    }
  } else if (typeof DeviceMotionEvent !== 'undefined') {
    window.addEventListener('devicemotion', handleMotion);
    motionActive = true;
    showStatus('👟 Schrittzähler aktiv!');
  } else {
    showStatus('❌ Sensor nicht unterstützt.');
  }
  if (navigator.vibrate) navigator.vibrate(30);
});

// ── ☀️ Lichtsensor / Umgebungslicht ────────────────────────
let ambientOpen = false;
let lightSensor = null;

function describeLux(lux) {
  if (lux < 1)    return { label: '🌑 Fast dunkel', cls: 'dim' };
  if (lux < 50)   return { label: '🕯️ Kerzenlicht', cls: 'dim' };
  if (lux < 200)  return { label: '💡 Innenraum', cls: '' };
  if (lux < 1000) return { label: '🏠 Helles Zimmer', cls: '' };
  if (lux < 5000) return { label: '🌤️ Bewölkt draußen', cls: 'bright' };
  return { label: '☀️ Direktes Sonnenlicht', cls: 'bright' };
}

ambientBtn.addEventListener('click', async () => {
  if (ambientOpen) {
    ambientPanel.style.display = 'none';
    ambientOpen = false;
    ambientBtn.classList.remove('active-feature');
    if (lightSensor) { try { lightSensor.stop(); } catch(e){} lightSensor = null; }
    return;
  }

  ambientPanel.style.display = 'block';
  ambientOpen = true;
  ambientBtn.classList.add('active-feature');

  if ('AmbientLightSensor' in window) {
    try {
      // @ts-ignore
      lightSensor = new AmbientLightSensor();
      lightSensor.onreading = () => {
        const lux = Math.round(lightSensor.illuminance);
        ambientValue.textContent = lux.toLocaleString('de-DE');
        const { label, cls } = describeLux(lux);
        ambientLabel.textContent = label;
        ambientRing.className = 'ambient-ring' + (cls ? ' ' + cls : '');
      };
      lightSensor.onerror = (e) => {
        ambientLabel.textContent = '❌ Sensor-Fehler: ' + e.error.message;
      };
      lightSensor.start();
      showStatus('💡 Lichtsensor aktiv!');
    } catch(e) {
      ambientLabel.textContent = '❌ Kein Lichtsensor verfügbar.';
    }
  } else {
    // Fallback: DeviceLight event (older browsers)
    const handler = (e) => {
      const lux = Math.round(e.value);
      ambientValue.textContent = lux.toLocaleString('de-DE');
      const { label, cls } = describeLux(lux);
      ambientLabel.textContent = label;
      ambientRing.className = 'ambient-ring' + (cls ? ' ' + cls : '');
    };
    window.addEventListener('devicelight', handler);
    // Store to remove later
    ambientBtn._lightHandler = handler;
    // Check if event fires (after 1s, show fallback if not)
    setTimeout(() => {
      if (ambientValue.textContent === '—') {
        ambientLabel.textContent = '📱 Sensor nicht verfügbar auf diesem Gerät';
        ambientValue.textContent = '?';
      }
    }, 1500);
    showStatus('💡 Sensor wird geprüft…');
  }
  if (navigator.vibrate) navigator.vibrate(20);
});

// ── Extras Drawer Toggle ───────────────────────────

const extrasToggleBtn = document.getElementById('extras-toggle-btn');
const extrasDrawer = document.getElementById('extras-drawer');
const extrasLabel = document.getElementById('extras-toggle-label');

extrasToggleBtn.addEventListener('click', () => {
  extrasDrawer.classList.toggle('open');
  extrasToggleBtn.classList.toggle('open');

  if (extrasDrawer.classList.contains('open')) {
    extrasLabel.textContent = 'Features ausblenden';
  } else {
    extrasLabel.textContent = 'Mehr Features';
  }
});