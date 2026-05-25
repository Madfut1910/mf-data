// ============================================================
//  predictor.js — /js/predictor.js  (ES Module)
// ============================================================

import { clubIdToName, nationIdToName } from './Mappings.js';

/* ── helpers ─────────────────────────────────────────────── */
function clubName(id) {
  if (!id) return '';
  return clubIdToName[String(id)] || ('Club #' + id);
}
function nationName(id) {
  if (!id) return '';
  return nationIdToName[String(id)] || ('Nation #' + id);
}
function clubBadge(id) {
  return 'https://mf-data.b-cdn.net/26/Badges/Clubs/Large/club_large_' + id + '.png';
}
function nationBadge(id) {
  return 'https://mf-data.b-cdn.net/26/Badges/Achievements/Nations/nation_badge_' + id + '.png';
}
function leagueBadge(id) {
  return 'https://mf-data.b-cdn.net/26/Badges/Leagues/Large/league_large_' + id + '.png';
}

/* ── localStorage ────────────────────────────────────────── */
const STORAGE_PREFIX  = 'pred_26_27_';
const LAST_LEAGUE_KEY = 'pred_26_27_last_league';

function saveState(lg) {
  if (lg.type === 'worldcup') { saveWCState(); return; }
  try {
    const tableData = table.map(r => r.clubId || null);
    localStorage.setItem(STORAGE_PREFIX + lg.leagueId + '_table',   JSON.stringify(tableData));
    localStorage.setItem(STORAGE_PREFIX + lg.leagueId + '_bracket', JSON.stringify(bracketState));
    localStorage.setItem(STORAGE_PREFIX + lg.leagueId + '_rivalry', JSON.stringify(rivalryDecisions));
  } catch (e) {}
}

function loadState(lg) {
  try {
    const rawTable   = localStorage.getItem(STORAGE_PREFIX + lg.leagueId + '_table');
    const rawBracket = localStorage.getItem(STORAGE_PREFIX + lg.leagueId + '_bracket');
    const rawRivalry = localStorage.getItem(STORAGE_PREFIX + lg.leagueId + '_rivalry');
    return {
      tableData:   rawTable   ? JSON.parse(rawTable)   : null,
      bracketData: rawBracket ? JSON.parse(rawBracket) : null,
      rivalryData: rawRivalry ? JSON.parse(rawRivalry) : null,
    };
  } catch (e) { return { tableData: null, bracketData: null, rivalryData: null }; }
}

function clearState(lg) {
  if (lg.type === 'worldcup') { clearWCState(); return; }
  try {
    localStorage.removeItem(STORAGE_PREFIX + lg.leagueId + '_table');
    localStorage.removeItem(STORAGE_PREFIX + lg.leagueId + '_bracket');
    localStorage.removeItem(STORAGE_PREFIX + lg.leagueId + '_rivalry');
  } catch (e) {}
}

/* ── WC state ────────────────────────────────────────────── */
let wcGroups   = {};
let wcThirds   = [];
let wcKnockout = {};

function saveWCState() {
  try {
    localStorage.setItem('wc2026_groups',   JSON.stringify(wcGroups));
    localStorage.setItem('wc2026_thirds',   JSON.stringify(wcThirds));
    localStorage.setItem('wc2026_knockout', JSON.stringify(wcKnockout));
  } catch (e) {}
}

function loadWCState() {
  try {
    const g = localStorage.getItem('wc2026_groups');
    const t = localStorage.getItem('wc2026_thirds');
    const k = localStorage.getItem('wc2026_knockout');
    wcGroups   = g ? JSON.parse(g) : {};
    wcThirds   = t ? JSON.parse(t) : [];
    wcKnockout = k ? JSON.parse(k) : {};
  } catch (e) { wcGroups = {}; wcThirds = []; wcKnockout = {}; }
}

function clearWCState() {
  try {
    localStorage.removeItem('wc2026_groups');
    localStorage.removeItem('wc2026_thirds');
    localStorage.removeItem('wc2026_knockout');
  } catch (e) {}
  wcGroups = {}; wcThirds = []; wcKnockout = {};
}

/* ── state ───────────────────────────────────────────────── */
let activeLeague     = null;
let activeTab        = 'table';
let table            = [];
let bracketState     = {};
let rivalryDecisions = {};
let pickerContext    = null;

/* ── rivalry helpers ─────────────────────────────────────── */
function getRivalries(lg) {
  return (lg && lg.rivalries) ? lg.rivalries : [];
}

function allRivalriesResolved(lg) {
  const rivalries = getRivalries(lg);
  if (!rivalries.length) return true;
  return rivalries.every((_, i) => !!rivalryDecisions[i]);
}

function getRejectedClubIds(lg) {
  const rejected = new Set();
  getRivalries(lg).forEach((rv, i) => {
    const chosen = rivalryDecisions[i];
    if (!chosen) return;
    if (rv.invertResult) {
      rejected.add(String(chosen));
    } else {
      const loser = String(rv.a.clubId) === String(chosen)
        ? String(rv.b.clubId)
        : String(rv.a.clubId);
      rejected.add(loser);
    }
  });
  return rejected;
}

/* ── DOM refs ────────────────────────────────────────────── */
const leagueTabs   = document.getElementById('league-tabs');
const resetBtn     = document.getElementById('reset-btn');
const tabBar       = document.getElementById('tab-bar');
const tablePane    = document.getElementById('pane-table');
const unknownPane  = document.getElementById('pane-unconfirmed');
const bracketPane  = document.getElementById('pane-playoffs');
const tableWrap    = document.getElementById('table-wrap');
const unknownWrap  = document.getElementById('unknown-wrap');
const bracketWrap  = document.getElementById('bracket-wrap');
const pickerModal  = document.getElementById('picker-modal');
const pickerList   = document.getElementById('picker-list');
const pickerSearch = document.getElementById('picker-search');

/* ── WC panes (injected once) ────────────────────────────── */
let wcGroupsPane   = null;
let wcThirdsPane   = null;
let wcKnockoutPane = null;

function ensureWCPanes() {
  const root = document.getElementById('predictor-root');
  if (!wcGroupsPane) {
    wcGroupsPane = document.createElement('div');
    wcGroupsPane.id = 'pane-wc-groups';
    wcGroupsPane.className = 'pred-pane';
    wcGroupsPane.style.display = 'none';
    wcGroupsPane.innerHTML = '<div id="wc-groups-wrap"></div>';
    root.appendChild(wcGroupsPane);
  }
  if (!wcThirdsPane) {
    wcThirdsPane = document.createElement('div');
    wcThirdsPane.id = 'pane-wc-thirds';
    wcThirdsPane.className = 'pred-pane';
    wcThirdsPane.style.display = 'none';
    wcThirdsPane.innerHTML = '<div id="wc-thirds-wrap"></div>';
    root.appendChild(wcThirdsPane);
  }
  if (!wcKnockoutPane) {
    wcKnockoutPane = document.createElement('div');
    wcKnockoutPane.id = 'pane-wc-knockout';
    wcKnockoutPane.className = 'pred-pane';
    wcKnockoutPane.style.display = 'none';
    wcKnockoutPane.innerHTML = '<div id="wc-knockout-wrap"></div>';
    root.appendChild(wcKnockoutPane);
  }
}

