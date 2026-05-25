/**
 * js/Filter.js  —  Madfut 26 Filter System (full rewrite)
 *
 * Features:
 *  - Desktop: persistent right sidebar with tabbed pages
 *  - Mobile: floating bottom search bar + swipe-up fullscreen sheet
 *  - Search with accent/diacritic normalisation
 *  - Sort: multi-rule, per-field asc/desc
 *  - Badges: Club / League / Nation / Card Design tabs
 *  - Positions: football pitch UI, 3 modes (both/main/alt)
 *  - Stats: dual range sliders + number inputs for all stats + FCM
 *  - Display toggles: download btn, FCM, fatal stats, alt positions, view/download mode
 *  - Misc: pack availability, tokens, rewards, etc.
 *
 * Bridge globals set by Card.js:
 *   window._filterAndSort   — triggers re-filter
 *   window._cardShowToast   — shows toast message
 *   window._allPlayers      — current player array
 *   window.colorMap         — card design map
 */

import { clubIdToName, leagueIdToName, nationIdToName } from './Mappings.js';

// ─────────────────────────────────────────────
// Page mode
// ─────────────────────────────────────────────
const PAGE_MODE   = window.PAGE_MODE || 'all';
const IS_LIVE_PAGE = PAGE_MODE === 'livePlayers';

// ─────────────────────────────────────────────
// Exported filter state  (read by Card.js)
// ─────────────────────────────────────────────
export const selectedClubs        = new Set();
export const selectedLeagues      = new Set();
export const selectedNations      = new Set();
export const selectedColors       = new Set();
export const selectedPositions    = new Set();
export const selectedAltPositions = new Set();
export let   positionMode         = 'both'; // 'both' | 'main' | 'alt'

// ─────────────────────────────────────────────
// DB filter state — tracked in JS, not DOM
// ─────────────────────────────────────────────
const ALL_DB_SOURCES = ['updates','sbcGroups','objectives','evosElite','draftCups','ltm','livePlayers','realmExport','evo'];
export const selectedDbs = new Set(ALL_DB_SOURCES);

export const STAT_KEYS = ['PAC','SHO','PAS','DRI','DEF','PHY','attack','control','defense'];
export let   statFiltersState = {};
STAT_KEYS.forEach(k => { statFiltersState[k] = []; });

export let uniqueColors = [];
export function setUniqueColors(colors) { uniqueColors = colors; }

// ─────────────────────────────────────────────
// Pitch layout  [pos, left%, top%]
// ─────────────────────────────────────────────
const PITCH_POSITIONS = [
  { pos: 'GK',  x: 50, y:  7 },
  { pos: 'RB',  x: 18, y: 22 },
  { pos: 'CB',  x: 37, y: 21 },
  { pos: 'CB',  x: 63, y: 21 },
  { pos: 'LB',  x: 82, y: 22 },
  { pos: 'CDM', x: 35, y: 37 },
  { pos: 'CDM', x: 65, y: 37 },
  { pos: 'RM',  x: 17, y: 52 },
  { pos: 'CM',  x: 37, y: 51 },
  { pos: 'CM',  x: 63, y: 51 },
  { pos: 'LM',  x: 83, y: 52 },
  { pos: 'RW',  x: 21, y: 66 },
  { pos: 'CAM', x: 50, y: 65 },
  { pos: 'LW',  x: 79, y: 66 },
  { pos: 'ST',  x: 37, y: 81 },
  { pos: 'ST',  x: 63, y: 81 },
];

const ALL_POSITIONS = ['GK','CB','LB','RB','CDM','CM','CAM','RM','LM','LW','RW','ST'];

// ─────────────────────────────────────────────
// Sort state
// ─────────────────────────────────────────────
const SORT_FIELDS = ['Rating','Name','Position','PAC','SHO','PAS','DRI','DEF','PHY','Attack','Control','Defense','FCM Meta','Date','Added At','Net Fatal','Total Fatal'];

export let sortRules = [{ field: 'date', dir: 'desc' }];

// ─────────────────────────────────────────────
// Display state
// ─────────────────────────────────────────────
export const displayState = {
  showDownload:    true,
  showFCM:         false,
  showFatal:       true,
  showAltPos:      true,
  showBreakdown:   false,
  viewMode:        'view',
};

// Download-specific visibility (independent from view toggles)
export const downloadState = {
  showFCM:       false,
  showFatal:     true,
  showAltPos:    true,
  showBreakdown: false,
};

// ─────────────────────────────────────────────
// Misc state
// ─────────────────────────────────────────────
export const miscState = {
  // Packable filters (packable field)
  inPacks:     false,
  objReward:   false,
  sbcReward:   false,
  cupReward:   false,
  evoReward:   false,
  // Boolean filters
  inTokens:    false,
  inPicks:     false,
  tradable:    false,
  untradeable: false,
  totw:        false,
  totwWeek:    '',   // empty = any week, number = specific week
  genderMen:   false,
  genderWomen: false,
  dynamicImage: false,
};

// ─────────────────────────────────────────────
// Bridge helpers
// ─────────────────────────────────────────────
function triggerFilter()      { if (typeof window._filterAndSort === 'function') window._filterAndSort(); }
function showToast(msg)       { if (typeof window._cardShowToast === 'function') window._cardShowToast(msg); }
function allPlayers()         { return window._allPlayers || []; }

