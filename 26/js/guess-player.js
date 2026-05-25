// ============================================================
//  guess-player.js — /js/guess-player.js  (ES Module)
//
//  "Guess the Player" game built on the same Madfut Data
//  design system as predictor.js.
//
//  HOW TO ADD PLAYERS:
//  Edit the PLAYER_DB array below. Each entry needs:
//    id          — unique string id for the player
//    name        — full display name
//    nationality — country name string
//    position    — e.g. "ST", "CM", "GK"
//    born        — birth year (number)
//    clubId      — Madfut club id (for face image in result)
//    career      — array of { clubId, leagueId, from, to }
//                  ordered MOST RECENT → OLDEST
//                  (most recent is hidden last; oldest revealed first)
// ============================================================

/* ── helpers ─────────────────────────────────────────────── */
function clubBadge(id)  { return `https://mf-data.b-cdn.net/26/Badges/Clubs/Large/club_large_${id}.png`; }
function leagueBadge(id){ return `https://mf-data.b-cdn.net/26/Badges/Leagues/Large/league_large_${id}.png`; }
function playerFace(id) { return `https://trivela.b-cdn.net/26/faces/p${id}_small.png`; }

function norm(s) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
}

/* ── Player database ──────────────────────────────────────── */
// Add as many players as you like.
// career is shown OLDEST first in the UI (reversed internally).