/* ── init ────────────────────────────────────────────────── */
function init() {
  const leagues  = window.leagues || [];
  const wcConfig = window.worldCup2026 || null;
  const allItems = [...leagues];
  if (wcConfig) allItems.unshift(wcConfig);

  if (!allItems.length) {
    tableWrap.innerHTML = '<p style="font-family:\'Roboto Condensed\',sans-serif;color:#787878;font-size:13px;padding:12px 0;">No leagues configured.</p>';
    return;
  }

  ensureWCPanes();
  buildLeagueTabs(allItems);

  resetBtn.addEventListener('click', () => {
    if (!activeLeague) return;
    if (!confirm('Reset all predictions for this league?')) return;
    clearState(activeLeague);
    loadLeague(activeLeague);
  });

  pickerModal.addEventListener('click', e => {
    if (e.target === pickerModal) closePicker();
  });
  pickerSearch.addEventListener('input', () => renderPickerList(pickerSearch.value));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePicker(); });

  const lastId = localStorage.getItem(LAST_LEAGUE_KEY);
  let startLeague = allItems[0];
  if (lastId) {
    const found = allItems.find(l => String(l.leagueId || l.id) === lastId);
    if (found) startLeague = found;
  }
  loadLeague(startLeague);
}

/* ── league card strip ───────────────────────────────────── */
function buildLeagueTabs(items) {
  leagueTabs.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('button');
    card.className  = 'pred-league-card';
    card.dataset.id = String(item.leagueId || item.id);
    const badgeSrc  = item.type === 'worldcup'
      ? 'https://mf-data.b-cdn.net/web/wc2026.png'
      : leagueBadge(item.leagueId);
    card.innerHTML =
      `<img class="pred-league-badge" src="${badgeSrc}" alt="${item.name}" onerror="this.style.opacity=0.15">` +
      `<span class="pred-league-name">${item.name}</span>`;
    card.addEventListener('click', () => loadLeague(item));
    leagueTabs.appendChild(card);
  });
}

/* ── load league ─────────────────────────────────────────── */
function loadLeague(lg) {
  activeLeague     = lg;
  bracketState     = {};
  rivalryDecisions = {};

  const id = String(lg.leagueId || lg.id);
  localStorage.setItem(LAST_LEAGUE_KEY, id);

  document.querySelectorAll('.pred-league-card').forEach(b => {
    const isActive = b.dataset.id === id;
    b.classList.toggle('active', isActive);
    b.style.opacity = isActive ? '1' : '0.4';
  });

  tablePane.style.display   = 'none';
  unknownPane.style.display = 'none';
  bracketPane.style.display = 'none';
  if (wcGroupsPane)   wcGroupsPane.style.display   = 'none';
  if (wcThirdsPane)   wcThirdsPane.style.display   = 'none';
  if (wcKnockoutPane) wcKnockoutPane.style.display = 'none';

  if (lg.type === 'worldcup') {
    loadWCState();
    if (!wcGroupsComplete())       wcActiveTab = 'groups';
    else if (!wcThirdsComplete())  wcActiveTab = 'thirds';
    else                           wcActiveTab = 'knockout';
    buildWCTabBar(lg);
    return;
  }

  table = [];
  for (let i = 0; i < lg.positions; i++) table.push({ pos: i + 1, clubId: null });

  const saved = loadState(lg);
  if (saved.rivalryData) rivalryDecisions = saved.rivalryData;
  if (saved.tableData && saved.tableData.length === lg.positions) {
    saved.tableData.forEach((cid, i) => { table[i].clubId = cid || null; });
  } else if (lg.confirmed && lg.confirmed.length) {
    lg.confirmed.forEach(c => {
      const idx = c.pos - 1;
      if (idx >= 0 && idx < lg.positions) table[idx].clubId = String(c.clubId);
    });
  }
  if (saved.bracketData) bracketState = saved.bracketData;

  buildTabBar(lg);
  renderTable();
  renderUnknownPanel();
  renderBracket();
}

/* ════════════════════════════════════════════════════════════
   WORLD CUP
   ════════════════════════════════════════════════════════════ */

let wcActiveTab = 'groups';

const WC_THIRDS_NEEDED = 8;

function wcGroupsComplete() {
  if (!window.worldCup2026) return false;
  return window.worldCup2026.groups.every(g => {
    const order = wcGroups[g.id];
    return order && order.filter(Boolean).length === 4;
  });
}

function wcThirdsComplete() {
  return wcThirds.length === WC_THIRDS_NEEDED;
}

function refreshWCTabLocks(autoAdvance) {
  const groupsDone = wcGroupsComplete();
  const thirdsDone = wcThirdsComplete();

  tabBar.querySelectorAll('.pred-tab').forEach(btn => {
    const id = btn.dataset.tab;
    const locked = (id === 'thirds' && !groupsDone) || (id === 'knockout' && (!groupsDone || !thirdsDone));
    btn.disabled = locked;
    btn.classList.toggle('pred-tab--locked', locked);
    btn.classList.toggle('pred-tab--active', id === wcActiveTab);
  });

  if (autoAdvance) {
    if (groupsDone && thirdsDone && wcActiveTab !== 'knockout') {
      switchWCTab('knockout');
    } else if (groupsDone && !thirdsDone && wcActiveTab === 'groups') {
      switchWCTab('thirds');
    }
  }
}

/* FIX 2: switchWCTab does a live lock check so stale captured `t.locked`
   in the click handler can never bypass the guard. */
function switchWCTab(id) {
  const groupsDone = wcGroupsComplete();
  const thirdsDone = wcThirdsComplete();
  if (id === 'thirds'   && !groupsDone) return;
  if (id === 'knockout' && (!groupsDone || !thirdsDone)) return;

  wcActiveTab = id;
  tabBar.querySelectorAll('.pred-tab').forEach(b =>
    b.classList.toggle('pred-tab--active', b.dataset.tab === id)
  );
  applyWCPaneVisibility();
  if (id === 'groups')   renderWCGroups();
  if (id === 'thirds')   renderWCThirds();
  if (id === 'knockout') renderWCKnockout();
}

function applyWCPaneVisibility() {
  if (wcGroupsPane)   wcGroupsPane.style.display   = wcActiveTab === 'groups'   ? '' : 'none';
  if (wcThirdsPane)   wcThirdsPane.style.display   = wcActiveTab === 'thirds'   ? '' : 'none';
  if (wcKnockoutPane) wcKnockoutPane.style.display = wcActiveTab === 'knockout' ? '' : 'none';
}

function buildWCTabBar(lg) {
  tabBar.innerHTML = '';
  const groupsDone = wcGroupsComplete();
  const thirdsDone = wcThirdsComplete();

  const tabs = [
    { id: 'groups',   label: 'Groups',    locked: false },
    { id: 'thirds',   label: 'Best 3rd',  locked: !groupsDone },
    { id: 'knockout', label: 'Knockouts', locked: !groupsDone || !thirdsDone },
  ];

  tabs.forEach(t => {
    const btn = document.createElement('button');
    btn.className   = 'pred-tab' +
      (wcActiveTab === t.id ? ' pred-tab--active' : '') +
      (t.locked ? ' pred-tab--locked' : '');
    btn.dataset.tab = t.id;
    btn.disabled    = t.locked;
    btn.textContent = t.label;
    // Read dataset.tab at click time so lock state is always live
    btn.addEventListener('click', () => switchWCTab(btn.dataset.tab));
    tabBar.appendChild(btn);
  });

  applyWCPaneVisibility();
  if (wcActiveTab === 'groups')   renderWCGroups();
  if (wcActiveTab === 'thirds')   renderWCThirds();
  if (wcActiveTab === 'knockout') renderWCKnockout();
}

