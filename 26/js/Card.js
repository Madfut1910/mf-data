import { clubIdToName, leagueIdToName, nationIdToName } from './Mappings.js';

let selectedClubs        = new Set();
let selectedLeagues      = new Set();
let selectedNations      = new Set();
let selectedColors       = new Set();
let selectedPositions    = new Set();
let selectedAltPositions = new Set();
let positionMode         = 'both';
let statFiltersState     = {};
let STAT_KEYS            = ['PAC','SHO','PAS','DRI','DEF','PHY','attack','control','defense'];
let sortRules            = [{ field: 'date', dir: 'desc' }];
let displayState         = { showDownload:true, showFatal:true, showAltPos:true, viewMode:'view' };
let downloadState        = { showFatal:true, showAltPos:true };
let miscState            = { inPacks:false, objReward:false, sbcReward:false, cupReward:false, evoReward:false, inTokens:false, inPicks:false, tradable:false, untradeable:false, totw:false, totwWeek:'', genderMen:false, genderWomen:false, dynamicImage:false };
let uniqueColors         = [];
let selectedDbs          = new Set(['updates','sbcGroups','objectives','evosElite','draftCups','ltm','livePlayers','realmExport']);

let setUniqueColors      = c => { uniqueColors = c; };
let normalise            = str => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
let updateActiveFilters  = () => {};
let initFilterSidebar    = () => {};
let toggleFilterNav      = () => {};
let clearAllFilters      = () => {};
let rebuildClubLeagueNationLists = () => {};
let rebuildColorFilterOptions    = () => {};
let buildPositionList    = () => {};
let buildAltPositionList = () => {};
let rebuildStatFiltersUI = () => {};
let initRatingSlider     = () => {};

// ─────────────────────────────────────────────
// PAGE MODE — set window.PAGE_MODE = 'livePlayers' in the HTML
// to enable Live Players mode. Default = 'all'.
// ─────────────────────────────────────────────
const PAGE_MODE   = window.PAGE_MODE || 'all';
const IS_LIVE_PAGE = PAGE_MODE === 'livePlayers';

const container = document.getElementById('card-container');

let allPlayers        = [];
let remoteCardDesigns = [];

// Expose globals that Filter.js reads back
window._allPlayers    = allPlayers;
window._filterAndSort = filterAndSort;
window._cardShowToast = showToast;
window._currentSearch = '';