const PLAYER_DB = [
  {
    id: 'p1',
    name: 'Thierry Henry',
    nationality: 'French',
    position: 'ST',
    born: 1977,
    clubId: '1',               // Arsenal — used for result face
    career: [
      { clubId: '1',   leagueId: '13', from: 1999, to: 2007, label: 'Arsenal' },
      { clubId: '69',  leagueId: '16', from: 1994, to: 1999, label: 'Monaco' },
      { clubId: '45',  leagueId: '31', from: 1999, to: 1999, label: 'Juventus' },
      { clubId: '241', leagueId: '53', from: 2007, to: 2010, label: 'Barcelona' },
      { clubId: '689', leagueId: '39', from: 2010, to: 2014, label: 'Red Bulls' },
    ],
  },
  {
    id: 'p2',
    name: 'Steven Gerrard',
    nationality: 'English',
    position: 'CM',
    born: 1980,
    clubId: '9',
    career: [
      { clubId: '9',   leagueId: '13', from: 1998, to: 2015, label: 'Liverpool' },
      { clubId: '697', leagueId: '39', from: 2015, to: 2016, label: 'LA Galaxy' },
    ],
  },
  {
    id: 'p3',
    name: 'Ronaldinho',
    nationality: 'Brazilian',
    position: 'CAM',
    born: 1980,
    clubId: '241',
    career: [
      { clubId: '71',  leagueId: '16', from: 1998, to: 2001, label: 'Gremio' },
      { clubId: '73',  leagueId: '16', from: 2001, to: 2003, label: 'PSG' },
      { clubId: '241', leagueId: '53', from: 2003, to: 2008, label: 'Barcelona' },
      { clubId: '47',  leagueId: '31', from: 2008, to: 2011, label: 'Milan' },
      { clubId: '517', leagueId: '16', from: 2011, to: 2012, label: 'Flamengo' },
      { clubId: '567', leagueId: '16', from: 2012, to: 2015, label: 'Fluminense' },
    ],
  },
  {
    id: 'p4',
    name: 'Patrick Vieira',
    nationality: 'French',
    position: 'CM',
    born: 1976,
    clubId: '1',
    career: [
      { clubId: '219', leagueId: '16', from: 1994, to: 1995, label: 'Marseille' },
      { clubId: '47',  leagueId: '31', from: 1995, to: 1996, label: 'Milan' },
      { clubId: '1',   leagueId: '13', from: 1996, to: 2005, label: 'Arsenal' },
      { clubId: '45',  leagueId: '31', from: 2005, to: 2006, label: 'Juventus' },
      { clubId: '48',  leagueId: '31', from: 2006, to: 2010, label: 'Inter Milan' },
      { clubId: '10',  leagueId: '13', from: 2010, to: 2011, label: 'Man City' },
    ],
  },
  {
    id: 'p5',
    name: 'Gianluigi Buffon',
    nationality: 'Italian',
    position: 'GK',
    born: 1978,
    clubId: '45',
    career: [
      { clubId: '50',  leagueId: '31', from: 1995, to: 2001, label: 'Parma' },
      { clubId: '45',  leagueId: '31', from: 2001, to: 2018, label: 'Juventus' },
      { clubId: '73',  leagueId: '16', from: 2018, to: 2019, label: 'PSG' },
      { clubId: '45',  leagueId: '31', from: 2019, to: 2021, label: 'Juventus' },
      { clubId: '50',  leagueId: '31', from: 2021, to: 2023, label: 'Parma' },
    ],
  },
  {
    id: 'p6',
    name: 'Fernando Torres',
    nationality: 'Spanish',
    position: 'ST',
    born: 1984,
    clubId: '5',
    career: [
      { clubId: '240', leagueId: '53', from: 2001, to: 2007, label: 'Atlético' },
      { clubId: '9',   leagueId: '13', from: 2007, to: 2011, label: 'Liverpool' },
      { clubId: '5',   leagueId: '13', from: 2011, to: 2014, label: 'Chelsea' },
      { clubId: '47',  leagueId: '31', from: 2014, to: 2015, label: 'Milan' },
      { clubId: '240', leagueId: '53', from: 2015, to: 2018, label: 'Atlético' },
    ],
  },
  {
    id: 'p7',
    name: 'Didier Drogba',
    nationality: 'Ivorian',
    position: 'ST',
    born: 1978,
    clubId: '5',
    career: [
      { clubId: '210', leagueId: '16', from: 1999, to: 2002, label: 'Caen' },
      { clubId: '65',  leagueId: '16', from: 2002, to: 2003, label: 'Guingamp' },
      { clubId: '219', leagueId: '16', from: 2003, to: 2004, label: 'Marseille' },
      { clubId: '5',   leagueId: '13', from: 2004, to: 2012, label: 'Chelsea' },
      { clubId: '325', leagueId: '68', from: 2012, to: 2013, label: 'Galatasaray' },
      { clubId: '5',   leagueId: '13', from: 2014, to: 2015, label: 'Chelsea' },
    ],
  },
  {
    id: 'p8',
    name: 'Andrés Iniesta',
    nationality: 'Spanish',
    position: 'CM',
    born: 1984,
    clubId: '241',
    career: [
      { clubId: '241', leagueId: '53', from: 2002, to: 2018, label: 'Barcelona' },
      { clubId: '110955', leagueId: '189', from: 2018, to: 2023, label: 'Vissel Kobe' },
      { clubId: '327', leagueId: '68', from: 2023, to: 2024, label: 'Emirates' },
    ],
  },
  {
    id: 'p9',
    name: 'Wayne Rooney',
    nationality: 'English',
    position: 'ST',
    born: 1985,
    clubId: '11',
    career: [
      { clubId: '7',   leagueId: '13', from: 2002, to: 2004, label: 'Everton' },
      { clubId: '11',  leagueId: '13', from: 2004, to: 2017, label: 'Man United' },
      { clubId: '7',   leagueId: '13', from: 2017, to: 2018, label: 'Everton' },
      { clubId: '688', leagueId: '39', from: 2018, to: 2019, label: 'DC United' },
      { clubId: '91',  leagueId: '14', from: 2019, to: 2020, label: 'Derby County' },
    ],
  },
  {
    id: 'p10',
    name: 'Luka Modrić',
    nationality: 'Croatian',
    position: 'CM',
    born: 1985,
    clubId: '243',
    career: [
      { clubId: '211', leagueId: '317', from: 2003, to: 2008, label: 'Dinamo Zagreb' },
      { clubId: '18',  leagueId: '13', from: 2008, to: 2012, label: 'Spurs' },
      { clubId: '243', leagueId: '53', from: 2012, to: 2024, label: 'Real Madrid' },
    ],
  },
  {
    id: 'p11',
    name: 'Raheem Sterling',
    nationality: 'English',
    position: 'LW',
    born: 1994,
    clubId: '5',
    career: [
      { clubId: '9',   leagueId: '13', from: 2012, to: 2015, label: 'Liverpool' },
      { clubId: '10',  leagueId: '13', from: 2015, to: 2022, label: 'Man City' },
      { clubId: '5',   leagueId: '13', from: 2022, to: 2024, label: 'Chelsea' },
      { clubId: '1',   leagueId: '13', from: 2024, to: 2025, label: 'Arsenal' },
    ],
  },
  {
    id: 'p12',
    name: 'Roberto Carlos',
    nationality: 'Brazilian',
    position: 'LB',
    born: 1973,
    clubId: '243',
    career: [
      { clubId: '568', leagueId: '53', from: 1991, to: 1992, label: 'União São João' },
      { clubId: '48',  leagueId: '31', from: 1995, to: 1996, label: 'Inter Milan' },
      { clubId: '243', leagueId: '53', from: 1996, to: 2007, label: 'Real Madrid' },
      { clubId: '325', leagueId: '68', from: 2007, to: 2008, label: 'Fenerbahçe' },
      { clubId: '383', leagueId: '53', from: 2010, to: 2011, label: 'Palmeiras' },
    ],
  },
  {
    id: 'p13',
    name: 'Paul Scholes',
    nationality: 'English',
    position: 'CM',
    born: 1974,
    clubId: '11',
    career: [
      { clubId: '11', leagueId: '13', from: 1993, to: 2011, label: 'Man United' },
      { clubId: '11', leagueId: '13', from: 2012, to: 2013, label: 'Man United' },
    ],
  },
  {
    id: 'p14',
    name: 'Xabi Alonso',
    nationality: 'Spanish',
    position: 'CM',
    born: 1981,
    clubId: '243',
    career: [
      { clubId: '457', leagueId: '53', from: 1999, to: 2004, label: 'Real Sociedad' },
      { clubId: '9',   leagueId: '13', from: 2004, to: 2009, label: 'Liverpool' },
      { clubId: '243', leagueId: '53', from: 2009, to: 2014, label: 'Real Madrid' },
      { clubId: '32',  leagueId: '19', from: 2014, to: 2017, label: 'Leverkusen' },
    ],
  },
  {
    id: 'p15',
    name: 'Samuel Eto\'o',
    nationality: 'Cameroonian',
    position: 'ST',
    born: 1981,
    clubId: '241',
    career: [
      { clubId: '243', leagueId: '53', from: 1997, to: 2000, label: 'Real Madrid' },
      { clubId: '241', leagueId: '53', from: 2004, to: 2009, label: 'Barcelona' },
      { clubId: '48',  leagueId: '31', from: 2009, to: 2011, label: 'Inter Milan' },
      { clubId: '1842',leagueId: '31', from: 2011, to: 2012, label: 'Anzhi' },
      { clubId: '5',   leagueId: '13', from: 2013, to: 2014, label: 'Chelsea' },
    ],
  },
];