/* ── WC groups ───────────────────────────────────────────── */
function renderWCGroups() {
  const wrap = document.getElementById('wc-groups-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';

  const wc   = window.worldCup2026;
  const grid = document.createElement('div');
  grid.className = 'wc-groups-grid';
  wrap.appendChild(grid);

  wc.groups.forEach(g => {
    const order = wcGroups[g.id] ? [...wcGroups[g.id]] : [];
    while (order.length < 4) order.push(null);

    const section = document.createElement('div');
    section.className = 'wc-group-section';

    const hdr = document.createElement('div');
    hdr.className = 'wc-group-header';
    hdr.innerHTML =
      `<span class="wc-group-title">Group ${g.id}</span>` +
      `<span class="wc-group-count">${order.filter(Boolean).length}/4</span>`;
    section.appendChild(hdr);

    order.forEach((nid, pos) => {
      const zoneClass = ['wc-row--first','wc-row--second','wc-row--third','wc-row--fourth'][pos];
      const row = document.createElement('div');
      row.className = 'wc-group-row ' + zoneClass;

      if (nid) {
        row.innerHTML =
          `<span class="wc-pos">${pos + 1}</span>` +
          `<img class="wc-badge" src="${nationBadge(nid)}" alt="${nationName(nid)}" onerror="this.style.opacity=0.1">` +
          `<span class="wc-name">${nationName(nid)}</span>` +
          `<button class="pred-clear" title="Clear">✕</button>`;
        row.querySelector('.pred-clear').addEventListener('click', e => {
          e.stopPropagation();
          wcGroups[g.id][pos] = null;
          if (pos === 2) wcThirds = wcThirds.filter(id => id !== nid);
          wcKnockout = {};
          saveWCState();
          refreshWCTabLocks(false);
          renderWCGroups();
        });
      } else {
        row.innerHTML =
          `<span class="wc-pos">${pos + 1}</span>` +
          `<span class="pred-empty-badge"></span>` +
          `<span class="pred-placeholder">Pick a nation…</span>`;
      }

      row.addEventListener('click', e => {
        if (e.target.classList.contains('pred-clear')) return;
        openWCGroupPicker(g, pos);
      });
      section.appendChild(row);
    });

    grid.appendChild(section);
  });

  const leg = document.createElement('div');
  leg.className = 'pred-legend';
  leg.innerHTML =
    '<span class="leg wc-leg-first">■ Advances (1st)</span>' +
    '<span class="leg wc-leg-second">■ Advances (2nd)</span>' +
    '<span class="leg wc-leg-third">■ Best 3rd (decide next)</span>' +
    '<span class="leg wc-leg-fourth">■ Eliminated</span>';
  wrap.appendChild(leg);
}

/* ── WC best 3rd ─────────────────────────────────────────── */
function renderWCThirds() {
  const wrap = document.getElementById('wc-thirds-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';

  const wc = window.worldCup2026;
  const allThirds = wc.groups.map(g => {
    const order = wcGroups[g.id] || [];
    return { groupId: g.id, nationId: order[2] || null };
  }).filter(t => t.nationId);

  const note = document.createElement('p');
  note.className = 'unk-subtitle';
  note.textContent = `Select the ${WC_THIRDS_NEEDED} best third-placed teams that advance to the Round of 32. (${wcThirds.length}/${WC_THIRDS_NEEDED} selected)`;
  wrap.appendChild(note);

  const grid = document.createElement('div');
  grid.className = 'wc-thirds-grid';

  allThirds.forEach(({ groupId, nationId }) => {
    const isChosen = wcThirds.includes(nationId);
    const isMaxed  = wcThirds.length >= WC_THIRDS_NEEDED && !isChosen;

    const card = document.createElement('button');
    card.className = 'rv-card' +
      (isChosen ? ' rv-card--chosen'   : '') +
      (isMaxed  ? ' rv-card--rejected' : '');
    card.innerHTML =
      `<img class="rv-badge" src="${nationBadge(nationId)}" alt="${nationName(nationId)}" onerror="this.style.opacity=0.15">` +
      `<div class="rv-info">` +
        `<span class="rv-name">${nationName(nationId)}</span>` +
        `<span class="rv-note">Group ${groupId} — 3rd place</span>` +
      `</div>` +
      (isChosen ? `<span class="rv-tick">✓</span>` : '');

    card.addEventListener('click', () => {
      if (isChosen) {
        wcThirds = wcThirds.filter(id => id !== nationId);
        wcKnockout = {};
      } else if (wcThirds.length < WC_THIRDS_NEEDED) {
        wcThirds.push(nationId);
        wcKnockout = {};
      }
      saveWCState();
      refreshWCTabLocks(true);
      renderWCThirds();
    });

    grid.appendChild(card);
  });

  wrap.appendChild(grid);
}

/* ── WC knockout bracket ─────────────────────────────────── */
/*
  2026 WC Round of 32 — 16 matches following the official bracket:

  FIXED pairs (runner-up vs runner-up or winner vs runner-up):
    r32_0:  A2 vs B2
    r32_1:  E2 vs I2
    r32_2:  C1 vs F2
    r32_3:  F1 vs C2
    r32_4:  H1 vs J2
    r32_5:  K2 vs L2
    r32_15: D2 vs G2

  WINNER vs 3RD PLACE (user picks which advancing 3rd from eligible pool):
    r32_6:  A1 vs 3rd from (C/E/F/H/I)
    r32_7:  B1 vs 3rd from (E/F/G/I/J)
    r32_8:  D1 vs 3rd from (B/E/F/I/J)
    r32_9:  E1 vs 3rd from (A/B/C/D/F)
    r32_10: G1 vs 3rd from (A/E/H/I/J)
    r32_11: I1 vs 3rd from (C/D/F/G/H)
    r32_12: J1 vs 3rd from (B/C/F/G/I)
    r32_13: K1 vs 3rd from (B/C/G/H/I)
    r32_14: L1 vs 3rd from (E/H/I/J/K)

  R16 pairs (by adjacent R32 match index):
    r16_0: W(r32_0)  vs W(r32_1)
    r16_1: W(r32_2)  vs W(r32_3)
    r16_2: W(r32_4)  vs W(r32_5)
    r16_3: W(r32_6)  vs W(r32_7)
    r16_4: W(r32_8)  vs W(r32_9)
    r16_5: W(r32_10) vs W(r32_11)
    r16_6: W(r32_12) vs W(r32_13)
    r16_7: W(r32_14) vs W(r32_15)
*/

// Eligible groups for each Winner-vs-3rd slot
const WC_THIRD_POOLS = {
  r32_6:  ['C','E','F','H','I'],
  r32_7:  ['E','F','G','I','J'],
  r32_8:  ['B','E','F','I','J'],
  r32_9:  ['A','B','C','D','F'],
  r32_10: ['A','E','H','I','J'],
  r32_11: ['C','D','F','G','H'],
  r32_12: ['B','C','F','G','I'],
  r32_13: ['B','C','G','H','I'],
  r32_14: ['E','H','I','J','K'],
};

function renderWCKnockout() {
  const wrap = document.getElementById('wc-knockout-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';

  function gFirst(gid)  { const o = wcGroups[gid] || []; return o[0] || null; }
  function gSecond(gid) { const o = wcGroups[gid] || []; return o[1] || null; }

  // Build the 16 R32 match definitions
  const r32Defs = [
    { key: 'r32_0',  teamA: gSecond('A'), labelA: 'A Runner-up', teamB: gSecond('B'), labelB: 'B Runner-up', thirdSlot: false },
    { key: 'r32_1',  teamA: gSecond('E'), labelA: 'E Runner-up', teamB: gSecond('I'), labelB: 'I Runner-up', thirdSlot: false },
    { key: 'r32_2',  teamA: gFirst('C'),  labelA: 'C Winner',    teamB: gSecond('F'), labelB: 'F Runner-up', thirdSlot: false },
    { key: 'r32_3',  teamA: gFirst('F'),  labelA: 'F Winner',    teamB: gSecond('C'), labelB: 'C Runner-up', thirdSlot: false },
    { key: 'r32_4',  teamA: gFirst('H'),  labelA: 'H Winner',    teamB: gSecond('J'), labelB: 'J Runner-up', thirdSlot: false },
    { key: 'r32_5',  teamA: gSecond('K'), labelA: 'K Runner-up', teamB: gSecond('L'), labelB: 'L Runner-up', thirdSlot: false },
    { key: 'r32_6',  teamA: gFirst('A'),  labelA: 'A Winner',    teamB: null,          labelB: '3rd (C/E/F/H/I)', thirdSlot: true },
    { key: 'r32_7',  teamA: gFirst('B'),  labelA: 'B Winner',    teamB: null,          labelB: '3rd (E/F/G/I/J)', thirdSlot: true },
    { key: 'r32_8',  teamA: gFirst('D'),  labelA: 'D Winner',    teamB: null,          labelB: '3rd (B/E/F/I/J)', thirdSlot: true },
    { key: 'r32_9',  teamA: gFirst('E'),  labelA: 'E Winner',    teamB: null,          labelB: '3rd (A/B/C/D/F)', thirdSlot: true },
    { key: 'r32_10', teamA: gFirst('G'),  labelA: 'G Winner',    teamB: null,          labelB: '3rd (A/E/H/I/J)', thirdSlot: true },
    { key: 'r32_11', teamA: gFirst('I'),  labelA: 'I Winner',    teamB: null,          labelB: '3rd (C/D/F/G/H)', thirdSlot: true },
    { key: 'r32_12', teamA: gFirst('J'),  labelA: 'J Winner',    teamB: null,          labelB: '3rd (B/C/F/G/I)', thirdSlot: true },
    { key: 'r32_13', teamA: gFirst('K'),  labelA: 'K Winner',    teamB: null,          labelB: '3rd (B/C/G/H/I)', thirdSlot: true },
    { key: 'r32_14', teamA: gFirst('L'),  labelA: 'L Winner',    teamB: null,          labelB: '3rd (E/H/I/J/K)', thirdSlot: true },
    { key: 'r32_15', teamA: gSecond('D'), labelA: 'D Runner-up', teamB: gSecond('G'), labelB: 'G Runner-up', thirdSlot: false },
  ];

  // Fill saved 3rd-place picks
  r32Defs.forEach(m => {
    if (m.thirdSlot) {
      m.teamB = wcKnockout[m.key + '_third'] || null;
    }
  });

  // R16
  const r16 = Array.from({length: 8}, (_, i) => ({
    key: 'r16_' + i,
    teamA: wcKnockout['r32_' + (i*2)]   || null, labelA: 'W R32-' + (i*2+1),
    teamB: wcKnockout['r32_' + (i*2+1)] || null, labelB: 'W R32-' + (i*2+2),
  }));

  // QF
  const qf = Array.from({length: 4}, (_, i) => ({
    key: 'qf_' + i,
    teamA: wcKnockout['r16_' + (i*2)]   || null, labelA: 'W R16',
    teamB: wcKnockout['r16_' + (i*2+1)] || null, labelB: 'W R16',
  }));

  // SF
  const sf = [
    { key:'sf_0', teamA: wcKnockout['qf_0']||null, labelA:'W QF1', teamB: wcKnockout['qf_1']||null, labelB:'W QF2' },
    { key:'sf_1', teamA: wcKnockout['qf_2']||null, labelA:'W QF3', teamB: wcKnockout['qf_3']||null, labelB:'W QF4' },
  ];

  function sfLoser(sfIdx) {
    const m   = sf[sfIdx];
    const win = wcKnockout[m.key] || null;
    if (!win) return null;
    return (win === m.teamA) ? m.teamB : m.teamA;
  }

  const tpA  = sfLoser(0);
  const tpB  = sfLoser(1);
  const finA = wcKnockout['sf_0'] || null;
  const finB = wcKnockout['sf_1'] || null;

  function del(k) { delete wcKnockout[k]; }

  function invalidateDownstream(key) {
    if (key.startsWith('r32_')) {
      const idx  = parseInt(key.replace('r32_', ''));
      const r16i = Math.floor(idx / 2);
      del('r16_' + r16i);
      const qfi = Math.floor(r16i / 2);
      del('qf_' + qfi);
      const sfi = Math.floor(qfi / 2);
      del('sf_' + sfi);
      del('tpw'); del('fw');
    } else if (key.startsWith('r16_')) {
      const idx = parseInt(key.slice(4));
      const qfi = Math.floor(idx / 2);
      del('qf_' + qfi);
      const sfi = Math.floor(qfi / 2);
      del('sf_' + sfi);
      del('tpw'); del('fw');
    } else if (key.startsWith('qf_')) {
      const idx = parseInt(key.slice(3));
      del('sf_' + Math.floor(idx / 2));
      del('tpw'); del('fw');
    } else if (key.startsWith('sf_')) {
      del('tpw'); del('fw');
    }
  }

  /* ── FIX 1: makeRow omits the seed/label text on the left ─ */
  function makeMatch(matchKey, teamA, labelA, teamB, labelB, isFinal, thirdSlotKey) {
    const card = document.createElement('div');
    card.className = 'brk-matchup' + (isFinal ? ' brk-matchup--final' : '');
    const currentWin = wcKnockout[matchKey] || null;

    function makeRow(nid, lbl, isWin, isThirdPick) {
      const row = document.createElement('div');
      row.className = 'brk-team' +
        (isWin ? ' brk-team--winner' : '') +
        ((nid || isThirdPick) ? ' brk-team--clickable' : '');

      if (nid) {
        // No seed label — just badge + name
        row.innerHTML =
          `<img class="brk-badge" src="${nationBadge(nid)}" alt="${nationName(nid)}" onerror="this.style.opacity=0.1">` +
          `<span class="brk-team-name">${nationName(nid)}</span>`;
      } else if (isThirdPick) {
        row.innerHTML =
          `<span class="brk-empty-badge"></span>` +
          `<span class="brk-team-name brk-tbd">${lbl}</span>`;
      } else {
        row.innerHTML =
          `<span class="brk-empty-badge"></span>` +
          `<span class="brk-team-name brk-tbd">TBD</span>`;
      }

      if (isThirdPick) {
        row.addEventListener('click', () => openWCThirdPicker(thirdSlotKey, matchKey));
      } else if (nid) {
        row.addEventListener('click', () => {
          wcKnockout[matchKey] = nid;
          invalidateDownstream(matchKey);
          saveWCState();
          renderWCKnockout();
        });
      }
      return row;
    }

    const isThirdSlot = !!thirdSlotKey;
    card.appendChild(makeRow(teamA, labelA, currentWin && teamA === currentWin, false));
    const vs = document.createElement('div'); vs.className = 'brk-vs'; vs.textContent = 'vs';
    card.appendChild(vs);
    card.appendChild(makeRow(teamB, labelB, currentWin && teamB === currentWin, isThirdSlot && !teamB));
    return card;
  }

  function makeCol(label, useGrid) {
    const col = document.createElement('div');
    col.className = 'wc-ko-col' + (useGrid ? ' wc-ko-col--grid' : '');
    const lbl = document.createElement('div');
    lbl.className = 'brk-col-label';
    lbl.textContent = label;
    col.appendChild(lbl);
    return col;
  }

  const layout = document.createElement('div');
  layout.className = 'wc-ko-layout';
  wrap.appendChild(layout);

  // R32 — 2-col grid
  const r32Col = makeCol('Round of 32', true);
  r32Defs.forEach(m => {
    r32Col.appendChild(makeMatch(m.key, m.teamA, m.labelA, m.teamB, m.labelB, false, m.thirdSlot ? m.key : null));
  });
  layout.appendChild(r32Col);

  // R16
  const r16Col = makeCol('Round of 16', true);
  r16.forEach(m => r16Col.appendChild(makeMatch(m.key, m.teamA, m.labelA, m.teamB, m.labelB, false, null)));
  layout.appendChild(r16Col);

  // QF
  const qfCol = makeCol('Quarter-finals', true);
  qf.forEach(m => qfCol.appendChild(makeMatch(m.key, m.teamA, m.labelA, m.teamB, m.labelB, false, null)));
  layout.appendChild(qfCol);

  // SF
  const sfCol = makeCol('Semi-finals', false);
  sf.forEach(m => sfCol.appendChild(makeMatch(m.key, m.teamA, m.labelA, m.teamB, m.labelB, false, null)));
  layout.appendChild(sfCol);

  // 3rd + Final
  const endRow = document.createElement('div');
  endRow.className = 'wc-ko-end-row';
  layout.appendChild(endRow);

  const tpCol = makeCol('3rd Place', false);
  tpCol.appendChild(makeMatch('tpw', tpA, tpA ? nationName(tpA) : 'SF Loser 1', tpB, tpB ? nationName(tpB) : 'SF Loser 2', false, null));
  endRow.appendChild(tpCol);

  const finCol = makeCol('Final', false);
  finCol.appendChild(makeMatch('fw', finA, finA ? nationName(finA) : 'Winner SF1', finB, finB ? nationName(finB) : 'Winner SF2', true, null));
  endRow.appendChild(finCol);

  // Champion banner
  const fw = wcKnockout['fw'] || null;
  if (fw) {
    const banner = document.createElement('div');
    banner.className = 'wc-champion';
    banner.innerHTML =
      `<img src="${nationBadge(fw)}" alt="${nationName(fw)}" onerror="this.style.opacity=0.1">` +
      `<div><div class="wc-champion-label">Your World Cup winner</div>` +
      `<div class="wc-champion-name">${nationName(fw)}</div></div>`;
    wrap.appendChild(banner);
  }
}

/* ── WC 3rd-place slot picker ────────────────────────────── */
function openWCThirdPicker(thirdSlotKey, matchKey) {
  pickerContext = { type: 'wc-third', thirdSlotKey, matchKey };
  pickerSearch.value = '';
  renderPickerList('');
  pickerModal.classList.add('open');
  setTimeout(() => pickerSearch.focus(), 60);
}

/* ── WC group picker ─────────────────────────────────────── */
function openWCGroupPicker(group, pos) {
  pickerContext = { type: 'wc-group', group, pos };
  pickerSearch.value = '';
  renderPickerList('');
  pickerModal.classList.add('open');
  setTimeout(() => pickerSearch.focus(), 60);
}

/* ════════════════════════════════════════════════════════════
   LEAGUE TAB BAR (non-WC)
   ════════════════════════════════════════════════════════════ */

function buildTabBar(lg) {
  tabBar.innerHTML = '';

  const hasUnconfirmed     = getRivalries(lg).length > 0;
  const hasPlayoffs        = getPlayoffSlots(lg).length >= 2;
  const playoffSlotsLocked = hasPlayoffs && !allPlayoffSlotsFilled(lg);

  const tabs = [];
  if (hasUnconfirmed) tabs.push({ id: 'unconfirmed', label: 'Deadlines' });
  tabs.push({ id: 'table', label: 'Table' });
  if (hasPlayoffs) tabs.push({ id: 'playoffs', label: 'Play-offs' });

  if (hasUnconfirmed && !allRivalriesResolved(lg)) {
    activeTab = 'unconfirmed';
  } else if (!tabs.find(t => t.id === activeTab)) {
    activeTab = 'table';
  }
  if (activeTab === 'playoffs' && playoffSlotsLocked) activeTab = 'table';

  tabs.forEach(t => {
    const isTableLocked   = t.id === 'table'    && hasUnconfirmed && !allRivalriesResolved(lg);
    const isPlayoffLocked = t.id === 'playoffs' && playoffSlotsLocked;
    const isLocked = isTableLocked || isPlayoffLocked;
    const btn = document.createElement('button');
    btn.className   = 'pred-tab' + (activeTab === t.id ? ' pred-tab--active' : '') + (isLocked ? ' pred-tab--locked' : '');
    btn.dataset.tab = t.id;
    btn.disabled    = isLocked;
    btn.textContent = t.label;
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    tabBar.appendChild(btn);
  });

  applyPaneVisibility();
}

function switchTab(id) {
  if (id === 'table'    && !allRivalriesResolved(activeLeague)) return;
  if (id === 'playoffs' && !allPlayoffSlotsFilled(activeLeague)) return;
  activeTab = id;
  tabBar.querySelectorAll('.pred-tab').forEach(btn => {
    btn.classList.toggle('pred-tab--active', btn.dataset.tab === id);
  });
  applyPaneVisibility();
}

function applyPaneVisibility() {
  tablePane.style.display   = activeTab === 'table'       ? '' : 'none';
  unknownPane.style.display = activeTab === 'unconfirmed' ? '' : 'none';
  bracketPane.style.display = activeTab === 'playoffs'    ? '' : 'none';
  if (wcGroupsPane)   wcGroupsPane.style.display   = 'none';
  if (wcThirdsPane)   wcThirdsPane.style.display   = 'none';
  if (wcKnockoutPane) wcKnockoutPane.style.display = 'none';
}

function refreshTabLockState(lg) {
  const playoffLocked = !allPlayoffSlotsFilled(lg);
  const tableLocked   = !allRivalriesResolved(lg);
  tabBar.querySelectorAll('.pred-tab').forEach(btn => {
    const id = btn.dataset.tab;
    const isLocked = (id === 'table' && tableLocked) || (id === 'playoffs' && playoffLocked);
    btn.disabled = isLocked;
    btn.classList.toggle('pred-tab--locked', isLocked);
  });
}

/* ── zone helpers ─────────────────────────────────────────── */
function buildZoneMap(lg) {
  const map = {};
  if (lg.zones) lg.zones.forEach(z => z.slots.forEach(pos => { map[pos] = z; }));
  return map;
}

function getPlayoffSlots(lg) {
  if (!lg.zones) return [];
  const slots = [];
  lg.zones.forEach(z => { if (z.cls === 'playoff') z.slots.forEach(p => slots.push(p)); });
  return slots.sort((a, b) => a - b);
}

function allPlayoffSlotsFilled(lg) {
  const slots = getPlayoffSlots(lg);
  if (!slots.length) return true;
  return slots.every(pos => {
    const row = table[pos - 1];
    return row && !!row.clubId;
  });
}

/* ── render table ─────────────────────────────────────────── */
function renderTable() {
  tableWrap.innerHTML = '';
  const lg      = activeLeague;
  if (!lg || lg.type === 'worldcup') return;
  const zoneMap = buildZoneMap(lg);
  const filled  = table.filter(r => r.clubId).length;
  const locked  = !allRivalriesResolved(lg);

  saveState(lg);
  refreshTabLockState(lg);

  if (locked) {
    const gate = document.createElement('div');
    gate.className = 'pred-gate';
    gate.innerHTML =
      `<p class="pred-gate-title">Table locked</p>` +
      `<p class="pred-gate-sub">Decide the outstanding teams first — head to the <strong>Deadlines</strong> tab to make your picks.</p>`;
    tableWrap.appendChild(gate);
    return;
  }

  const hdr = document.createElement('div');
  hdr.className = 'pred-table-header';
  hdr.innerHTML =
    '<span class="pred-hdr-pos">#</span>' +
    '<span class="pred-hdr-club">Club</span>' +
    `<span class="pred-hdr-status">${filled} / ${lg.positions}</span>`;
  tableWrap.appendChild(hdr);

  table.forEach((row, i) => {
    const zone    = zoneMap[row.pos] || null;
    const zoneCls = zone ? zone.cls : 'mid';
    const div     = document.createElement('div');
    div.className   = `pred-row pred-row--${zoneCls}`;
    div.dataset.pos = row.pos;

    if (row.clubId) {
      const name = clubName(row.clubId);
      div.innerHTML =
        `<span class="pred-pos">${row.pos}</span>` +
        `<img class="pred-badge" src="${clubBadge(row.clubId)}" alt="${name}" onerror="this.style.opacity=0.1">` +
        `<span class="pred-name">${name}</span>` +
        `<button class="pred-clear" title="Clear">✕</button>`;
      div.querySelector('.pred-clear').addEventListener('click', e => {
        e.stopPropagation();
        table[i].clubId = null;
        renderTable();
        renderUnknownPanel();
        renderBracket();
      });
    } else {
      div.innerHTML =
        `<span class="pred-pos">${row.pos}</span>` +
        `<span class="pred-empty-badge"></span>` +
        `<span class="pred-placeholder">Pick a team…</span>`;
    }

    div.addEventListener('click', () => openPickerForTable(i));
    tableWrap.appendChild(div);
  });

  if (lg.zones && lg.zones.length) {
    const leg = document.createElement('div');
    leg.className = 'pred-legend';
    lg.zones.forEach(z => {
      const sp = document.createElement('span');
      sp.className   = `leg ${z.cls}`;
      sp.textContent = `■ ${z.label}`;
      leg.appendChild(sp);
    });
    tableWrap.appendChild(leg);
  }
}

/* ── render deadlines ─────────────────────────────────────── */
function renderUnknownPanel() {
  unknownWrap.innerHTML = '';
  const lg        = activeLeague;
  if (!lg || lg.type === 'worldcup') return;
  const rivalries = getRivalries(lg);
  if (!rivalries.length) return;

  rivalries.forEach((rv, i) => {
    const chosen = rivalryDecisions[i] ? String(rivalryDecisions[i]) : null;
    const idA    = String(rv.a.clubId);
    const idB    = String(rv.b.clubId);

    const section = document.createElement('div');
    section.className = 'rv-section';

    const lbl = document.createElement('div');
    lbl.className   = 'rv-label';
    lbl.textContent = rv.label;
    section.appendChild(lbl);

    const duel = document.createElement('div');
    duel.className = 'rv-duel';

    [{ id: idA, meta: rv.a }, { id: idB, meta: rv.b }].forEach(({ id, meta }) => {
      const card = document.createElement('button');
      const isChosen   = chosen === id;
      const isRejected = chosen && chosen !== id;
      card.className =
        'rv-card' +
        (isChosen   ? ' rv-card--chosen'   : '') +
        (isRejected ? ' rv-card--rejected' : '');

      const chosenLabel = rv.chosenLabel || '✓';
      card.innerHTML =
        `<img class="rv-badge" src="${clubBadge(id)}" alt="${meta.label}" onerror="this.style.opacity=0.15">` +
        `<div class="rv-info">` +
          `<span class="rv-name">${meta.label}</span>` +
          (meta.note ? `<span class="rv-note">${meta.note}</span>` : '') +
        `</div>` +
        (isChosen   ? `<span class="rv-tick${rv.invertResult ? ' rv-tick--down' : ''}">${chosenLabel}</span>` : '') +
        (isRejected ? `<span class="rv-cross${rv.invertResult ? ' rv-cross--stays' : ''}"></span>` : '');

      card.addEventListener('click', () => {
        const currentChosen = rivalryDecisions[i] ? String(rivalryDecisions[i]) : null;
        if (currentChosen === id) {
          delete rivalryDecisions[i];
        } else {
          rivalryDecisions[i] = id;
          const toRemove = rv.invertResult ? id : (id === idA ? idB : idA);
          table.forEach(row => { if (String(row.clubId) === toRemove) row.clubId = null; });
        }
        saveState(lg);
        buildTabBar(lg);
        renderTable();
        renderUnknownPanel();
        renderBracket();
      });

      duel.appendChild(card);
    });

    const vs = document.createElement('div');
    vs.className   = 'rv-vs';
    vs.textContent = 'vs';
    duel.insertBefore(vs, duel.children[1]);
    section.appendChild(duel);
    unknownWrap.appendChild(section);
  });
}

/* ── bracket ──────────────────────────────────────────────── */
function getTeamAtPos(pos) {
  return pos ? (table[pos - 1]?.clubId || null) : null;
}

function renderBracket() {
  bracketWrap.innerHTML = '';
  if (!activeLeague || activeLeague.type === 'worldcup') return;
  const playoffSlots = getPlayoffSlots(activeLeague);
  if (playoffSlots.length < 2) return;

  const n  = playoffSlots.length;
  const el = document.createElement('div');
  el.className = 'brk-bracket';

  if      (n === 2) buildBracket2(el, playoffSlots);
  else if (n === 4) buildBracket4(el, playoffSlots);
  else if (n === 6) buildBracket6(el, playoffSlots);
  else              buildBracketGeneric(el, playoffSlots);

  bracketWrap.appendChild(el);
}

function makeTeamRow(clubId, seedLabel, onAdvance, isWinner) {
  const row = document.createElement('div');
  row.className = 'brk-team';
  if (isWinner) row.classList.add('brk-team--winner');
  if (onAdvance) row.classList.add('brk-team--clickable');

  const seed = document.createElement('span');
  seed.className = 'brk-seed';
  seed.textContent = seedLabel;
  row.appendChild(seed);

  if (clubId) {
    const img = document.createElement('img');
    img.className = 'brk-badge';
    img.src = clubBadge(clubId);
    img.onerror = () => { img.style.opacity = '0.1'; };
    row.appendChild(img);
    const nameEl = document.createElement('span');
    nameEl.className = 'brk-team-name';
    nameEl.textContent = clubName(clubId);
    row.appendChild(nameEl);
  } else {
    const empty = document.createElement('span');
    empty.className = 'brk-empty-badge';
    row.appendChild(empty);
    const ph = document.createElement('span');
    ph.className = 'brk-team-name brk-tbd';
    ph.textContent = seedLabel;
    row.appendChild(ph);
  }

  if (onAdvance && clubId) {
    row.title = `Click to advance ${clubName(clubId)}`;
    row.addEventListener('click', () => {
      onAdvance(clubId);
      saveState(activeLeague);
      renderBracket();
    });
  }
  return row;
}

function makeVs() {
  const d = document.createElement('div');
  d.className = 'brk-vs';
  d.textContent = 'vs';
  return d;
}

function makeMatchupCard(teamA, teamB, currentWinner, isFinal) {
  const card = document.createElement('div');
  card.className = 'brk-matchup' + (isFinal ? ' brk-matchup--final' : '');
  card.appendChild(makeTeamRow(teamA.clubId, teamA.seedLabel, teamA.onAdvance, currentWinner && teamA.clubId === currentWinner));
  card.appendChild(makeVs());
  card.appendChild(makeTeamRow(teamB.clubId, teamB.seedLabel, teamB.onAdvance, currentWinner && teamB.clubId === currentWinner));
  return card;
}

function makeCol(label, extraClass) {
  const col = document.createElement('div');
  col.className = 'brk-col' + (extraClass ? ' ' + extraClass : '');
  if (label) {
    const lbl = document.createElement('div');
    lbl.className = 'brk-col-label';
    lbl.textContent = label;
    col.appendChild(lbl);
  }
  return col;
}

function buildBracket2(el, slots) {
  const rounds = document.createElement('div'); rounds.className = 'brk-rounds';
  const col = makeCol('Final');
  col.appendChild(makeMatchupCard(
    { clubId: getTeamAtPos(slots[0]), seedLabel: String(slots[0]), onAdvance: id => { bracketState.fw = id; } },
    { clubId: getTeamAtPos(slots[1]), seedLabel: String(slots[1]), onAdvance: id => { bracketState.fw = id; } },
    bracketState.fw || null, true
  ));
  rounds.appendChild(col); el.appendChild(rounds);
}

function buildBracket4(el, slots) {
  const rounds = document.createElement('div'); rounds.className = 'brk-rounds';
  const s3 = getTeamAtPos(slots[0]), s4 = getTeamAtPos(slots[1]);
  const s5 = getTeamAtPos(slots[2]), s6 = getTeamAtPos(slots[3]);

  const sfCol = makeCol('Semi-finals');
  sfCol.appendChild(makeMatchupCard(
    { clubId: s3, seedLabel: String(slots[0]), onAdvance: id => { bracketState.sf1w = id; if (bracketState.fw && bracketState.fw !== id) bracketState.fw = null; } },
    { clubId: s6, seedLabel: String(slots[3]), onAdvance: id => { bracketState.sf1w = id; if (bracketState.fw && bracketState.fw !== id) bracketState.fw = null; } },
    bracketState.sf1w || null, false
  ));
  sfCol.appendChild(makeMatchupCard(
    { clubId: s4, seedLabel: String(slots[1]), onAdvance: id => { bracketState.sf2w = id; if (bracketState.fw && bracketState.fw !== id) bracketState.fw = null; } },
    { clubId: s5, seedLabel: String(slots[2]), onAdvance: id => { bracketState.sf2w = id; if (bracketState.fw && bracketState.fw !== id) bracketState.fw = null; } },
    bracketState.sf2w || null, false
  ));
  rounds.appendChild(sfCol);

  const finCol = makeCol('Final', 'brk-col--final');
  const fw1 = bracketState.sf1w || null, fw2 = bracketState.sf2w || null;
  finCol.appendChild(makeMatchupCard(
    { clubId: fw1, seedLabel: fw1 ? clubName(fw1) : 'Winner SF1', onAdvance: id => { bracketState.fw = id; } },
    { clubId: fw2, seedLabel: fw2 ? clubName(fw2) : 'Winner SF2', onAdvance: id => { bracketState.fw = id; } },
    bracketState.fw || null, true
  ));
  rounds.appendChild(finCol); el.appendChild(rounds);
}

function buildBracket6(el, slots) {
  const rounds = document.createElement('div'); rounds.className = 'brk-rounds brk-rounds--6';
  const bye1=getTeamAtPos(slots[0]), bye2=getTeamAtPos(slots[1]);
  const r1aa=getTeamAtPos(slots[2]), r1ab=getTeamAtPos(slots[5]);
  const r1ba=getTeamAtPos(slots[3]), r1bb=getTeamAtPos(slots[4]);

  const r1Col = makeCol('1st Round');
  r1Col.appendChild(makeMatchupCard(
    { clubId: r1aa, seedLabel: String(slots[2]), onAdvance: id => { bracketState.r1aw = id; bracketState.sf1w = null; bracketState.fw = null; } },
    { clubId: r1ab, seedLabel: String(slots[5]), onAdvance: id => { bracketState.r1aw = id; bracketState.sf1w = null; bracketState.fw = null; } },
    bracketState.r1aw || null, false
  ));
  r1Col.appendChild(makeMatchupCard(
    { clubId: r1ba, seedLabel: String(slots[3]), onAdvance: id => { bracketState.r1bw = id; bracketState.sf2w = null; bracketState.fw = null; } },
    { clubId: r1bb, seedLabel: String(slots[4]), onAdvance: id => { bracketState.r1bw = id; bracketState.sf2w = null; bracketState.fw = null; } },
    bracketState.r1bw || null, false
  ));
  rounds.appendChild(r1Col);

  const sfCol = makeCol('Semi-finals');
  const r1aw = bracketState.r1aw || null, r1bw = bracketState.r1bw || null;
  sfCol.appendChild(makeMatchupCard(
    { clubId: bye1, seedLabel: String(slots[0]), onAdvance: id => { bracketState.sf1w = id; bracketState.fw = null; } },
    { clubId: r1aw, seedLabel: r1aw ? clubName(r1aw) : 'Winner R1a', onAdvance: id => { bracketState.sf1w = id; bracketState.fw = null; } },
    bracketState.sf1w || null, false
  ));
  sfCol.appendChild(makeMatchupCard(
    { clubId: bye2, seedLabel: String(slots[1]), onAdvance: id => { bracketState.sf2w = id; bracketState.fw = null; } },
    { clubId: r1bw, seedLabel: r1bw ? clubName(r1bw) : 'Winner R1b', onAdvance: id => { bracketState.sf2w = id; bracketState.fw = null; } },
    bracketState.sf2w || null, false
  ));
  rounds.appendChild(sfCol);

  const finCol = makeCol('Final', 'brk-col--final');
  const sf1w = bracketState.sf1w || null, sf2w = bracketState.sf2w || null;
  finCol.appendChild(makeMatchupCard(
    { clubId: sf1w, seedLabel: sf1w ? clubName(sf1w) : 'Winner SF1', onAdvance: id => { bracketState.fw = id; } },
    { clubId: sf2w, seedLabel: sf2w ? clubName(sf2w) : 'Winner SF2', onAdvance: id => { bracketState.fw = id; } },
    bracketState.fw || null, true
  ));
  rounds.appendChild(finCol); el.appendChild(rounds);
}

function buildBracketGeneric(el, slots) {
  const col = makeCol('Play-off teams');
  slots.forEach(pos => {
    const id = getTeamAtPos(pos);
    const row = makeTeamRow(id, String(pos), null, false);
    row.classList.add('brk-team--solo');
    col.appendChild(row);
  });
  const rounds = document.createElement('div'); rounds.className = 'brk-rounds';
  rounds.appendChild(col); el.appendChild(rounds);
}

/* ── picker ───────────────────────────────────────────────── */
function openPickerForTable(rowIndex) {
  pickerContext = { type: 'table', rowIndex };
  pickerSearch.value = '';
  renderPickerList('');
  pickerModal.classList.add('open');
  setTimeout(() => pickerSearch.focus(), 60);
}

function closePicker() {
  pickerModal.classList.remove('open');
  pickerContext = null;
}

function renderPickerList(query) {
  pickerList.innerHTML = '';
  if (!pickerContext) return;
  const q = query.trim().toLowerCase();

  /* ── WC 3rd-place slot picker ─────────────────────────── */
  if (pickerContext.type === 'wc-third') {
    const { thirdSlotKey, matchKey } = pickerContext;
    const eligibleGroups = WC_THIRD_POOLS[thirdSlotKey] || [];
    const currentPick    = wcKnockout[matchKey + '_third'] || null;

    // Nations already assigned to other 3rd-place slots
    const usedElsewhere = new Set();
    Object.keys(WC_THIRD_POOLS).forEach(slotKey => {
      if (slotKey === thirdSlotKey) return;
      const pick = wcKnockout[slotKey + '_third'];
      if (pick) usedElsewhere.add(String(pick));
    });

    const items = eligibleGroups
      .map(gid => {
        const order = wcGroups[gid] || [];
        const nid   = order[2] || null;
        return nid ? { id: String(nid), name: nationName(nid), group: gid } : null;
      })
      .filter(item => {
        if (!item) return false;
        if (!wcThirds.includes(item.id)) return false; // must be an advancing 3rd
        if (usedElsewhere.has(item.id) && item.id !== currentPick) return false;
        return !q || item.name.toLowerCase().includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!items.length) {
      pickerList.innerHTML = '<p class="picker-empty">No eligible 3rd-place teams for this slot — check your Best 3rd selections.</p>';
      return;
    }

    items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = `picker-item${item.id === currentPick ? ' selected' : ''}`;
      btn.innerHTML =
        `<img class="picker-badge" src="${nationBadge(item.id)}" alt="${item.name}" onerror="this.style.opacity=0.1">` +
        `<span>${item.name} <span style="color:var(--muted);font-size:11px">(Grp ${item.group})</span></span>`;
      btn.addEventListener('click', () => {
        wcKnockout[matchKey + '_third'] = item.id;
        wcKnockout[matchKey] = null; // reset winner when 3rd-place opponent changes
        // Invalidate downstream
        const idx  = parseInt(matchKey.replace('r32_', ''));
        const r16i = Math.floor(idx / 2);
        delete wcKnockout['r16_' + r16i];
        const qfi = Math.floor(r16i / 2);
        delete wcKnockout['qf_' + qfi];
        delete wcKnockout['sf_' + Math.floor(qfi / 2)];
        delete wcKnockout['tpw'];
        delete wcKnockout['fw'];
        saveWCState();
        closePicker();
        renderWCKnockout();
      });
      pickerList.appendChild(btn);
    });
    return;
  }

  /* ── WC group picker ──────────────────────────────────── */
  if (pickerContext.type === 'wc-group') {
    const group = pickerContext.group;
    const pos   = pickerContext.pos;
    const currentOrder = wcGroups[group.id] ? [...wcGroups[group.id]] : [null,null,null,null];
    while (currentOrder.length < 4) currentOrder.push(null);
    const currentId = currentOrder[pos];
    const placed    = new Set(currentOrder.filter(Boolean));

    const items = group.nations
      .map(id => ({ id: String(id), name: nationName(id) }))
      .filter(item => {
        if (placed.has(item.id) && item.id !== currentId) return false;
        return !q || item.name.toLowerCase().includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!items.length) { pickerList.innerHTML = '<p class="picker-empty">No matching nations</p>'; return; }

    items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = `picker-item${item.id === currentId ? ' selected' : ''}`;
      btn.innerHTML =
        `<img class="picker-badge" src="${nationBadge(item.id)}" alt="${item.name}" onerror="this.style.opacity=0.1">` +
        `<span>${item.name}</span>`;
      btn.addEventListener('click', () => {
        if (!wcGroups[group.id]) wcGroups[group.id] = [null,null,null,null];
        while (wcGroups[group.id].length < 4) wcGroups[group.id].push(null);
        wcGroups[group.id][pos] = item.id;
        saveWCState();
        closePicker();
        refreshWCTabLocks(true);
        renderWCGroups();
      });
      pickerList.appendChild(btn);
    });
    return;
  }

  /* ── Normal league picker ─────────────────────────────── */
  const lg        = activeLeague;
  const currentId = table[pickerContext.rowIndex]?.clubId || null;
  const placed    = new Set(table.map(r => r.clubId).filter(Boolean));
  const rejected  = getRejectedClubIds(lg);

  const allIds = new Set(lg.clubIds.map(String));
  if (lg.unknownPool) lg.unknownPool.forEach(u => allIds.add(String(u.clubId)));
  getRivalries(lg).forEach(rv => {
    allIds.add(String(rv.a.clubId));
    allIds.add(String(rv.b.clubId));
  });

  const items = Array.from(allIds)
    .filter(id => !rejected.has(id))
    .map(id => ({ id, name: clubName(id) }))
    .filter(item => {
      if (placed.has(item.id) && item.id !== currentId) return false;
      return !q || item.name.toLowerCase().includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!items.length) { pickerList.innerHTML = '<p class="picker-empty">No matching clubs</p>'; return; }

  items.forEach(item => {
    const btn = document.createElement('button');
    btn.className = `picker-item${item.id === currentId ? ' selected' : ''}`;
    btn.innerHTML =
      `<img class="picker-badge" src="${clubBadge(item.id)}" alt="${item.name}" onerror="this.style.opacity=0.1">` +
      `<span>${item.name}</span>`;
    btn.addEventListener('click', () => {
      table[pickerContext.rowIndex].clubId = item.id;
      closePicker();
      renderTable();
      renderUnknownPanel();
      renderBracket();
    });
    pickerList.appendChild(btn);
  });
}

/* ── kick off ─────────────────────────────────────────────── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}