// ─────────────────────────────────────────────
// Accent / diacritic normalisation
// ─────────────────────────────────────────────
function normalise(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Export so Card.js can use it for search
export { normalise };

// ─────────────────────────────────────────────
// DOM refs
// ─────────────────────────────────────────────
let sidebarBody      = null;
let sheetBody        = null;
let mobileSearch     = null;
let mobileSheet      = null;
let fabBadge         = null;
let activeTagsBar    = null;

// ─────────────────────────────────────────────
// Current pages
// ─────────────────────────────────────────────
let desktopPage = 'search';
let mobilePage  = 'search';

// ─────────────────────────────────────────────
// Page builders
// ─────────────────────────────────────────────
function buildPage(page) {
  switch (page) {
    case 'search':    return buildSearchPage();
    case 'sort':      return buildSortPage();
    case 'badges':    return buildBadgesPage();
    case 'positions': return buildPositionsPage();
    case 'stats':     return buildStatsPage();
    case 'display':   return buildDisplayPage();
    case 'misc':      return buildMiscPage();
    default:          return '<div style="padding:20px;color:#555">Coming soon</div>';
  }
}

// ── SEARCH PAGE ──────────────────────────────
function buildSearchPage() {
  const searchVal = window._currentSearch || '';
  const html = `
  <div class="page-pad">
    <div class="fs-search-wrap" style="margin-bottom:6px">
      <input class="fs-search-input" type="text" id="desktopSearchInput"
        placeholder="Search player name…"
        value="${escHtml(searchVal)}"
        autocomplete="off">
      <button class="fs-search-clear" id="desktopSearchClear">×</button>
    </div>
    <div style="font-size:11px;color:#444;margin-bottom:16px;font-family:'Roboto Condensed',sans-serif;line-height:1.5">
    </div>

    <div class="fs-section-title" style="margin-bottom:8px">Database Source</div>
    <div class="db-filter-group">
      ${dbSources().map(s => `
      <label class="fs-check-row" style="padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.04);cursor:pointer">
        <input type="checkbox" class="db-filter" value="${s.value}" ${selectedDbs.has(s.value) ? 'checked' : ''}>
        <div class="fs-check-label">${s.label}</div>
      </label>`).join('')}
    </div>
  </div>`;
  return html;
}

function dbSources() {
  return [
    { value: 'updates',     label: 'Updates'           },
    { value: 'sbcGroups',   label: 'SBC Groups'        },
    { value: 'objectives',  label: 'Objectives'        },
    { value: 'evosElite',   label: 'Elite Evos'        },
    { value: 'draftCups',   label: 'Draft Cups'        },
    { value: 'ltm',         label: 'LTM Cards'         },
    { value: 'livePlayers', label: 'Live Players'      },
    { value: 'realmExport', label: 'Base Cards (Realm)'},
    { value: 'evo',         label: 'Evo Chains'        },
  ];
}

// ── SORT PAGE ────────────────────────────────
function buildSortPage() {
  return `
  <div class="sort-page-wrap">
    ${sortRules.map((r, i) => `
    <div class="sort-rule-card">
      <div class="sort-rule-top">
        <span class="sort-rule-label">Rule ${i + 1}</span>
        ${i > 0 ? `<button class="sort-rule-remove" data-remove="${i}">×</button>` : ''}
      </div>
      <select class="sort-field-select" data-sort-field="${i}">
${SORT_FIELDS.map(f => `<option value="${f.toLowerCase().replace(/ /g,'_')}" ${r.field === f.toLowerCase().replace(/ /g,'_') ? 'selected' : ''}>${f}</option>`).join('')}      </select>
      <div class="sort-dir-btns">
        <button class="sort-dir-btn ${r.dir === 'asc' ? 'active' : ''}" data-sort-dir="${i}" data-val="asc">↑ Asc</button>
        <button class="sort-dir-btn ${r.dir === 'desc' ? 'active' : ''}" data-sort-dir="${i}" data-val="desc">↓ Desc</button>
      </div>
    </div>`).join('')}
    ${sortRules.length < 5 ? `<button class="sort-add-btn" id="sortAddBtn">+ Add sort rule</button>` : ''}
  </div>`;
}

// ── BADGES PAGE ──────────────────────────────
let badgeTab    = 'clubs';
let badgeSearch = '';

const BADGE_TAB_LABELS = { clubs: 'Club', leagues: 'League', nations: 'Nation', design: 'Card Type' };

function buildBadgesPage() {
  const tabs   = ['clubs', 'leagues', 'nations', 'design'];
  const selSet = getBadgeSel();

  // Selected items chips
  const selectedItems = [...getBadgeSel()].map(id => {
    const name = _badgeName(id);
    const img  = getBadgeImg(id);
    const imgEl = img
      ? `<img src="${img}" onerror="this.style.display='none'" alt="" style="width:16px;height:16px;object-fit:contain;border-radius:2px;flex-shrink:0">`
      : '';
    return `<div class="badge-chip" data-badge-remove="${id}">${imgEl}<span>${escHtml(name)}</span><button>×</button></div>`;
  }).join('');

  // Dropdown list — only shown when badgeSearch has content
  const term  = badgeSearch.toLowerCase();
  const items = term
    ? getBadgeData().filter(([, n]) => n.toLowerCase().includes(term))
    : [];

  const dropdownHtml = term ? `
    <div class="badge-dropdown" id="badgeDropdown">
      ${items.length ? items.map(([id, name]) => {
        const sel   = selSet.has(id);
        const img   = getBadgeImg(id);
        const imgEl = img
          ? `<img src="${img}" onerror="this.style.display='none'" alt="">`
          : `<div class="badge-fallback">${name.substring(0,2).toUpperCase()}</div>`;
        return `<div class="fs-select-item ${sel ? 'selected' : ''}" data-badge-id="${id}" data-badge-name="${escHtml(name)}">
          ${imgEl}<span>${escHtml(name)}</span>${sel ? '<div class="fs-select-dot"></div>' : ''}
        </div>`;
      }).join('') : `<div class="badge-no-results">No results</div>`}
    </div>` : '';

  return `
  <div class="page-pad">
    <div class="badge-tabs">
      ${tabs.map(t => `<button class="badge-tab-btn ${badgeTab === t ? 'active' : ''}" data-badge-tab="${t}">${BADGE_TAB_LABELS[t]}</button>`).join('')}
    </div>
    ${selectedItems ? `<div class="badge-chips-row" id="badgeChipsRow">${selectedItems}</div>` : ''}
    <div class="fs-search-wrap badge-search-wrap" style="margin-bottom:0">
      <input class="fs-search-input" id="badgeSearchInput" type="text"
        placeholder="Search ${BADGE_TAB_LABELS[badgeTab]}…" value="${escHtml(badgeSearch)}"
        autocomplete="off">
      <button class="fs-search-clear" id="badgeSearchClear">×</button>
    </div>
    ${dropdownHtml}
  </div>`;
}

function _badgeName(id) {
  if (badgeTab === 'clubs')   return clubIdToName[id]   || id;
  if (badgeTab === 'leagues') return leagueIdToName[id] || id;
  if (badgeTab === 'nations') return nationIdToName[id] || id;
  return window.colorMap?.[id]?.name || id;
}

function getBadgeData() {
  if (badgeTab === 'clubs')   return Object.entries(clubIdToName).sort((a,b) => a[1].localeCompare(b[1]));
  if (badgeTab === 'leagues') return Object.entries(leagueIdToName).sort((a,b) => a[1].localeCompare(b[1]));
  if (badgeTab === 'nations') return Object.entries(nationIdToName).sort((a,b) => a[1].localeCompare(b[1]));
  // design: from colorMap
  const cm = window.colorMap || {};
  return Object.entries(cm).map(([id, d]) => [id, d.name || id]).sort((a,b) => a[1].localeCompare(b[1]));
}

function getBadgeSel() {
  if (badgeTab === 'clubs')   return selectedClubs;
  if (badgeTab === 'leagues') return selectedLeagues;
  if (badgeTab === 'nations') return selectedNations;
  return selectedColors;
}

function getBadgeImg(id) {
  if (badgeTab === 'clubs')   return `https://mf-data.b-cdn.net/26/Badges/Clubs/Small/club_small_${id}.png`;
  if (badgeTab === 'leagues') return `https://mf-data.b-cdn.net/26/Badges/Leagues/Small/league_small_${id}.png`;
  if (badgeTab === 'nations') return `https://mf-data.b-cdn.net/26/Badges/Nations/Small/nation_small_${id}.png`;
  const cm = window.colorMap || {};
  return cm[id]?.url_small || cm[id]?.url_micro || '';
}

// ── POSITIONS PAGE ───────────────────────────
// Row layout: label row + position rows
const POSITION_ROWS = [
  { positions: ['LW', 'ST', 'RW'],       group: 'attack'  },
  { positions: ['LM', 'CAM', 'RM'],       group: 'mid'     },
  { positions: ['CM', 'CB', 'CDM'],       group: 'mid'     },
  { positions: ['LB', 'GK', 'RB'],        group: 'defend'  },
];

const POSITION_GROUPS = {
  attack: ['LW', 'ST', 'RW'],
  mid:    ['LM', 'CAM', 'RM', 'CM', 'CDM'],
  defend: ['LB', 'CB', 'RB', 'GK'],
};

function buildPositionsPage() {
  // Group header highlight state
  const groupMainState = {
    attack: POSITION_GROUPS.attack.every(p => selectedPositions.has(p)),
    mid:    POSITION_GROUPS.mid.every(p => selectedPositions.has(p)),
    defend: POSITION_GROUPS.defend.every(p => selectedPositions.has(p)),
  };
  const groupAltState = {
    attack: POSITION_GROUPS.attack.every(p => selectedAltPositions.has(p)),
    mid:    POSITION_GROUPS.mid.every(p => selectedAltPositions.has(p)),
    defend: POSITION_GROUPS.defend.every(p => selectedAltPositions.has(p)),
  };

  function groupBtnClass(group) {
    const main = groupMainState[group];
    const alt  = groupAltState[group];
    if (positionMode === 'both' && main && alt) return 'pos-group-btn sel-both';
    if (positionMode === 'both' && main)        return 'pos-group-btn sel-main';
    if (positionMode === 'both' && alt)         return 'pos-group-btn sel-alt';
    if (positionMode === 'main' && main)        return 'pos-group-btn sel-main';
    if (positionMode === 'alt'  && alt)         return 'pos-group-btn sel-alt';
    return 'pos-group-btn';
  }

  const rows = POSITION_ROWS.map(row => {
    const btns = row.positions.map(pos => {
      const isMain = selectedPositions.has(pos);
      const isAlt  = selectedAltPositions.has(pos);
      let cls = 'pos-rect-btn';
      if (isMain && isAlt)  cls += ' sel-both';
      else if (isMain)      cls += ' sel-main';
      else if (isAlt)       cls += ' sel-alt';
      return `<button class="${cls}" data-pos="${pos}">${pos}</button>`;
    }).join('');
    return `<div class="pos-row">${btns}</div>`;
  }).join('');

  return `
  <div class="page-pad">
    <div class="pitch-mode-row">
      ${['both','main','alt'].map(m => `
      <button class="pitch-mode-btn ${positionMode === m ? 'active' : ''}" data-pos-mode="${m}">
        ${m === 'both' ? 'Both' : m === 'main' ? 'Main' : 'Alt'}
      </button>`).join('')}
      <div class="pos-info-wrap">
        <div class="pos-info-icon" tabindex="0">i</div>
        <div class="pos-info-tooltip">
          <strong>Main</strong> = position on card &amp; gameplay.<br>
          <strong>Alt</strong> = chemistry only.<br>
          <strong>Both</strong> = match either.<br><br>
          <em>Left fade</em> = main selected.<br>
          <em>Right fade</em> = alt selected.
        </div>
      </div>
    </div>
    <div class="pos-group-header-row">
      <button class="${groupBtnClass('attack')}" data-pos-group="attack">Attackers</button>
      <button class="${groupBtnClass('mid')}"    data-pos-group="mid">Midfielders</button>
      <button class="${groupBtnClass('defend')}" data-pos-group="defend">Defenders</button>
    </div>
    <div class="pos-grid-wrap">
      ${rows}
    </div>
  </div>`;
}
// ── STATS PAGE ───────────────────────────────
const STAT_DEFS = [
  { key: 'PAC',     label: 'Pace',        max: 99,  group: 'card' },
  { key: 'SHO',     label: 'Shooting',    max: 99,  group: 'card' },
  { key: 'PAS',     label: 'Passing',     max: 99,  group: 'card' },
  { key: 'DRI',     label: 'Dribbling',   max: 99,  group: 'card' },
  { key: 'DEF',     label: 'Defending',   max: 99,  group: 'card' },
  { key: 'PHY',     label: 'Physical',    max: 99,  group: 'card' },
  { key: 'attack',  label: 'Attack',      max: 99,  group: 'fatal' },
  { key: 'control', label: 'Control',     max: 99,  group: 'fatal' },
  { key: 'defense', label: 'Defense',     max: 99,  group: 'fatal' },
  { key: 'fcm',     label: 'FCM Meta',    max: 150, group: 'fatal' },
];

const RATING_DEF = { key: 'rating', label: 'Rating', max: 99, group: 'card' };

if (!window.ratingState) window.ratingState = { min: 0, max: 99 };
if (!window.fcmState)    window.fcmState    = { min: 0, max: 150 };

let showStatSliders = false;

function buildStatsPage() {
  const allDefs   = [RATING_DEF, ...STAT_DEFS];
  const cardDefs  = allDefs.filter(d => d.group === 'card');
  const fatalDefs = allDefs.filter(d => d.group === 'fatal');

  return `
  <div class="page-pad">
    <button class="stat-slider-toggle-btn" id="statSliderToggleBtn">
      ${showStatSliders ? '▲ Hide sliders' : '▼ Show sliders'}
    </button>
    <div id="statSlidersWrap" style="display:${showStatSliders ? '' : 'none'}">
      <div class="stats-group-label">Card Stats</div>
      ${cardDefs.map(d => buildStatSlider(d)).join('')}
      <div class="stats-group-label" style="margin-top:6px">Fatal &amp; FCM Stats</div>
      ${fatalDefs.map(d => buildStatSlider(d)).join('')}
    </div>
    <div class="stats-group-label" style="margin-top:${showStatSliders ? '14' : '0'}px">Card Stats</div>
    ${cardDefs.map(d => buildStatNumOnly(d)).join('')}
    <div class="stats-group-label" style="margin-top:6px">Fatal &amp; FCM Stats</div>
    ${fatalDefs.map(d => buildStatNumOnly(d)).join('')}
  </div>`;
}

function buildStatNumOnly({ key, label, max }) {
  const [lo, hi] = getStatState(key);
  return `
  <div class="stat-num-only-row">
    <span class="stat-range-name">${label}</span>
    <div class="stat-num-row" style="margin-top:0">
      <input class="stat-num-input" type="number" min="0" max="${max}" value="${lo}"
        data-num-lo="${key}" data-max="${max}">
      <span class="stat-num-dash">–</span>
      <input class="stat-num-input" type="number" min="0" max="${max}" value="${hi}"
        data-num-hi="${key}" data-max="${max}">
    </div>
  </div>`;
}

function getStatState(key) {
  if (key === 'rating') return [window.ratingState.min, window.ratingState.max];
  if (key === 'fcm')    return [window.fcmState.min,    window.fcmState.max];
  const rules = statFiltersState[key] || [];
  const lo = rules.find(r => r.op === '>=')?.val ?? 0;
  const hi = rules.find(r => r.op === '<=')?.val ?? 99;
  return [lo, hi];
}

function buildStatSlider({ key, label, max }) {
  const [lo, hi] = getStatState(key);
  const pLo = (lo / max) * 100;
  const pHi = (hi / max) * 100;
  return `
  <div class="stat-range-wrap">
    <div class="stat-range-header">
      <span class="stat-range-name">${label}</span>
      <span class="stat-range-vals" id="srv_${key}">${lo} – ${hi}</span>
    </div>
    <div class="range-slider-track-wrap">
      <div class="range-track-bg"></div>
      <div class="range-track-fill" id="srf_${key}" style="left:${pLo}%;width:${pHi - pLo}%"></div>
      <input type="range" class="range-slider-input" min="0" max="${max}" value="${lo}" step="1"
        data-stat-lo="${key}" data-max="${max}" style="z-index:3">
      <input type="range" class="range-slider-input" min="0" max="${max}" value="${hi}" step="1"
        data-stat-hi="${key}" data-max="${max}" style="z-index:4">
    </div>
    <div class="stat-num-row">
      <input class="stat-num-input" type="number" min="0" max="${max}" value="${lo}"
        data-num-lo="${key}" data-max="${max}">
      <span class="stat-num-dash">–</span>
      <input class="stat-num-input" type="number" min="0" max="${max}" value="${hi}"
        data-num-hi="${key}" data-max="${max}">
    </div>
  </div>`;
}

// ── DISPLAY PAGE ─────────────────────────────
function buildDisplayPage() {
  const viewToggles = [
    { key: 'showFCM',       label: 'FCM badge'       },
    { key: 'showFatal',     label: 'Fatal stats'     },
    { key: 'showAltPos',    label: 'Alt positions'   },
    { key: 'showBreakdown', label: 'Meta breakdown'  },
    { key: 'showDownload',  label: 'Download button' },
  ];

  const dlToggles = [
    { key: 'showFCM',       label: 'FCM badge'       },
    { key: 'showFatal',     label: 'Fatal stats'     },
    { key: 'showAltPos',    label: 'Alt positions'   },
    { key: 'showBreakdown', label: 'Meta breakdown'  },
  ];

  return `
  <div class="page-pad">
    <div class="display-mode-row">
      <button class="display-mode-btn ${displayState.viewMode === 'view' ? 'active' : ''}" data-viewmode="view">View</button>
      <button class="display-mode-btn ${displayState.viewMode === 'download' ? 'active' : ''}" data-viewmode="download">Download</button>
    </div>

    <div class="display-panel" id="displayViewPanel" style="${displayState.viewMode === 'view' ? '' : 'display:none'}">
      ${viewToggles.map(({ key, label }) => `
      <div class="display-toggle-row">
        <span class="display-toggle-label">${label}</span>
        <label class="toggle-switch">
          <input type="checkbox" data-display="${key}" ${displayState[key] ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>`).join('')}
    </div>

    <div class="display-panel" id="displayDlPanel" style="${displayState.viewMode === 'download' ? '' : 'display:none'}">
      ${dlToggles.map(({ key, label }) => `
      <div class="display-toggle-row">
        <span class="display-toggle-label">${label}</span>
        <label class="toggle-switch">
          <input type="checkbox" data-download="${key}" ${downloadState[key] ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>`).join('')}
    </div>
  </div>`;
}

// ── MISC PAGE ────────────────────────────────
function buildMiscPage() {
  return `
  <div class="misc-page-wrap">
    <div class="misc-group-label">Availability</div>
    <div class="misc-group">
      ${[
        { key: 'inPacks',    label: 'In Packs',      sub: 'packable = 0'  },
        { key: 'objReward',  label: 'Obj Reward',    sub: 'packable = -1' },
        { key: 'sbcReward',  label: 'SBC Reward',    sub: 'packable = -2' },
        { key: 'cupReward',  label: 'Cup Reward',    sub: 'packable = -3' },
        { key: 'evoReward',  label: 'Evo Reward',    sub: 'packable = -5' },
      ].map(({ key, label }) => `
      <label class="misc-chip-label">
        <input type="checkbox" data-misc="${key}" ${miscState[key] ? 'checked' : ''}>
        <span>${label}</span>
      </label>`).join('')}
    </div>

    <div class="misc-group-label">Obtainability</div>
    <div class="misc-group">
      ${[
        { key: 'inTokens', label: 'Tokens'   },
        { key: 'inPicks',  label: 'In Picks' },
      ].map(({ key, label }) => `
      <label class="misc-chip-label">
        <input type="checkbox" data-misc="${key}" ${miscState[key] ? 'checked' : ''}>
        <span>${label}</span>
      </label>`).join('')}
    </div>

    <div class="misc-group-label">Tradability</div>
    <div class="misc-group">
      <label class="misc-chip-label">
        <input type="checkbox" data-misc="tradable" ${miscState.tradable ? 'checked' : ''}>
        <span>Tradable</span>
      </label>
      <label class="misc-chip-label">
        <input type="checkbox" data-misc="untradeable" ${miscState.untradeable ? 'checked' : ''}>
        <span>Untradeable</span>
      </label>
    </div>

    <div class="misc-group-label">TOTW</div>
    <div class="misc-group">
      <label class="misc-chip-label">
        <input type="checkbox" data-misc="totw" ${miscState.totw ? 'checked' : ''}>
        <span>Is TOTW</span>
      </label>
    </div>
    ${miscState.totw ? `
    <div class="misc-week-row">
      <span class="misc-week-label">Week</span>
      <input class="misc-week-input" type="number" min="1" max="52"
        placeholder="Any" value="${escHtml(miscState.totwWeek)}" id="totwWeekInput">
    </div>` : ''}

    <div class="misc-group-label">Gender</div>
    <div class="misc-group">
      <label class="misc-chip-label">
        <input type="checkbox" data-misc="genderMen" ${miscState.genderMen ? 'checked' : ''}>
        <span>Men</span>
      </label>
      <label class="misc-chip-label">
        <input type="checkbox" data-misc="genderWomen" ${miscState.genderWomen ? 'checked' : ''}>
        <span>Women</span>
      </label>
    </div>

    <div class="misc-group-label">Image</div>
    <div class="misc-group">
      <label class="misc-chip-label">
        <input type="checkbox" data-misc="dynamicImage" ${miscState.dynamicImage ? 'checked' : ''}>
        <span>Dynamic Image</span>
      </label>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────
// Render helpers
// ─────────────────────────────────────────────
function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderPageInto(container, page) {
  if (!container) return;
  container.innerHTML = buildPage(page);
  bindPageEvents(container, page);
}

// ─────────────────────────────────────────────
// Active filter tags
// ─────────────────────────────────────────────
export function updateActiveFilters() {
  const bar       = document.getElementById('activeTagsBar');
  const mobileBar = document.getElementById('mobileActiveTagsBar');
  if (!bar && !mobileBar) return;

  const tags = [];

  selectedClubs.forEach(id => {
    const name = clubIdToName[id] || id;
    tags.push({ text: `Club: ${name}`, remove: () => { selectedClubs.delete(id); triggerFilterAndRefresh(); } });
  });
  selectedLeagues.forEach(id => {
    const name = leagueIdToName[id] || id;
    tags.push({ text: `League: ${name}`, remove: () => { selectedLeagues.delete(id); triggerFilterAndRefresh(); } });
  });
  selectedNations.forEach(id => {
    const name = nationIdToName[id] || id;
    tags.push({ text: `Nation: ${name}`, remove: () => { selectedNations.delete(id); triggerFilterAndRefresh(); } });
  });
  selectedColors.forEach(c => {
    if (c.toLowerCase() === 'default') return;
    const name = window.colorMap?.[c]?.name || c;
    tags.push({ text: `Type: ${name}`, remove: () => { selectedColors.delete(c); triggerFilterAndRefresh(); } });
  });
  selectedPositions.forEach(p => {
    tags.push({ text: `Pos: ${p}`, remove: () => { selectedPositions.delete(p); triggerFilterAndRefresh(); } });
  });

  // Rating
  const rMin = window.ratingState?.min ?? 0;
  const rMax = window.ratingState?.max ?? 99;
  if (rMin > 0 || rMax < 99) {
    tags.push({ text: `Rating: ${rMin}–${rMax}`, remove: () => {
      window.ratingState.min = 0; window.ratingState.max = 99;
      triggerFilterAndRefresh();
    }});
  }

  // FCM
  const fMin = window.fcmState?.min ?? 0;
  const fMax = window.fcmState?.max ?? 150;
  if (fMin > 0 || fMax < 150) {
    tags.push({ text: `FCM: ${fMin}–${fMax}`, remove: () => {
      window.fcmState.min = 0; window.fcmState.max = 150;
      triggerFilterAndRefresh();
    }});
  }

  // Stat filters
  STAT_KEYS.forEach(stat => {
    const rules = statFiltersState[stat] || [];
    const lo = rules.find(r => r.op === '>=');
    const hi = rules.find(r => r.op === '<=');
    const hasLo = lo && lo.val > 0;
    const hasHi = hi && hi.val < 99;
    if (hasLo || hasHi) {
      const loV = lo?.val ?? 0;
      const hiV = hi?.val ?? 99;
      tags.push({ text: `${stat.toUpperCase()}: ${loV}–${hiV}`, remove: () => {
        statFiltersState[stat] = [];
        triggerFilterAndRefresh();
      }});
    }
  });

const tagHTML = tags.map((t, i) =>
    `<div class="a-tag" data-tag="${i}">${escHtml(t.text)}<button data-tag-remove="${i}">×</button></div>`
  ).join('') + `<button class="clear-all-tags" id="clearAllTagsBtn">Clear all</button>`;

  const emptyHTML = '<span class="no-filters-hint">No filters active</span>';

  [bar, mobileBar].forEach(b => {
    if (!b) return;
    b.innerHTML = tags.length === 0 ? emptyHTML : tagHTML;
    b.querySelectorAll('[data-tag-remove]').forEach(btn => {
      const i = parseInt(btn.dataset.tagRemove);
      btn.addEventListener('click', () => tags[i].remove());
    });
    b.querySelector('#clearAllTagsBtn')?.addEventListener('click', clearAllFilters);
  });

  if (tags.length === 0) { updateMobileBadge(0); return; }
  updateMobileBadge(tags.length);
}

function updateMobileBadge(count) {
  const badge = document.getElementById('mobileFabBadge');
  if (!badge) return;
  badge.style.display = count > 0 ? 'block' : 'none';
  badge.textContent = count;
}

function triggerFilterAndRefresh() {
  triggerFilter();
  updateActiveFilters();
  // Re-render desktop single-page sidebar
  if (sidebarBody) renderAllSections(sidebarBody);
  renderPageInto(sheetBody, mobilePage);
}

// ─────────────────────────────────────────────
// Stat update helpers
// ─────────────────────────────────────────────
function applyStatLo(key, rawVal, max) {
  const hi  = getStatState(key)[1];
  const val = Math.max(0, Math.min(parseInt(rawVal) || 0, hi));
  _setStatLo(key, val, max);
}

function applyStatHi(key, rawVal, max) {
  const lo  = getStatState(key)[0];
  const val = Math.max(lo, Math.min(parseInt(rawVal) || max, max));
  _setStatHi(key, val, max);
}

function _setStatLo(key, val, max) {
  if (key === 'rating') { window.ratingState.min = val; }
  else if (key === 'fcm') { window.fcmState.min = val; }
  else {
    if (!statFiltersState[key]) statFiltersState[key] = [];
    const arr = statFiltersState[key];
    const idx = arr.findIndex(r => r.op === '>=');
    if (idx >= 0) arr[idx].val = val; else arr.push({ op: '>=', val });
  }
  refreshStatUI(key, max);
  triggerFilter();
  updateActiveFilters();
}

function _setStatHi(key, val, max) {
  if (key === 'rating') { window.ratingState.max = val; }
  else if (key === 'fcm') { window.fcmState.max = val; }
  else {
    if (!statFiltersState[key]) statFiltersState[key] = [];
    const arr = statFiltersState[key];
    const idx = arr.findIndex(r => r.op === '<=');
    if (idx >= 0) arr[idx].val = val; else arr.push({ op: '<=', val });
  }
  refreshStatUI(key, max);
  triggerFilter();
  updateActiveFilters();
}

function refreshStatUI(key, max) {
  const [lo, hi] = getStatState(key);
  const pLo = (lo / max) * 100;
  const pHi = (hi / max) * 100;

  [sidebarBody, sheetBody].forEach(container => {
    if (!container) return;
    const rv  = container.querySelector(`#srv_${key}`);
    const rf  = container.querySelector(`#srf_${key}`);
    const los = container.querySelectorAll(`[data-stat-lo="${key}"], [data-num-lo="${key}"]`);
    const his = container.querySelectorAll(`[data-stat-hi="${key}"], [data-num-hi="${key}"]`);
    if (rv) rv.textContent = `${lo} – ${hi}`;
    if (rf) { rf.style.left = pLo + '%'; rf.style.width = (pHi - pLo) + '%'; }
    los.forEach(el => { el.value = lo; });
    his.forEach(el => { el.value = hi; });
  });
}

// ─────────────────────────────────────────────
// Bind events for a rendered page
// ─────────────────────────────────────────────
function bindPageEvents(container, page) {
  if (!container) return;

  // ── Search page ──
  if (page === 'search') {
    const inp = container.querySelector('#desktopSearchInput');
    const clr = container.querySelector('#desktopSearchClear');
    if (inp) {
      inp.addEventListener('input', e => {
        window._currentSearch = e.target.value;
        if (mobileSearch) mobileSearch.value = e.target.value;
        triggerFilter();
        updateActiveFilters();
      });
    }
    if (clr) {
      clr.addEventListener('click', () => {
        if (inp) inp.value = '';
        window._currentSearch = '';
        if (mobileSearch) mobileSearch.value = '';
        triggerFilter();
        updateActiveFilters();
      });
    }
    // DB filter checkboxes — update selectedDbs state, then trigger filter
    container.querySelectorAll('.db-filter').forEach(cb => {
      cb.addEventListener('change', e => {
        if (e.target.checked) {
          selectedDbs.add(e.target.value);
        } else {
          selectedDbs.delete(e.target.value);
        }
        triggerFilter();
        updateActiveFilters();
      });
    });
  }

  // ── Sort page ──
  if (page === 'sort') {
    container.querySelectorAll('[data-sort-field]').forEach(sel => {
      sel.addEventListener('change', e => {
        const i = parseInt(e.target.dataset.sortField);
        sortRules[i].field = e.target.value;
        triggerFilter();
      });
    });
    container.querySelectorAll('[data-sort-dir]').forEach(btn => {
      btn.addEventListener('click', e => {
        const i   = parseInt(e.currentTarget.dataset.sortDir);
        const val = e.currentTarget.dataset.val;
        sortRules[i].dir = val;
        container.querySelectorAll(`[data-sort-dir="${i}"]`).forEach(b => {
          b.classList.toggle('active', b.dataset.val === val);
        });
        triggerFilter();
      });
    });
    container.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', e => {
        const i = parseInt(e.currentTarget.dataset.remove);
        sortRules.splice(i, 1);
        renderPageInto(container, 'sort');
        triggerFilter();
      });
    });
    container.querySelector('#sortAddBtn')?.addEventListener('click', () => {
      sortRules.push({ field: 'rating', dir: 'desc' });
      renderPageInto(container, 'sort');
    });
  }

  // ── Badges page ──