/* ── Modes ───────────────────────────────────────────────── */
const MODES = {
  all:    () => true,
  pl:     p => p.career.some(c => c.leagueId === '13'),
  laliga: p => p.career.some(c => c.leagueId === '53'),
};

/* ── Hint config — unlocked after N wrong guesses ─────────── */
const HINTS = [
  { key: 'nationality', label: 'Nationality', unlockAfter: 2,  getValue: p => p.nationality },
  { key: 'position',    label: 'Position',    unlockAfter: 4,  getValue: p => p.position    },
  { key: 'born',        label: 'Born',        unlockAfter: 6,  getValue: p => String(p.born) },
];

/* ── State ───────────────────────────────────────────────── */
let currentPlayer   = null;
let revealedCount   = 1;     // how many career rows are visible
let wrongGuesses    = [];
let gameOver        = false;
let currentMode     = 'all';
let score           = 0;
let streak          = 0;
let usedIds         = new Set();
let acHighlight     = -1;

/* ── DOM ─────────────────────────────────────────────────── */
const careerList   = document.getElementById('career-list');
const clueCounter  = document.getElementById('clue-counter');
const revealBtn    = document.getElementById('reveal-btn');
const hintRow      = document.getElementById('hint-row');
const playerInput  = document.getElementById('player-input');
const submitBtn    = document.getElementById('submit-btn');
const acDrop       = document.getElementById('autocomplete-drop');
const wrongList    = document.getElementById('wrong-list');
const resultPanel  = document.getElementById('result-panel');
const resultEmoji  = document.getElementById('result-emoji');
const resultBadge  = document.getElementById('result-badge');
const resultHead   = document.getElementById('result-heading');
const resultSub    = document.getElementById('result-sub');
const nextBtn      = document.getElementById('next-btn');
const scoreEl      = document.getElementById('score-display');
const streakEl     = document.getElementById('streak-display');
const newGameBtn   = document.getElementById('new-game-btn');