// ─────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────
function showToast(message) {
  const toastContainer = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className  = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ─────────────────────────────────────────────
// Database URLs
// ─────────────────────────────────────────────
const databases = {
  updates:     'https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents/updates/',
  sbcGroups:   'https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents/sbcGroups/',
  objectives:  'https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents/objectives/',
  evosElite:   'https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents/evosElite/',
  draftCups:   'https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents/draftCups/',
  ltm:         'json/LtmCards.json',
  livePlayers: 'https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents/livePlayers/',
  realmExport: 'json/realmExport.json'
};

const singleDocumentDatabases = ['realmExport', 'ltm'];

let colorMap = {};

// ─────────────────────────────────────────────
// Pagination state
// ─────────────────────────────────────────────
const CARDS_PER_PAGE = 100;
let currentPage      = 1;
let playersToRender  = [];
let totalPages       = 1;
let isRendering      = false;

// ─────────────────────────────────────────────
// Filter & sort  (state imported from Filter.js)
// ─────────────────────────────────────────────
function filterAndSort() {
  const query = normalise(window._currentSearch || '');

  const activeDbs = IS_LIVE_PAGE
    ? ['livePlayers']
    : Array.from(selectedDbs);

  const minRating = window.ratingState?.min ?? 0;
  const maxRating = window.ratingState?.max ?? 99;

  let filtered = allPlayers.filter(player => {
    const fields = player?.mapValue?.fields || {};

    // ── Database source filter ──
    if (!activeDbs.includes(player.database)) return false;

    // ── Name search with accent normalisation ──
    const name = normalise(fields?.name?.stringValue || '');
    if (query && !name.includes(query)) return false;

    // ── Clubs / Leagues / Nations ──
    const clubId   = String(fields.clubId?.integerValue   || '');
    const leagueId = String(fields.leagueId?.integerValue || '');
    const nationId = String(fields.nationId?.integerValue || '');
    if (selectedClubs.size   > 0 && !selectedClubs.has(clubId))     return false;
    if (selectedLeagues.size > 0 && !selectedLeagues.has(leagueId)) return false;
    if (selectedNations.size > 0 && !selectedNations.has(nationId)) return false;

    // ── Card type / color ──
    const colorVal = (fields.color?.stringValue || '').trim().toLowerCase();
    if (selectedColors.size > 0 && !selectedColors.has(colorVal)) return false;

    // ── Positions (3-mode: both / main / alt) ──
    if (selectedPositions.size > 0) {
      const mainPos = (fields.position?.stringValue || '').toUpperCase().trim();
      const altRaw  = (fields.altPositions?.stringValue || '').toUpperCase();
      const altSet  = new Set(altRaw.split(',').map(s => s.trim()).filter(Boolean));

      let match = false;
      for (const pos of selectedPositions) {
        const p = pos.toUpperCase();
        if (positionMode === 'main' && mainPos === p)                     { match = true; break; }
        if (positionMode === 'alt'  && altSet.has(p))                     { match = true; break; }
        if (positionMode === 'both' && (mainPos === p || altSet.has(p))) { match = true; break; }
      }
      if (!match) return false;
    }

    // ── Rating ──
    const rating = parseInt(fields.rating?.integerValue || 0);
    if (rating < minRating || rating > maxRating) return false;

    // ── Stat filters ──
    for (const stat of STAT_KEYS) {
      const rules = statFiltersState[stat] || [];
      if (!rules.length) continue;
      const val = parseInt(fields[stat]?.integerValue ?? 0);
      for (const r of rules) {
        if (r.op === '>=' && val < r.val) return false;
        if (r.op === '<=' && val > r.val) return false;
        if (r.op === '='  && val !== r.val) return false;
      }
    }

    // ── Misc: packable ──
    const packable = parseInt(fields.packable?.integerValue ?? 999);
    const anyPackFilter = miscState.inPacks || miscState.objReward || miscState.sbcReward || miscState.cupReward || miscState.evoReward;
    if (anyPackFilter) {
      const match =
        (miscState.inPacks   && packable === 0)  ||
        (miscState.objReward && packable === -1) ||
        (miscState.sbcReward && packable === -2) ||
        (miscState.cupReward && packable === -3) ||
        (miscState.evoReward && packable === -5);
      if (!match) return false;
    }

    // ── Misc: tokens ──
    if (miscState.inTokens && fields.inTokens?.booleanValue !== true) return false;

    // ── Misc: picks ──
    if (miscState.inPicks && fields.inPicks?.booleanValue !== true) return false;

    // ── Misc: tradability ──
    if (miscState.tradable   && fields.tradable?.booleanValue !== true)  return false;
    if (miscState.untradeable && fields.tradable?.booleanValue === true) return false;

    // ── Misc: TOTW ──
    if (miscState.totw) {
      const totwNum = fields.totwNumber?.integerValue;
      if (!totwNum) return false;
      if (miscState.totwWeek !== '' && String(totwNum) !== String(miscState.totwWeek)) return false;
    }

    // ── Misc: gender ──
    if (miscState.genderMen   && fields.man?.booleanValue !== true)  return false;
    if (miscState.genderWomen && fields.man?.booleanValue === true)  return false;

    // ── Misc: dynamic image ──
    if (miscState.dynamicImage && fields.url?.booleanValue !== true) return false;

    return true;
  });

  filtered.sort((a, b) => {
    const aF = a?.mapValue?.fields || {};
    const bF = b?.mapValue?.fields || {};

    for (const rule of sortRules) {
      let cmp = 0;
      const { field, dir } = rule;
      const mul = dir === 'asc' ? 1 : -1;

      if (field === 'rating') {
        cmp = (parseInt(aF.rating?.integerValue || 0) - parseInt(bF.rating?.integerValue || 0)) * mul;
      } else if (field === 'name') {
        cmp = (aF.name?.stringValue || '').localeCompare(bF.name?.stringValue || '') * mul;
      } else if (field === 'position') {
        cmp = (aF.position?.stringValue || '').localeCompare(bF.position?.stringValue || '') * mul;
      } else if (['pac','sho','pas','dri','def','phy','attack','control','defense'].includes(field)) {
        const aVal = parseInt(aF[field]?.integerValue ?? aF[field.toUpperCase()]?.integerValue ?? 0);
        const bVal = parseInt(bF[field]?.integerValue ?? bF[field.toUpperCase()]?.integerValue ?? 0);
        cmp = (aVal - bVal) * mul;
      } else if (field === 'date') {
        const aDate = parseInt(aF.date?.integerValue ?? 0);
        const bDate = parseInt(bF.date?.integerValue ?? 0);
        cmp = (aDate - bDate) * mul;
      } else if (field === 'added_at') {
        cmp = (new Date(a.createTime) - new Date(b.createTime)) * mul;
      } else if (field === 'net_fatal') {
        const netA = Math.max(
          parseInt(aF.attack?.integerValue  || 0),
          parseInt(aF.control?.integerValue || 0),
          parseInt(aF.defense?.integerValue || 0)
        ) - parseInt(aF.rating?.integerValue || 0);
        const netB = Math.max(
          parseInt(bF.attack?.integerValue  || 0),
          parseInt(bF.control?.integerValue || 0),
          parseInt(bF.defense?.integerValue || 0)
        ) - parseInt(bF.rating?.integerValue || 0);
        cmp = (netA - netB) * mul;
      } else if (field === 'total_fatal') {
        const totA = parseInt(aF.attack?.integerValue  || 0)
                   + parseInt(aF.control?.integerValue || 0)
                   + parseInt(aF.defense?.integerValue || 0);
        const totB = parseInt(bF.attack?.integerValue  || 0)
                   + parseInt(bF.control?.integerValue || 0)
                   + parseInt(bF.defense?.integerValue || 0);
        cmp = (totA - totB) * mul;
      } else {
        // fallback: quick-sort dropdown
        switch (quickSort) {
          case 'newest':      cmp = new Date(b.createTime) - new Date(a.createTime); break;
          case 'oldest':      cmp = new Date(a.createTime) - new Date(b.createTime); break;
          case 'rating-high': cmp = (bF.rating?.integerValue || 0) - (aF.rating?.integerValue || 0); break;
          case 'rating-low':  cmp = (aF.rating?.integerValue || 0) - (bF.rating?.integerValue || 0); break;
          case 'name-az':     cmp = (aF.name?.stringValue || '').localeCompare(bF.name?.stringValue || ''); break;
          case 'name-za':     cmp = (bF.name?.stringValue || '').localeCompare(aF.name?.stringValue || ''); break;
          case 'position-az': cmp = (aF.position?.stringValue || '').localeCompare(bF.position?.stringValue || ''); break;
          case 'position-za': cmp = (bF.position?.stringValue || '').localeCompare(aF.position?.stringValue || ''); break;
        }
      }
      if (cmp !== 0) return cmp;
    }
    return new Date(b.createTime) - new Date(a.createTime);
  });

  renderPlayers(filtered);
  updateActiveFilters();
}

// ─────────────────────────────────────────────
// Card design fetcher
// ─────────────────────────────────────────────
async function fetchRemoteCardDesigns() {
  colorMap        = {};
  remoteCardDesigns = [];
  try {
    const [localRes, fsRes] = await Promise.all([
      fetch("json/color.json"),
      fetch("https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents/images")
    ]);
    const localData = localRes.ok ? await localRes.json() : null;
    const fsData    = fsRes.ok   ? await fsRes.json()    : null;
    const sources   = [];
    if (localData?.documents) sources.push(...localData.documents);
    if (fsData?.documents)    sources.push(...fsData.documents);

    sources.forEach(doc => {
      let imagesArray = [];
      if (doc.fields?.images?.arrayValue?.values) imagesArray = doc.fields.images.arrayValue.values;
      else if (doc.mapValue?.fields) imagesArray = [doc];

      imagesArray.forEach(item => {
        const fields = item.mapValue?.fields || {};
        const id     = (fields.id?.stringValue || fields.name?.stringValue || '').trim().toLowerCase();
        if (!id) return;
        const entry = {
          id,
          name:                fields.name?.stringValue                || id,
          url_big:             fields.url_big?.stringValue             || null,
          url_micro:           fields.url_micro?.stringValue           || null,
          url_small:           fields.url_small?.stringValue           || null,
          walkout_floor_color: fields.walkout_floor_color?.stringValue || null,
          flare_1:             fields.flare_1?.stringValue             || null,
          flare_2:             fields.flare_2?.stringValue             || null,
          top_text_color:      fields.top_text_color?.stringValue      || "#000000",
          middle_text_color:   fields.middle_text_color?.stringValue   || "#000000",
          bottom_text_color:   fields.bottom_text_color?.stringValue   || "#000000",
          alt_pos_background:  fields.alt_pos_background?.stringValue  || "#333333",
          alt_pos_text:        fields.alt_pos_text?.stringValue        || "#FFFFFF",
          alt_pos_outline:     fields.alt_pos_outline?.stringValue     || "#000000"
        };
        colorMap[id] = entry;
        remoteCardDesigns.push({
          name:        id,
          displayName: entry.name,
          urlBig:      entry.url_big,
          urlMicro:    entry.url_micro,
          urlSmall:    entry.url_small
        });
      });
    });

    const seen = new Set();
    remoteCardDesigns = remoteCardDesigns.filter(x => {
      if (seen.has(x.name)) return false;
      seen.add(x.name);
      return true;
    });

    window.colorMap = colorMap;
    console.log("Loaded card designs:", Object.keys(colorMap).length);
  } catch (err) {
    console.error("Failed to load card designs", err);
  }
}

// ─────────────────────────────────────────────
// Data fetching
// ─────────────────────────────────────────────
async function fetchAllPlayers() {
  if (IS_LIVE_PAGE) {
    await fetchLivePlayers();
  } else {
    await fetchAllDatabases();
  }
}

async function fetchLivePlayers() {
  const promises = [];
  const liveURL  = databases.livePlayers;

  for (let i = 150; i >= 1; i--) {
    promises.push(fetchPlayerDataWithTime(`${liveURL}${i}`, 'livePlayers'));
  }
  promises.push(fetchPlayerDataWithTime(databases.realmExport, 'realmExport'));
  for (let i = 150; i >= 1; i--) {
    promises.push(fetchPlayerDataWithTime(`${databases.updates}${i}`, 'updates'));
  }

  try {
    const results       = await Promise.all(promises);
    const allData       = results.flat();
    const livePlayers   = allData.filter(p => p.database === 'livePlayers');
    const originalCards = allData.filter(p => p.database !== 'livePlayers');

    const dbPriority   = { updates: 0, realmExport: 1 };
    const originalById = new Map();
    originalCards.forEach(p => {
      const id = p?.mapValue?.fields?.id?.stringValue;
      if (!id) return;
      const existing     = originalById.get(id);
      if (!existing) { originalById.set(id, p); return; }
      const existingPrio = dbPriority[existing.database] ?? 99;
      const newPrio      = dbPriority[p.database] ?? 99;
      if (newPrio < existingPrio) originalById.set(id, p);
    });

    console.log(`[LivePlayers] Found ${livePlayers.length} live players, ${originalById.size} original cards indexed`);

    const enrichedLivePlayers = livePlayers.map(p => {
      const fields       = p?.mapValue?.fields || {};
      const liveId       = fields.id?.stringValue || '';
      const originalCard = originalById.get(liveId) || null;

      if (originalCard) {
        console.log(`[LivePlayers] ✓ Matched original for ${fields.name?.stringValue} (${liveId}) from ${originalCard.database}`);
      } else {
        console.warn(`[LivePlayers] ✗ No original found for ${fields.name?.stringValue} (id: ${liveId})`);
      }
      return { ...p, baseCard: originalCard };
    });

    const idMap = new Map();
    enrichedLivePlayers.forEach(p => {
      const id = p?.mapValue?.fields?.id?.stringValue;
      if (!id) return;
      const existing = idMap.get(id);
      if (!existing || new Date(p.createTime) > new Date(existing.createTime)) {
        idMap.set(id, p);
      }
    });

    allPlayers = Array.from(idMap.values());
    allPlayers.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));

    window._allPlayers = allPlayers;
    buildFiltersFromPlayers();
  } catch (err) {
    console.error('fetchLivePlayers error:', err);
    const loadingText = document.getElementById('loading-text');
    if (loadingText) loadingText.remove();
    container.innerHTML = '<p>Failed to load players.</p>';
  }
}