if (page === 'badges') {
    container.querySelectorAll('[data-badge-tab]').forEach(btn => {
      btn.addEventListener('click', e => {
        badgeTab    = e.currentTarget.dataset.badgeTab;
        badgeSearch = '';
        renderPageInto(container, 'badges');
      });
    });

    const bSearchInp = container.querySelector('#badgeSearchInput');
    const bSearchClr = container.querySelector('#badgeSearchClear');

    if (bSearchInp) {
      bSearchInp.addEventListener('input', e => {
        badgeSearch = e.target.value;
        // Re-render just the dropdown area
        const existing = container.querySelector('#badgeDropdown');
        const wrap     = container.querySelector('.badge-search-wrap');
        if (existing) existing.remove();

        const term  = badgeSearch.toLowerCase();
        const selSet = getBadgeSel();
        const items  = term ? getBadgeData().filter(([, n]) => n.toLowerCase().includes(term)) : [];

        if (term) {
          const dropdown = document.createElement('div');
          dropdown.className = 'badge-dropdown';
          dropdown.id        = 'badgeDropdown';
          dropdown.innerHTML = items.length ? items.map(([id, name]) => {
            const sel   = selSet.has(id);
            const img   = getBadgeImg(id);
            const imgEl = img
              ? `<img src="${img}" onerror="this.style.display='none'" alt="">`
              : `<div class="badge-fallback">${name.substring(0,2).toUpperCase()}</div>`;
            return `<div class="fs-select-item ${sel ? 'selected' : ''}" data-badge-id="${id}" data-badge-name="${escHtml(name)}">
              ${imgEl}<span>${escHtml(name)}</span>${sel ? '<div class="fs-select-dot"></div>' : ''}
            </div>`;
          }).join('') : `<div class="badge-no-results">No results</div>`;
          wrap?.insertAdjacentElement('afterend', dropdown);
          bindBadgeItems(container);
        }
      });
    }

    if (bSearchClr) {
      bSearchClr.addEventListener('click', () => {
        badgeSearch = '';
        if (bSearchInp) bSearchInp.value = '';
        renderPageInto(container, 'badges');
      });
    }

    // Chip remove buttons
    container.querySelectorAll('[data-badge-remove]').forEach(chip => {
      chip.addEventListener('click', e => {
        const id  = e.currentTarget.dataset.badgeRemove;
        const sel = getBadgeSel();
        sel.delete(id);
        renderPageInto(container, 'badges');
        triggerFilter();
        updateActiveFilters();
      });
    });

    bindBadgeItems(container);
  }