/* ── Load & save score ───────────────────────────────────── */
function loadScore() {
  try {
    score  = parseInt(localStorage.getItem('gtp_score')  || '0');
    streak = parseInt(localStorage.getItem('gtp_streak') || '0');
  } catch(e) {}
}
function saveScore() {
  try {
    localStorage.setItem('gtp_score',  String(score));
    localStorage.setItem('gtp_streak', String(streak));
  } catch(e) {}
}

/* ── Pick a random player for current mode ───────────────── */
function pickPlayer() {
  const pool = PLAYER_DB.filter(p => MODES[currentMode](p));
  if (!pool.length) return null;

  // avoid repeats until pool exhausted
  let available = pool.filter(p => !usedIds.has(p.id));
  if (!available.length) {
    usedIds.clear();
    available = pool;
  }

  const pick = available[Math.floor(Math.random() * available.length)];
  usedIds.add(pick.id);
  return pick;
}

/* ── Start new game ──────────────────────────────────────── */
function startGame() {
  currentPlayer = pickPlayer();
  if (!currentPlayer) {
    careerList.innerHTML = '<p style="padding:16px;font-family:\'Roboto Condensed\',sans-serif;color:#787878;font-size:13px;">No players in this mode yet.</p>';
    return;
  }

  revealedCount = 1;
  wrongGuesses  = [];
  gameOver      = false;

  playerInput.disabled = false;
  submitBtn.disabled   = false;
  playerInput.value    = '';
  acDrop.classList.remove('open');
  acDrop.innerHTML     = '';
  wrongList.innerHTML  = '';
  resultPanel.classList.remove('show');

  renderCareer();
  renderHints();
  updateScore();
  playerInput.focus();
}

/* ── Render career rows ──────────────────────────────────── */
function renderCareer() {
  careerList.innerHTML = '';

  // Show career oldest first; most recent club hidden last
  const ordered = [...currentPlayer.career].reverse();
  const total   = ordered.length;

  ordered.forEach((stint, idx) => {
    const visible = idx < revealedCount;
    const row     = document.createElement('div');
    row.className = 'career-row' + (idx === revealedCount - 1 ? ' just-revealed' : '');

    const years = document.createElement('div');
    years.className   = 'career-years';
    years.textContent = visible ? `${stint.from}–${stint.to === 9999 ? 'now' : stint.to}` : '—';

    let badgeEl;
    if (visible) {
      badgeEl       = document.createElement('img');
      badgeEl.className = 'career-badge';
      badgeEl.src   = clubBadge(stint.clubId);
      badgeEl.alt   = stint.label;
      badgeEl.onerror = () => { badgeEl.style.opacity = '0.1'; };
    } else {
      badgeEl           = document.createElement('span');
      badgeEl.className = 'career-badge-hidden';
    }

    const club = document.createElement('div');
    if (visible) {
      club.className   = 'career-club';
      club.textContent = stint.label;
    } else {
      club.className = 'career-club-hidden';
    }

    let leagueEl;
    if (visible && stint.leagueId) {
      leagueEl       = document.createElement('img');
      leagueEl.className = 'career-league-badge';
      leagueEl.src   = leagueBadge(stint.leagueId);
      leagueEl.alt   = '';
      leagueEl.onerror = () => { leagueEl.style.display = 'none'; };
    } else {
      leagueEl       = document.createElement('span');
      leagueEl.className = 'career-league';
      leagueEl.textContent = '';
    }

    row.appendChild(years);
    row.appendChild(badgeEl);
    row.appendChild(club);
    row.appendChild(leagueEl);
    careerList.appendChild(row);
  });

  // Update counter & reveal button
  clueCounter.textContent = `${revealedCount} / ${total} clubs`;

  revealBtn.textContent = revealedCount >= total
    ? 'All clubs revealed'
    : `Reveal next club ↓ (${total - revealedCount} remaining)`;
  revealBtn.disabled = (revealedCount >= total) || gameOver;
}