async function fetchInBatches(urls, dbName, batchSize = 20) {
  const results = [];
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(url => fetchPlayerDataWithTime(url, dbName)));
    batchResults.forEach(r => results.push(...r));
    await new Promise(r => setTimeout(r, 0));
  }
  return results;
}

async function fetchAllDatabases() {
  const allResults = [];
  for (const [dbName, baseURL] of Object.entries(databases)) {
    let players = [];
    if (singleDocumentDatabases.includes(dbName)) {
      players = await fetchPlayerDataWithTime(baseURL, dbName);
      console.log(`[DB:${dbName}] got ${players.length} cards`);
    } else {
      const urls = [];
      for (let i = 150; i >= 1; i--) urls.push(`${baseURL}${i}`);
      players = await fetchInBatches(urls, dbName, 20);
      console.log(`[DB:${dbName}] got ${players.length} cards`);
    }
    allResults.push(...players);
  }

  if (allResults.length === 0) {
    console.error('[fetchAllDatabases] Zero cards loaded — check network tab');
    const loadingText = document.getElementById('loading-text');
    if (loadingText) loadingText.textContent = 'Failed to load cards. Check console.';
    return;
  }

  try {
    let combinedPlayers = allResults;

    combinedPlayers.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));

    const livePlayers  = combinedPlayers.filter(p => p.database === 'livePlayers');
    const otherPlayers = combinedPlayers.filter(p => p.database !== 'livePlayers');

    const originalTimeMap = {};
    otherPlayers.forEach(p => {
      const id = p?.mapValue?.fields?.id?.stringValue;
      if (id) originalTimeMap[id] = p.createTime;
    });

    const livePlayersWithOriginalTime = livePlayers.map(p => {
      const id           = p?.mapValue?.fields?.id?.stringValue;
      const originalTime = originalTimeMap[id];
      return originalTime ? { ...p, createTime: originalTime } : p;
    });

    const livePlayerIds  = new Set(livePlayers.map(p => p?.mapValue?.fields?.id?.stringValue));
    const filteredOthers = otherPlayers.filter(p => !livePlayerIds.has(p?.mapValue?.fields?.id?.stringValue));
    const merged         = [...livePlayersWithOriginalTime, ...filteredOthers];

    const dbSourcePriority = ['objectives','sbcGroups','draftCups','ltm','realmExport','evosElite','updates','livePlayers'];
    const getDbPriority    = db => { const i = dbSourcePriority.indexOf(db); return i === -1 ? 999 : i; };

    const idMap = new Map();
    let noIdCounter = 0;
    merged.forEach(p => {
      let id = p?.mapValue?.fields?.id?.stringValue;
      if (!id) id = `__noid_${p.database}_${noIdCounter++}`;
      const existing         = idMap.get(id);
      if (!existing) { idMap.set(id, p); return; }
      const existingPriority = getDbPriority(existing.database);
      const newPriority      = getDbPriority(p.database);
      const winningDatabase  = existingPriority <= newPriority ? existing.database : p.database;
      if (new Date(p.createTime) > new Date(existing.createTime)) {
        idMap.set(id, { ...p, database: winningDatabase });
      } else {
        idMap.set(id, { ...existing, database: winningDatabase });
      }
    });

    allPlayers = Array.from(idMap.values());
    window._allPlayers = allPlayers;
    buildFiltersFromPlayers();
  } catch (err) {
    console.error('fetchAllDatabases error:', err);
    const loadingText = document.getElementById('loading-text');
    if (loadingText) loadingText.remove();
    container.innerHTML = '';
  }
}