if (page === 'positions') {
// Mode buttons — only changes what future clicks do, never clears selections
    container.querySelectorAll('[data-pos-mode]').forEach(btn => {
      btn.addEventListener('click', e => {
        positionMode = e.currentTarget.dataset.posMode;
        _refreshPositionPage();
        // No triggerFilter here — selections unchanged, just UI mode
      });
    });

    // Individual position buttons — always toggle both main and alt independently
    container.querySelectorAll('.pos-rect-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const pos = e.currentTarget.dataset.pos;
        if (positionMode === 'main') {
          if (selectedPositions.has(pos)) selectedPositions.delete(pos);
          else selectedPositions.add(pos);
        } else if (positionMode === 'alt') {
          if (selectedAltPositions.has(pos)) selectedAltPositions.delete(pos);
          else selectedAltPositions.add(pos);
} else {
          // 'both' — toggle main set; alt set is untouched
          // User switches to 'alt' mode to independently set alt positions
          if (selectedPositions.has(pos)) selectedPositions.delete(pos);
          else selectedPositions.add(pos);
        }
        _refreshPositionPage();
        triggerFilter();
        updateActiveFilters();
      });
    });

    // Group header buttons
    container.querySelectorAll('[data-pos-group]').forEach(btn => {
      btn.addEventListener('click', e => {
        const group = e.currentTarget.dataset.posGroup;
        const positions = POSITION_GROUPS[group];
        const allMain = positions.every(p => selectedPositions.has(p));
        const allAlt  = positions.every(p => selectedAltPositions.has(p));

        if (positionMode === 'main') {
          if (allMain) positions.forEach(p => selectedPositions.delete(p));
          else         positions.forEach(p => selectedPositions.add(p));
        } else if (positionMode === 'alt') {
          if (allAlt) positions.forEach(p => selectedAltPositions.delete(p));
          else        positions.forEach(p => selectedAltPositions.add(p));
} else {
          // both mode — only affects main set
          if (allMain) positions.forEach(p => selectedPositions.delete(p));
          else         positions.forEach(p => selectedPositions.add(p));
        }
        _refreshPositionPage();
        triggerFilter();
        updateActiveFilters();
      });
    });
  }


  function _refreshPositionPage() {
  if (sidebarBody) renderAllSections(sidebarBody);
  if (sheetBody)   renderMobileSheet();
}

  // ── Stats page ──