/* ── Render hint pills ───────────────────────────────────── */
function renderHints() {
  hintRow.innerHTML = '';
  HINTS.forEach(hint => {
    const unlocked = wrongGuesses.length >= hint.unlockAfter || gameOver;
    const pill     = document.createElement('div');
    pill.className = 'hint-pill' + (unlocked ? ' revealed' : '');

    const dot = document.createElement('span');
    dot.className = 'hint-dot';
    pill.appendChild(dot);

    const txt = document.createElement('span');
    txt.textContent = unlocked
      ? `${hint.label}: ${hint.getValue(currentPlayer)}`
      : `${hint.label} — ${hint.unlockAfter - wrongGuesses.length} wrong to unlock`;
    pill.appendChild(txt);
    hintRow.appendChild(pill);
  });
}

/* ── Autocomplete ─────────────────────────────────────────── */
function getPool() {
  return PLAYER_DB.filter(p => MODES[currentMode](p));
}

function renderAutocomplete(q) {
  acDrop.innerHTML = '';
  acHighlight = -1;
  if (!q || q.length < 1) { acDrop.classList.remove('open'); return; }

  const qn   = norm(q);
  const pool = getPool()
    .filter(p => norm(p.name).includes(qn) && !wrongGuesses.includes(p.name))
    .slice(0, 8);

  if (!pool.length) { acDrop.classList.remove('open'); return; }

  pool.forEach(p => {
    const item = document.createElement('div');
    item.className = 'ac-item';

    const img = document.createElement('img');
    img.className = 'ac-badge';
    img.src = clubBadge(p.career[0].clubId);
    img.onerror = () => { img.style.opacity = '0.1'; };
    item.appendChild(img);

    const nameEl   = document.createElement('span');
    const nameNorm = norm(p.name);
    const idx      = nameNorm.indexOf(qn);
    if (idx === -1) {
      nameEl.textContent = p.name;
    } else {
      nameEl.innerHTML =
        p.name.slice(0, idx) +
        '<em>' + p.name.slice(idx, idx + q.length) + '</em>' +
        p.name.slice(idx + q.length);
    }
    item.appendChild(nameEl);

    item.addEventListener('mousedown', e => {
      e.preventDefault();
      playerInput.value = p.name;
      acDrop.classList.remove('open');
      submitGuess(p.name);
    });

    acDrop.appendChild(item);
  });

  acDrop.classList.add('open');
}

/* ── Submit guess ─────────────────────────────────────────── */
function submitGuess(raw) {
  const guess = (raw || playerInput.value).trim();
  if (!guess || gameOver) return;

  const guessNorm   = norm(guess);
  const correctNorm = norm(currentPlayer.name);

  if (guessNorm === correctNorm) {
    // CORRECT
    endGame(true);
  } else {
    // WRONG
    if (wrongGuesses.map(norm).includes(guessNorm)) {
      playerInput.value = '';
      return; // duplicate
    }
    wrongGuesses.push(guess);
    playerInput.value = '';
    acDrop.classList.remove('open');

    // Auto-reveal next club on wrong guess
    const total = currentPlayer.career.length;
    if (revealedCount < total) {
      revealedCount++;
    }

    // Check if out of guesses (can allow unlimited but cap at 8)
    if (wrongGuesses.length >= 8) {
      endGame(false);
    } else {
      renderCareer();
      renderHints();
      renderWrongList();
    }
  }
}