function buildFiltersFromPlayers() {
  const colorsSet = new Set();
  allPlayers.forEach(p => {
    const c = (p?.mapValue?.fields?.color?.stringValue || '').trim().toLowerCase();
    if (c) colorsSet.add(c);
  });

  setUniqueColors(Array.from(colorsSet));
  updateActiveFilters();
  filterAndSort();
}

// Raw fetch used by other pages (e.g. CardDetail)
async function fetchAllPlayersRaw() {
  const promises = [];
  Object.entries(databases).forEach(([dbName, baseURL]) => {
    if (singleDocumentDatabases.includes(dbName)) {
      promises.push(fetchPlayerDataWithTime(baseURL, dbName));
    } else {
      for (let i = 150; i >= 1; i--) promises.push(fetchPlayerDataWithTime(`${baseURL}${i}`, dbName));
    }
  });

  const results           = await Promise.all(promises);
  let combinedPlayers     = results.flat();
  combinedPlayers.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));

  const livePlayers  = combinedPlayers.filter(p => p.database === 'livePlayers');
  const otherPlayers = combinedPlayers.filter(p => p.database !== 'livePlayers');

  const originalTimeMap = {};
  otherPlayers.forEach(p => {
    const id = p?.mapValue?.fields?.id?.stringValue;
    if (id) originalTimeMap[id] = p.createTime;
  });

  const livePlayersWithOriginalTime = livePlayers.map(p => {
    const id           = p?.mapValue?.fields?.id?.stringValue;
    const originalTime = originalTimeMap[id];
    return originalTime ? { ...p, createTime: originalTime } : p;
  });

  const livePlayerIds  = new Set(livePlayers.map(p => p?.mapValue?.fields?.id?.stringValue));
  const filteredOthers = otherPlayers.filter(p => !livePlayerIds.has(p?.mapValue?.fields?.id?.stringValue));
  const merged         = [...livePlayersWithOriginalTime, ...filteredOthers];

  const dbSourcePriority = ['objectives','sbcGroups','draftCups','ltm','realmExport','evosElite','updates','livePlayers'];
  const getDbPriority    = db => { const i = dbSourcePriority.indexOf(db); return i === -1 ? 999 : i; };

  const idMap = new Map();
  merged.forEach(p => {
    const id = p?.mapValue?.fields?.id?.stringValue;
    if (!id) return;
    const existing         = idMap.get(id);
    if (!existing) { idMap.set(id, p); return; }
    const existingPriority = getDbPriority(existing.database);
    const newPriority      = getDbPriority(p.database);
    const winningDatabase  = existingPriority <= newPriority ? existing.database : p.database;
    if (new Date(p.createTime) > new Date(existing.createTime)) {
      idMap.set(id, { ...p, database: winningDatabase });
    } else {
      idMap.set(id, { ...existing, database: winningDatabase });
    }
  });

  return Array.from(idMap.values());
}