if (page === 'stats') {
    container.querySelector('#statSliderToggleBtn')?.addEventListener('click', () => {
      showStatSliders = !showStatSliders;
      if (sidebarBody) renderAllSections(sidebarBody);
      if (sheetBody)   renderMobileSheet();
    });
    container.querySelectorAll('[data-stat-lo]').forEach(inp => {
      inp.addEventListener('input', e => {
        applyStatLo(e.target.dataset.statLo, e.target.value, parseInt(e.target.dataset.max));
      });
    });
    container.querySelectorAll('[data-stat-hi]').forEach(inp => {
      inp.addEventListener('input', e => {
        applyStatHi(e.target.dataset.statHi, e.target.value, parseInt(e.target.dataset.max));
      });
    });
    container.querySelectorAll('[data-num-lo]').forEach(inp => {
      inp.addEventListener('change', e => {
        applyStatLo(e.target.dataset.numLo, e.target.value, parseInt(e.target.dataset.max));
      });
    });
    container.querySelectorAll('[data-num-hi]').forEach(inp => {
      inp.addEventListener('change', e => {
        applyStatHi(e.target.dataset.numHi, e.target.value, parseInt(e.target.dataset.max));
      });
    });
  }

  // ── Display page ──
if (page === 'display') {
    // View/Download tab switcher
    container.querySelectorAll('[data-viewmode]').forEach(btn => {
      btn.addEventListener('click', e => {
        displayState.viewMode = e.currentTarget.dataset.viewmode;
        container.querySelectorAll('[data-viewmode]').forEach(b =>
          b.classList.toggle('active', b.dataset.viewmode === displayState.viewMode)
        );
        const viewPanel = container.querySelector('#displayViewPanel');
        const dlPanel   = container.querySelector('#displayDlPanel');
        if (viewPanel) viewPanel.style.display = displayState.viewMode === 'view'     ? '' : 'none';
        if (dlPanel)   dlPanel.style.display   = displayState.viewMode === 'download' ? '' : 'none';
      });
    });

    // View toggles — affect what you see on screen
    container.querySelectorAll('[data-display]').forEach(inp => {
      inp.addEventListener('change', e => {
        displayState[e.target.dataset.display] = e.target.checked;
        applyDisplayState();
      });
    });

    // Download toggles — stored separately, used at capture time
    container.querySelectorAll('[data-download]').forEach(inp => {
      inp.addEventListener('change', e => {
        downloadState[e.target.dataset.download] = e.target.checked;
      });
    });
  }

  // ── Misc page ──