function renderWrongList() {
  wrongList.innerHTML = '';
  wrongGuesses.forEach(g => {
    const tag       = document.createElement('div');
    tag.className   = 'wrong-tag';
    tag.textContent = g;
    wrongList.appendChild(tag);
  });
}

/* ── End game ─────────────────────────────────────────────── */
function endGame(won) {
  gameOver = true;
  playerInput.disabled = true;
  submitBtn.disabled   = true;
  revealBtn.disabled   = true;
  revealedCount = currentPlayer.career.length; // reveal all
  renderCareer();
  renderHints();
  acDrop.classList.remove('open');

  if (won) {
    score  += Math.max(1, 8 - wrongGuesses.length); // more points for fewer guesses
    streak += 1;
    resultEmoji.textContent = streak >= 3 ? '🔥' : '✅';
    resultHead.textContent  = 'Correct!';
    resultSub.innerHTML     =
      `<strong>${currentPlayer.name}</strong> — ${currentPlayer.nationality} ${currentPlayer.position}, born ${currentPlayer.born}.<br>` +
      `${wrongGuesses.length === 0 ? 'First guess!' : `Guessed in ${wrongGuesses.length + 1} attempt${wrongGuesses.length === 0 ? '' : 's'}.`}`;
  } else {
    streak = 0;
    resultEmoji.textContent = '❌';
    resultHead.textContent  = 'Unlucky!';
    resultSub.innerHTML     =
      `The answer was <strong>${currentPlayer.name}</strong> — ${currentPlayer.nationality} ${currentPlayer.position}, born ${currentPlayer.born}.`;
  }

  // Player badge (most recent club)
  const clubForFace = currentPlayer.career[0].clubId;
  resultBadge.src   = clubBadge(clubForFace);
  resultBadge.onerror = () => { resultBadge.style.display = 'none'; };

  saveScore();
  updateScore();
  resultPanel.classList.add('show');
  resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function updateScore() {
  scoreEl.textContent  = String(score);
  streakEl.textContent = streak > 0 ? `${streak}🔥` : '0';
}

/* ── Event listeners ──────────────────────────────────────── */
revealBtn.addEventListener('click', () => {
  if (gameOver) return;
  const total = currentPlayer.career.length;
  if (revealedCount < total) {
    revealedCount++;
    renderCareer();
  }
});

submitBtn.addEventListener('click', () => submitGuess());

playerInput.addEventListener('input',  () => renderAutocomplete(playerInput.value));
playerInput.addEventListener('keydown', e => {
  const items = acDrop.querySelectorAll('.ac-item');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    acHighlight = Math.min(acHighlight + 1, items.length - 1);
    items.forEach((el, i) => el.classList.toggle('highlighted', i === acHighlight));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    acHighlight = Math.max(acHighlight - 1, -1);
    items.forEach((el, i) => el.classList.toggle('highlighted', i === acHighlight));
  } else if (e.key === 'Enter') {
    if (acHighlight >= 0 && items[acHighlight]) {
      playerInput.value = items[acHighlight].querySelector('span').textContent;
      acDrop.classList.remove('open');
    }
    submitGuess();
  } else if (e.key === 'Escape') {
    acDrop.classList.remove('open');
  }
});

document.addEventListener('click', e => {
  if (!e.target.closest('#input-area')) acDrop.classList.remove('open');
});

nextBtn.addEventListener('click', startGame);
newGameBtn.addEventListener('click', () => {
  if (gameOver || confirm('Start a new player mid-round?')) startGame();
});

document.querySelectorAll('.gtp-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentMode = btn.dataset.mode;
    document.querySelectorAll('.gtp-mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    usedIds.clear();
    startGame();
  });
});

/* ── Init ─────────────────────────────────────────────────── */
loadScore();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startGame);
} else {
  startGame();
}