async function fetchPlayerDataWithTime(url, dbName) {
  try {
    const res  = await fetch(url);
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();
    let players = data.fields?.players?.arrayValue?.values || [];

    if (data.fields?.evos?.arrayValue?.values) {
      const evos       = data.fields.evos.arrayValue.values;
      const sortedEvos = evos.slice().sort((a, b) =>
        (parseInt(b?.mapValue?.fields?.id?.integerValue ?? 0)) - (parseInt(a?.mapValue?.fields?.id?.integerValue ?? 0))
      );
      const highestEvo = sortedEvos[0];
      if (highestEvo) {
        const nested = highestEvo?.mapValue?.fields?.players?.arrayValue?.values || [];
        players = nested.slice(1).map((p, i) => {
          const fields     = p?.mapValue?.fields || {};
          const existingId = fields?.id?.stringValue;
          const safeId     = (existingId && existingId !== 'id001' && existingId !== 'id002' && existingId !== 'id003')
            ? existingId
            : `evoElite_${data.name}_${i}`;
          return { ...p, mapValue: { ...p.mapValue, fields: { ...fields, id: { stringValue: safeId } } } };
        });
      }
    }

    const mapped = players.map(player => ({
      ...player,
      createTime: player?.mapValue?.fields?.createTime?.stringValue || data.createTime || '1970-01-01T00:00:00Z',
      updateTime: player?.mapValue?.fields?.updateTime?.stringValue || data.updateTime || '1970-01-01T00:00:00Z',
      database:   dbName
    }));

    mapped.sort((a, b) =>
      parseInt(b?.mapValue?.fields?.rating?.integerValue || 0) - parseInt(a?.mapValue?.fields?.rating?.integerValue || 0)
    );

    return mapped;
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// Fatal image code
// ─────────────────────────────────────────────
async function getFatalImageCode(attack, control, defense) {
  const A       = parseInt(attack)  || 0;
  const C       = parseInt(control) || 0;
  const D       = parseInt(defense) || 0;
  const highest = Math.max(A, C, D);
  const diff    = highest - 3;
  return `${A <= highest && A >= diff ? 1 : 0}${C <= highest && C >= diff ? 1 : 0}${D <= highest && D >= diff ? 1 : 0}`;
}

// ─────────────────────────────────────────────
// Card HTML builder
// ─────────────────────────────────────────────
async function buildCardHTML(p, options = {}) {
  const { linkPrefix = 'Card-Detail.html', showDownload = true } = options;
  const f = p.mapValue.fields;

  const name           = f.name?.stringValue          || 'Unknown';
  const rating         = f.rating?.integerValue        || '0';
  const position       = f.position?.stringValue       || 'NA';
  const altPositions   = f.altPositions?.stringValue   || '';
  const totwNumber     = Number(f.totwNumber?.integerValue ?? -1);
  const pac            = f.PAC?.integerValue            || '0';
  const sho            = f.SHO?.integerValue            || '0';
  const pas            = f.PAS?.integerValue            || '0';
  const dri            = f.DRI?.integerValue            || '0';
  const def            = f.DEF?.integerValue            || '0';
  const phy            = f.PHY?.integerValue            || '0';
  const attack         = f.attack?.integerValue         || '0';
  const control        = f.control?.integerValue        || '0';
  const defense        = f.defense?.integerValue        || '0';

  const fatalCode      = await getFatalImageCode(attack, control, defense);
  const fatalImageURL  = `https://mf-data.b-cdn.net/26/Fatal/Stats/fatal_card_stats_${fatalCode}.png`;
  const nationId       = f.nationId?.integerValue       || '0';
  const leagueId       = f.leagueId?.integerValue       || '0';
  const clubId         = f.clubId?.integerValue         || '0';
  const color          = f.color?.stringValue           || 'default';
  const id             = f.id?.stringValue?.replace('id', '') || '00000000';
  const baseId         = f.baseId?.integerValue         || '00000000';

  let specialChem = '';
  if (f.specialChem?.stringValue) {
    const chemMap = {
      league3: '+3 League Chem', league2: '+2 League Chem', league1: '+1 League Chem',
      club3:   '+3 Club Chem',   club2:   '+2 Club Chem',   club1:   '+1 Club Chem',
      nation3: '+3 Nation Chem', nation2: '+2 Nation Chem', nation1: '+1 Nation Chem',
      cardBoost: 'Card Boost'
    };
    specialChem = chemMap[f.specialChem.stringValue] || f.specialChem.stringValue;
  }

  let statLabels = ["PAC","SHO","PAS","DRI","DEF","PHY"];
  if (position.toUpperCase() === "GK") statLabels = ["DIV","HAN","KIC","REF","SPD","POS"];

  const colorKey        = (color || 'default').toString().trim().toLowerCase();
  const matchedCard     = colorMap[colorKey];
  const cardImageURL    = matchedCard?.url_big || `https://mf-data.b-cdn.net/26/Colors/${colorKey || 'default'}_big.png`;
  const topTextColor    = matchedCard?.top_text_color    || "#000000";
  const middleTextColor = matchedCard?.middle_text_color || "#FFFFFF";
  const bottomTextColor = matchedCard?.bottom_text_color || "#FFFFFF";

  const safeFileName = `${name.replace(/'/g, '').replace(/\s+/g, '_')}_${rating}_${color}.png`;
  const devData     = escapeForAttr(JSON.stringify(p?.mapValue?.fields || {}, null, 2));
  const devCreate = escapeForAttr(p.createTime || '—');
  const devUpdate = escapeForAttr(p.updateTime || '—');
  const devFileId = escapeForAttr(p.fileId     || '—');

  return `
    <div class="card-and-breakdown">
      <div class="card-menu-wrap">
        <button class="card-three-dots" onclick="toggleCardMenu(this)">⋮</button>
        <div class="card-menu-dropdown">
          <a class="card-menu-item" href="${linkPrefix}?id=${id}&color=${color}&db=${p.database}" target="_blank" rel="noopener noreferrer">View Player Profile</a>
          <button class="card-menu-item" style="display:${window.showDownloadBtn ? '' : 'none'}" onclick="event.stopPropagation();downloadCardImage(this.closest('.card-and-breakdown').querySelector('.card'),'${safeFileName}')">Download Card</button>
          <button class="card-menu-item" onclick="event.stopPropagation();openDevMenu(this)">Dev Menu <span style="opacity:0.5;font-size:11px">${p.database}</span></button>
        </div>
      </div>
      <div class="card-dev-panel" style="display:none;position:absolute;top:0;left:0;width:100%;z-index:200" data-create-time="${devCreate}" data-update-time="${devUpdate}" data-file-id="${devFileId}">
        <span class="card-dev-db" style="display:none">${p.database}</span>
        <pre class="card-dev-pre" style="display:none" data-dev="${devData}"></pre>
      </div>
        <div class="card-wrapper">
          <div class="card">
            <img src="${cardImageURL}" alt="${color} card">
            <div class="overall-position">
              <div class="overall player-rating" style="color: ${topTextColor};">${rating}</div>
              <div class="position player-position" style="color: ${topTextColor};">${position}</div>
            </div>
            ${altPositions ? `<div class="alt-positions">${altPositions.split(',').map(pos => {
              const hex = matchedCard?.alt_pos_background || '#333333';
              const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
              return `<div class="alt-pos" style="background-color: rgba(${r},${g},${b},0.8); color: ${matchedCard?.alt_pos_text || '#fff'}; border: 1px solid ${matchedCard?.alt_pos_outline || '#000'};">${pos.trim()}</div>`;
            }).join('')}</div>` : ''}
            <div class="player-name" style="color: ${middleTextColor};">${name}</div>
            ${totwNumber !== -1 ? `<div class="totwNumber">TOTW ${totwNumber}</div>` : ''}
            <div class="specialChem">${specialChem}</div>
            <div class="stats">
              ${statLabels.map((label, idx) => {
                const values = [pac, sho, pas, dri, def, phy];
                return `<div class="stat"><div class="stat-label" style="color: ${bottomTextColor};">${label}</div><div class="stat-value" style="color: ${bottomTextColor};">${values[idx]}</div></div>`;
              }).join('')}
            </div>
            <div class="stats-separator"></div>
            <div class="fatals">
              <img class="fatal-bg" src="${fatalImageURL}" alt="Fatal BG">
              <div class="fatal-value-container">
                <div class="fatal-value">${attack}</div>
                <div class="fatal-value">${control}</div>
                <div class="fatal-value">${defense}</div>
              </div>
            </div>
          <div class="badges">
            <img class="badge flag"   src="https://mf-data.b-cdn.net/26/Badges/Nations/Large/nation_large_${nationId}.png" alt="Nation Flag">
            <img class="badge league" src="https://mf-data.b-cdn.net/26/Badges/Leagues/Large/league_large_${leagueId}.png" alt="League badge">
            <img class="badge club"   src="https://mf-data.b-cdn.net/26/Badges/Clubs/Large/club_large_${clubId}.png"       alt="Club Badge">
          </div>
          <img
            class="player-face"
            src="https://trivela.b-cdn.net/26/normalFacesSmall/${id}.png"
            alt="${name} Face"
            onerror="
              if (!this.dataset.step) {
                this.dataset.step = 'p';
                this.classList.add('normal-face');
                this.src = 'https://trivela.b-cdn.net/26/faces/p${id}.png';
              } else if (this.dataset.step === 'p') {
                this.dataset.step = 'base';
                this.classList.remove('normal-face');
                this.classList.add('fallback-face');
                this.src = 'https://trivela.b-cdn.net/26/normalFacesSmall/${baseId}.png';
              } else {
                this.onerror = null;
                this.classList.remove('normal-face');
                this.classList.add('fallback-face');
                this.src = 'Main Assets/boo.png';
              }
            "
          >
        </div>
      </div>
    </a>
  `;
}


// ─────────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────────
function renderPlayers(players) {
  playersToRender = players;
  currentPage     = 1;
  totalPages      = Math.max(1, Math.ceil(playersToRender.length / CARDS_PER_PAGE));
  renderPage();
  updatePaginationUI();
}

async function renderPage() {
  if (isRendering) return;
  isRendering = true;

  try {
    container.innerHTML = '';
    const loadingText = document.getElementById('loading-text');
    if (loadingText) loadingText.remove();

    const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
    const endIndex   = Math.min(startIndex + CARDS_PER_PAGE, playersToRender.length);

    for (let index = startIndex; index < endIndex; index++) {
      const p = playersToRender[index];

      if (IS_LIVE_PAGE) {
        const wrapper       = document.createElement('div');
        wrapper.className   = 'live-player-pair';
        const liveHTML      = await buildCardHTML(p, { linkPrefix: 'Card-Detail.html', showDownload: true });

        let baseHTML = '';
        if (p.baseCard) {
          baseHTML = await buildCardHTML(p.baseCard, { linkPrefix: 'Card-Detail.html', showDownload: false });
        } else {
          baseHTML = `
            <div class="live-no-base">
              <div class="live-no-base-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>
                </svg>
              </div>
              <span>No base card</span>
            </div>`;
        }

        const playerName   = p?.mapValue?.fields?.name?.stringValue     || 'Unknown Player';
        const playerRating = p?.mapValue?.fields?.rating?.integerValue  || '?';
        const playerPos    = p?.mapValue?.fields?.position?.stringValue || '';

        wrapper.innerHTML = `
          <div class="live-pair-box">
            <div class="live-pair-header">
              <div class="live-pair-player-info">
                <span class="live-pair-pos">${playerPos}</span>
                <span class="live-pair-name">${playerName}</span>
                <span class="live-pair-rating">${playerRating}</span>
              </div>
              <span class="live-pair-badge">LIVE PLAYER</span>
            </div>
            <div class="live-cards-row">
              <div class="live-card-slot base-card-slot">
                <div class="live-slot-label">ORIGINAL</div>
                ${baseHTML}
              </div>
              <div class="live-upgrade-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
              <div class="live-card-slot live-card-slot-upgraded">
                <div class="live-slot-label upgraded-label">UPGRADED</div>
                ${liveHTML}
              </div>
            </div>
          </div>
        `;
        container.appendChild(wrapper);
      } else {
        const html = await buildCardHTML(p, { linkPrefix: 'Card-Detail.html', showDownload: true });
        container.insertAdjacentHTML('beforeend', html);
      }
    }
  } catch (err) {
    console.error('renderPage error:', err);
  } finally {
    isRendering = false;
    updatePaginationUI();
  }
}

function updatePaginationUI() {
  const resultsCount = document.getElementById('resultsCount');
  const paginationEl = document.getElementById('pagination');
  const pageInput    = document.getElementById('pageInput');

  const start = (currentPage - 1) * CARDS_PER_PAGE + 1;
  const end   = Math.min(currentPage * CARDS_PER_PAGE, playersToRender.length);
  resultsCount.textContent = playersToRender.length === 0
    ? 'No players'
    : `Showing ${start}-${end} of ${playersToRender.length} player${playersToRender.length !== 1 ? 's' : ''}`;

  paginationEl.style.display = playersToRender.length <= CARDS_PER_PAGE ? 'none' : 'flex';
  if (pageInput) { pageInput.value = currentPage; pageInput.max = totalPages; }
  document.getElementById('pageInfo').textContent = `of ${totalPages}`;
  document.getElementById('pagePrev').disabled    = currentPage <= 1;
  document.getElementById('pageFirst').disabled   = currentPage <= 1;
  document.getElementById('pageNext').disabled    = currentPage >= totalPages;
  document.getElementById('pageLast').disabled    = currentPage >= totalPages;
}

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────
async function init() {
  try {
    const F = await import('./Filter.js');
    ({ selectedClubs, selectedLeagues, selectedNations, selectedColors,
       selectedPositions, selectedAltPositions, positionMode,
       statFiltersState, STAT_KEYS, sortRules, displayState, downloadState,
       miscState, uniqueColors, selectedDbs } = F);
    ({ setUniqueColors, normalise, updateActiveFilters, initFilterSidebar,
       toggleFilterNav, clearAllFilters, rebuildClubLeagueNationLists,
       rebuildColorFilterOptions, buildPositionList, buildAltPositionList,
       rebuildStatFiltersUI, initRatingSlider } = F);
  } catch {}

  window._filterAndSort = filterAndSort;
  window._cardShowToast = showToast;
  window._currentSearch = '';
  window._allPlayers    = allPlayers;
  window.showDownloadBtn = true;

  if (typeof applyDisplayState === 'function') applyDisplayState();

  document.getElementById('sort-select')?.addEventListener('change', filterAndSort);

  document.getElementById('pageFirst')?.addEventListener('click', () => {
    if (currentPage > 1) { currentPage = 1; renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  document.getElementById('pageLast')?.addEventListener('click', () => {
    if (currentPage < totalPages) { currentPage = totalPages; renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  document.getElementById('pagePrev')?.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  document.getElementById('pageNext')?.addEventListener('click', () => {
    if (currentPage < totalPages) { currentPage++; renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });

  const pageInput = document.getElementById('pageInput');
  if (pageInput) {
    pageInput.addEventListener('change', () => {
      let val = parseInt(pageInput.value);
      if (isNaN(val) || val < 1) val = 1;
      if (val > totalPages) val = totalPages;
      if (val !== currentPage) { currentPage = val; renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      else { pageInput.value = currentPage; }
    });
  }

  await fetchRemoteCardDesigns();
  fetchAllPlayers();
}

function escapeForAttr(str) {
  return str.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function toggleCardMenu(btn) {
  event.stopPropagation();
  const wrap = btn.closest('.card-and-breakdown');
  const dropdown = btn.nextElementSibling;
  const devPanel = wrap.querySelector('.card-dev-panel');
  const isOpen = dropdown.classList.contains('open');
  document.querySelectorAll('.card-menu-dropdown.open').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.card-dev-panel').forEach(p => { if (p !== devPanel) p.style.display = 'none'; });
  if (!isOpen) dropdown.classList.add('open');
}

const DEV_KEY_ORDER = ['name','position','altPositions','rating','PAC','SHO','PAS','DRI','DEF','PHY','attack','control','defense','nationId','leagueId','clubId','color','specialChem','man','totwNumber','tradable','packable','inPicks','inTokens','id','baseId','itemId','url','date'];

function openDevMenu(btn) {
  event.stopPropagation();
  const wrap = btn.closest('.card-and-breakdown');
  const dropdown = wrap.querySelector('.card-menu-dropdown');
  const panel = wrap.querySelector('.card-dev-panel');

  dropdown.classList.remove('open');

  if (panel.dataset.built === 'true') {
    panel.style.display = panel.style.display === 'none' ? '' : 'none';
    return;
  }

  const raw = JSON.parse(panel.querySelector('.card-dev-pre').dataset.dev
    .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'"));
  const db   = panel.querySelector('.card-dev-db').textContent.trim();
  wrap.dataset.createTime = panel.dataset.createTime;
  wrap.dataset.updateTime = panel.dataset.updateTime;
  wrap.dataset.fileId     = panel.dataset.fileId;

  const exportObj = {};
  DEV_KEY_ORDER.forEach(k => { if (raw[k] !== undefined) exportObj[k] = raw[k].stringValue ?? raw[k].integerValue ?? raw[k].booleanValue ?? ''; });
  Object.keys(raw).forEach(k => { if (exportObj[k] === undefined) exportObj[k] = raw[k].stringValue ?? raw[k].integerValue ?? raw[k].booleanValue ?? ''; });

  const rows = DEV_KEY_ORDER
    .filter(k => raw[k] !== undefined)
    .concat(Object.keys(raw).filter(k => !DEV_KEY_ORDER.includes(k)))
    .map(k => {
      if (!raw[k]) return '';
      const val = raw[k].stringValue ?? raw[k].integerValue ?? raw[k].booleanValue ?? '';
      return `<tr><td class="dev-key">${k}</td><td class="dev-val">${val}</td></tr>`;
    }).join('');

  const exportJson = escapeForAttr(JSON.stringify(exportObj, null, 2));

  panel.innerHTML = `
    <div class="dev-header">
      <span class="dev-title">Dev Menu</span>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="dev-export-btn" onclick="event.stopPropagation();downloadDevJson(this)" data-json="${exportJson}">Export JSON</button>
        <button class="dev-close" onclick="event.stopPropagation();this.closest('.card-dev-panel').style.display='none'">×</button>
      </div>
    </div>
    <div class="dev-section-label">Card Data</div>
    <table class="dev-table" style="margin-bottom:0">
      <tr><td class="dev-key">_database</td><td class="dev-val">${db}</td></tr>
      <tr><td class="dev-key">_createTime</td><td class="dev-val">${wrap.dataset.createTime || '—'}</td></tr>
      <tr><td class="dev-key">_updateTime</td><td class="dev-val">${wrap.dataset.updateTime || '—'}</td></tr>
      <tr><td class="dev-key">_fileId</td><td class="dev-val">${wrap.dataset.fileId || '—'}</td></tr>
    </table>
    <div class="dev-section-label" style="margin-top:4px">Fields</div>
    <table class="dev-table">${rows}</table>`;

  panel.dataset.built = 'true';
  panel.style.display = '';
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.card-menu-wrap')) {
    document.querySelectorAll('.card-menu-dropdown.open').forEach(d => d.classList.remove('open'));
  }
});

// ─────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  init();
});

// ─────────────────────────────────────────────
// Globals
// ─────────────────────────────────────────────
function downloadDevJson(btn) {
  const json = btn.dataset.json.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'card_data.json';
  a.click();
}

window.downloadCardImage = downloadCardImage;
window.toggleCardMenu = toggleCardMenu;
window.openDevMenu = openDevMenu;
window.downloadDevJson = downloadDevJson;
export { buildCardHTML, fetchRemoteCardDesigns, fetchAllPlayersRaw };