if (page === 'misc') {
    container.querySelectorAll('[data-misc]').forEach(inp => {
      inp.addEventListener('change', e => {
        miscState[e.target.dataset.misc] = e.target.checked;
        // Re-render to show/hide TOTW week input
        if (e.target.dataset.misc === 'totw') {
          if (sidebarBody) renderAllSections(sidebarBody);
          if (sheetBody)   renderMobileSheet();
        }
        triggerFilter();
        updateActiveFilters();
      });
    });
    container.querySelector('#totwWeekInput')?.addEventListener('input', e => {
      miscState.totwWeek = e.target.value;
      triggerFilter();
      updateActiveFilters();
    });
  }
}

function bindBadgeItems(container) {
  container.querySelectorAll('[data-badge-id]').forEach(item => {
    item.addEventListener('click', e => {
      const id   = e.currentTarget.dataset.badgeId;
      const name = e.currentTarget.dataset.badgeName;
      const sel  = getBadgeSel();
      if (sel.has(id)) sel.delete(id);
      else { sel.add(id); showToast(`${name} added`); }
      renderPageInto(container, 'badges');
      triggerFilter();
      updateActiveFilters();
    });
  });
}

// ─────────────────────────────────────────────
// Apply display state to DOM
// ─────────────────────────────────────────────
function applyDisplayState() {
  document.querySelectorAll('.download-btn').forEach(btn => {
    btn.style.display = displayState.showDownload ? 'flex' : 'none';
  });
  window.showDownloadBtn = displayState.showDownload;

  document.querySelectorAll('.fatal-meta-badge').forEach(el => {
    el.style.display = displayState.showFCM ? '' : 'none';
  });

  document.querySelectorAll('.fatals').forEach(el => {
    el.style.display = displayState.showFatal ? '' : 'none';
  });

  document.querySelectorAll('.alt-positions').forEach(el => {
    el.style.display = displayState.showAltPos ? '' : 'none';
  });

  document.querySelectorAll('.fcm-breakdown').forEach(el => {
    el.style.display = displayState.showBreakdown ? '' : 'none';
  });
  window.showBreakdown = displayState.showBreakdown;
}
// ─────────────────────────────────────────────
// Clear all filters
// ─────────────────────────────────────────────
export function clearAllFilters() {
  // Reset db sources back to all selected
  selectedDbs.clear();
  ALL_DB_SOURCES.forEach(s => selectedDbs.add(s));

  selectedClubs.clear();
  selectedLeagues.clear();
  selectedNations.clear();
  selectedColors.clear();
  selectedPositions.clear();
  selectedAltPositions.clear();

  window.ratingState = { min: 0, max: 99 };
  window.fcmState    = { min: 0, max: 150 };

  STAT_KEYS.forEach(k => { statFiltersState[k] = []; });

  if (window._currentSearch !== undefined) {
    window._currentSearch = '';
    document.querySelectorAll('.fs-search-input, .mobile-search-input').forEach(inp => { inp.value = ''; });
  }

sortRules.length = 0;
sortRules.push({ field: 'date', dir: 'desc' });
triggerFilter();
  updateActiveFilters();
  if (sidebarBody) renderAllSections(sidebarBody);
  renderPageInto(sheetBody, mobilePage);
}

// ─────────────────────────────────────────────
// Rebuild helpers (called from Card.js after data loads)
// ─────────────────────────────────────────────
export function rebuildClubLeagueNationLists() {
  // Built on-demand in the badges page
}

export function rebuildColorFilterOptions() {
  // Built on-demand in badges page
}

export function buildPositionList() {
  if (sidebarBody) renderAllSections(sidebarBody);
  if (sheetBody && mobilePage === 'positions') renderPageInto(sheetBody, 'positions');
}

export function buildAltPositionList() { buildPositionList(); }

export function rebuildStatFiltersUI() {
  if (sidebarBody) renderAllSections(sidebarBody);
  if (sheetBody && mobilePage === 'stats') renderPageInto(sheetBody, 'stats');
}

export function initRatingSlider() {
  if (sidebarBody) renderAllSections(sidebarBody);
  if (sheetBody && mobilePage === 'stats') renderPageInto(sheetBody, 'stats');
}

// ─────────────────────────────────────────────
// Desktop sidebar page switching
// ─────────────────────────────────────────────
function switchDesktopPage(page) {
  desktopPage = page;
  document.querySelectorAll('.filter-sidebar .fpn-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });
  renderPageInto(sidebarBody, page);
}

function switchMobilePage(page) {
  mobilePage = page;
  document.querySelectorAll('.mobile-filter-sheet .fpn-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });
  renderPageInto(sheetBody, page);
}

// ─────────────────────────────────────────────
// Mobile sheet open / close
// ─────────────────────────────────────────────
function openSheet() {
  if (mobileSheet) {
    mobileSheet.classList.add('open');
    renderMobileSheet();
  }
}

// Tracks which mobile sections the user has manually expanded — persists across re-opens
const _mobileExpandedSections = new Set(['search']); // search open by default

function renderMobileSheet() {
  if (!sheetBody) return;
  const pages  = ['search','sort','badges','positions','stats','display','misc'];
  const labels = { search:'Search', sort:'Sort', badges:'Card Elements', positions:'Positions', stats:'Stats', display:'Display', misc:'Misc' };

  sheetBody.innerHTML = pages.map(page => {
    const isCollapsed = !_mobileExpandedSections.has(page);
    return `
      <div class="filter-section-wrapper" data-section="${page}">
        <div class="filter-section-header ${isCollapsed ? 'collapsed' : ''}" data-section-toggle="${page}">
          <span class="filter-section-title-text">${labels[page]}</span>
          <span class="filter-section-chevron">▼</span>
        </div>
        <div class="filter-section-content ${isCollapsed ? 'collapsed' : ''}" data-section-body="${page}"
          style="max-height: ${isCollapsed ? '0' : '2000px'}">
          ${buildPage(page)}
        </div>
      </div>`;
  }).join('');

  // Bind collapse toggles — update the persistent set
  sheetBody.querySelectorAll('[data-section-toggle]').forEach(header => {
    header.addEventListener('click', () => {
      const page = header.dataset.sectionToggle;
      const body = sheetBody.querySelector(`[data-section-body="${page}"]`);
      const isNowCollapsed = header.classList.toggle('collapsed');
      body.classList.toggle('collapsed', isNowCollapsed);
      body.style.maxHeight = isNowCollapsed ? '0' : '2000px';
      if (isNowCollapsed) _mobileExpandedSections.delete(page);
      else _mobileExpandedSections.add(page);
    });
  });

  // Bind all page events
  pages.forEach(page => {
    const sectionBody = sheetBody.querySelector(`[data-section-body="${page}"]`);
    if (sectionBody) bindPageEvents(sectionBody, page);
  });
}

function closeSheet() {
  mobileSheet?.classList.remove('open');
}

// ─────────────────────────────────────────────
// Build sidebar and mobile sheet HTML into DOM
// ─────────────────────────────────────────────
function buildFilterSidebarDOM() {
  const pages  = ['search','sort','badges','positions','stats','display','misc'];
  const labels = { search:'Search', sort:'Sort', badges:'Badges', positions:'Positions', stats:'Stats', display:'Display', misc:'Misc' };

  // Ensure active tags bar exists
  const tagsBar = document.getElementById('activeTagsBar');
  if (!tagsBar) {
    const bar = document.createElement('div');
    bar.className = 'active-tags-bar';
    bar.id        = 'activeTagsBar';
    bar.innerHTML = '<span class="no-filters-hint">No filters active</span>';
    const sidebar = document.querySelector('.filter-sidebar');
    if (sidebar) sidebar.prepend(bar);
  }

  // Hide the tab nav (single-page mode)
  const nav = document.querySelector('.filter-sidebar .filter-page-nav');
  if (nav) nav.style.display = 'none';

  // Build single scrollable body with all sections stacked
  sidebarBody = document.querySelector('.filter-sidebar-body') || document.getElementById('sidebarBodyEl');
  if (!sidebarBody) {
    sidebarBody = document.createElement('div');
    sidebarBody.className = 'filter-sidebar-body';
    document.querySelector('.filter-sidebar')?.appendChild(sidebarBody);
  }

  // Render all sections at once
  renderAllSections(sidebarBody);
}

function renderAllSections(container) {
  if (!container) return;
  const pages  = ['search','sort','badges','positions','stats','display','misc'];
  const labels = { search:'Search', sort:'Sort', badges:'Badges', positions:'Positions', stats:'Stats', display:'Display', misc:'Misc' };
  const collapsed = container._collapsedSections || new Set();
  container._collapsedSections = collapsed;

  container.innerHTML = pages.map(page => {
    const isCollapsed = collapsed.has(page);
    return `
      <div class="filter-section-wrapper" data-section="${page}">
        <div class="filter-section-header ${isCollapsed ? 'collapsed' : ''}" data-section-toggle="${page}">
          <span class="filter-section-title-text">${labels[page]}</span>
          <span class="filter-section-chevron">▼</span>
        </div>
        <div class="filter-section-content ${isCollapsed ? 'collapsed' : ''}" data-section-body="${page}"
          style="max-height: ${isCollapsed ? '0' : '2000px'}">
          ${buildPage(page)}
        </div>
      </div>`;
  }).join('');

  // Bind collapse toggles
  container.querySelectorAll('[data-section-toggle]').forEach(header => {
    header.addEventListener('click', () => {
      const page = header.dataset.sectionToggle;
      const body = container.querySelector(`[data-section-body="${page}"]`);
      const isNowCollapsed = header.classList.toggle('collapsed');
      body.classList.toggle('collapsed', isNowCollapsed);
      body.style.maxHeight = isNowCollapsed ? '0' : '2000px';
      if (isNowCollapsed) collapsed.add(page); else collapsed.delete(page);
    });
  });

  // Bind all page events for each section
  pages.forEach(page => {
    const sectionBody = container.querySelector(`[data-section-body="${page}"]`);
    if (sectionBody) bindPageEvents(sectionBody, page);
  });
}

function buildMobileSheetDOM() {
  const pages  = ['search','sort','badges','positions','stats','display','misc'];
  const labels = { search:'Search', sort:'Sort', badges:'Badges', positions:'Positions', stats:'Stats', display:'Display', misc:'Misc' };

  // Find or create mobile bar
  let bar = document.querySelector('.mobile-filter-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'mobile-filter-bar';
bar.innerHTML = `
      <div class="mobile-search-row">
        <input class="mobile-search-input" type="text" placeholder="Search player name…" id="mobileSearchInput">
        <div style="position:relative;flex-shrink:0">
          <button class="mobile-filter-fab" id="mobileFabBtn">
            <svg width="20" height="20" fill="none" stroke="#000" stroke-width="2.5" viewBox="0 0 24 24">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
            </svg>
          </button>
          <div class="mobile-fab-badge" id="mobileFabBadge"></div>
        </div>
      </div>`;
    // Position the bar to align with the sheet footer Apply button
    bar.style.bottom = '80px';
    document.body.appendChild(bar);
  }

  mobileSearch = document.getElementById('mobileSearchInput');
  if (mobileSearch) {
    mobileSearch.addEventListener('input', e => {
      window._currentSearch = e.target.value;
      const ds = document.getElementById('desktopSearchInput');
      if (ds) ds.value = e.target.value;
      triggerFilter();
      updateActiveFilters();
    });
  }

  document.getElementById('mobileFabBtn')?.addEventListener('click', openSheet);

  let touchStartY = 0;
  bar.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
  bar.addEventListener('touchmove', e => {
    if (touchStartY - e.touches[0].clientY > 50) openSheet();
  }, { passive: true });

  // Create mobile sheet
  mobileSheet = document.querySelector('.mobile-filter-sheet');
  if (!mobileSheet) {
    mobileSheet = document.createElement('div');
    mobileSheet.className = 'mobile-filter-sheet';
    mobileSheet.id        = 'mobileFilterSheet';

    const navBtns = pages.map(p =>
      `<button class="fpn-btn ${p === 'search' ? 'active' : ''}" data-page="${p}">${labels[p]}</button>`
    ).join('');

mobileSheet.innerHTML = `
      <div class="sheet-top-nav">
        <span class="sheet-title">Filters</span>
      </div>
      <div class="mobile-active-tags-bar" id="mobileActiveTagsBar">
        <span class="no-filters-hint">No filters active</span>
      </div>
      <div class="filter-page-nav sheet-page-nav" id="sheetPageNav">${navBtns}</div>
      <div class="sheet-body" id="sheetBodyEl"></div>
      <div class="sheet-footer">
        <button class="sheet-reset-btn" id="sheetResetBtn">Reset</button>
        <button class="sheet-apply-btn" id="sheetApplyBtn">Apply Filters</button>
      </div>`;
    document.body.appendChild(mobileSheet);
  }

  sheetBody = document.getElementById('sheetBodyEl');

  document.getElementById('sheetApplyBtn')?.addEventListener('click', closeSheet);
  document.getElementById('sheetResetBtn')?.addEventListener('click', clearAllFilters);
  document.getElementById('sheetDragHandle')?.addEventListener('click', closeSheet);

document.getElementById('sheetPageNav')?.querySelectorAll('.fpn-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      const header = sheetBody?.querySelector(`[data-section-toggle="${page}"]`);
      if (header) {
        const isCollapsed = header.classList.contains('collapsed');
        if (isCollapsed) header.click(); // expand it
        header.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

// Swipe-down to close ONLY on the drag handle, not the scrollable body
  let sheetTouchY = 0;
  const dragHandle = document.getElementById('sheetDragHandle');
  dragHandle?.addEventListener('touchstart', e => { sheetTouchY = e.touches[0].clientY; }, { passive: true });
  dragHandle?.addEventListener('touchmove', e => {
    if (e.touches[0].clientY - sheetTouchY > 40) closeSheet();
  }, { passive: true });
}

// ─────────────────────────────────────────────
// Sidebar toggle (desktop)
// ─────────────────────────────────────────────
export function toggleFilterNav() {
  const sidebar = document.querySelector('.filter-sidebar');
  const main    = document.getElementById('main-content');
  if (!sidebar) return;
  sidebar.classList.toggle('visible');
  const isVisible = sidebar.classList.contains('visible');
  main?.classList.toggle('filter-nav-hidden', !isVisible);
  main?.classList.toggle('sidebar-open', isVisible);
}

export function initFilterSidebar() {
  const sidebar = document.querySelector('.filter-sidebar');
  const main    = document.getElementById('main-content');
  if (!sidebar) return;
  if (window.innerWidth > 768) {
    sidebar.classList.add('visible');
    main?.classList.remove('filter-nav-hidden');
    main?.classList.add('sidebar-open');
  } else {
    sidebar.classList.remove('visible');
    main?.classList.add('filter-nav-hidden');
    main?.classList.remove('sidebar-open');
  }
}

// ─────────────────────────────────────────────
// DOMContentLoaded bootstrap
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initFilterSidebar();
  buildFilterSidebarDOM();
  buildMobileSheetDOM();
  window._downloadState  = downloadState;
  window._applyDisplay   = applyDisplayState;
  // Apply immediately so defaults take effect before cards render
  applyDisplayState();

  document.getElementById('toggleFilterBtn')?.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      openSheet();
    } else {
      toggleFilterNav();
    }
  });

  updateActiveFilters();
});