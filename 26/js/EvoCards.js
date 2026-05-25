/**
 * js/EvoCards.js  —  Evo chain cards injected as standalone grid items
 *
 * When "Show Evo Chains" is toggled on, each eligible card gets its full
 * evo-chain result cards inserted directly after it in #card-container.
 * They look and behave identically to normal cards — same grid cell size,
 * same badges, same fatal stats — with only a small chain-label badge
 * overlaid in the top-left corner to identify them.
 *
 * Toggle off removes all injected evo cards and restores the original grid.
 */

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────
let allEvos = [];
const chainCache = new WeakMap();

// ─────────────────────────────────────────────
// Evo requirement / upgrade logic  (unchanged)
// ─────────────────────────────────────────────
function meetsRequirement(req, card) {
  const [type, val] = req.split(',');
  const rangeCheck  = (v, range) => {
    const [lo, hi] = range.split('-').map(Number);
    return parseInt(v) >= lo && parseInt(v) <= hi;
  };
  const isGK = (card.position || '').toUpperCase() === 'GK';
  switch (type) {
    case 'nation':   return String(card.nationId)  === val;
    case 'league':   return String(card.leagueId)  === val;
    case 'club':     return String(card.clubId)    === val;
    case 'color': {
      const c = (card.color || '').toLowerCase(), r = val.toLowerCase();
      const aliases = {
        all_silver: ['silver','rare_silver'],
        all_gold:   ['gold','rare_gold'],
        all_bronze: ['bronze','rare_bronze'],
      };
      if (r === 'all_special') {
        const base = ['gold','rare_gold','silver','rare_silver','bronze','rare_bronze'];
        return !base.includes(c);
      }
      return aliases[r] ? aliases[r].includes(c) : c === r;
    }
    case 'position': return (card.position || '').toUpperCase() === val.toUpperCase();
    case 'rating':   return rangeCheck(card.rating,  val);
    case 'attack':   return rangeCheck(card.attack,  val);
    case 'control':  return rangeCheck(card.control, val);
    case 'defense':  return rangeCheck(card.defense, val);
    case 'PAC': return isGK ? false : rangeCheck(card.PAC, val);
    case 'SHO': return isGK ? false : rangeCheck(card.SHO, val);
    case 'PAS': return isGK ? false : rangeCheck(card.PAS, val);
    case 'DRI': return isGK ? false : rangeCheck(card.DRI, val);
    case 'DEF': return isGK ? false : rangeCheck(card.DEF, val);
    case 'PHY': return isGK ? false : rangeCheck(card.PHY, val);
    default: return true;
  }
}

function parseUpgrade(s) {
  const p = s.split(',').map(Number);
  return { overall: p[0]||0, attack: p[1]||0, control: p[2]||0, defense: p[3]||0 };
}

function cap(v) { return Math.min(99, parseInt(v) || 0); }

function applyEvo(card, evo) {
  const c = { ...card };
  evo.upgrades.forEach(u => {
    const up  = parseUpgrade(u);
    c.rating  = cap(c.rating  + up.overall);
    c.PAC     = cap(c.PAC     + up.overall);
    c.SHO     = cap(c.SHO     + up.overall);
    c.PAS     = cap(c.PAS     + up.overall);
    c.DRI     = cap(c.DRI     + up.overall);
    c.DEF     = cap(c.DEF     + up.overall);
    c.PHY     = cap(c.PHY     + up.overall);
    c.attack  = cap(c.attack  + up.attack);
    c.control = cap(c.control + up.control);
    c.defense = cap(c.defense + up.defense);
  });
  c.color = 'evo';
  return c;
}

function buildChains(card) {
  const results = [];
  const seen    = new Set();
  const unique  = allEvos.filter(e => { if (seen.has(e.name)) return false; seen.add(e.name); return true; });

  function dfs(cur, used) {
    let extended = false;
    for (const evo of unique) {
      if (used.some(e => e.name === evo.name)) continue;
      if (evo.requirements.every(r => meetsRequirement(r, cur))) {
        dfs(applyEvo(cur, evo), [...used, evo]);
        extended = true;
      }
    }
    if (!extended && used.length >= 1) results.push([...used]);
  }
  dfs(card, []);
  return results;
}

function chainTotals(chain) {
  return chain.reduce((acc, evo) => {
    evo.upgrades.forEach(u => {
      const up = parseUpgrade(u);
      acc.overall  += up.overall;
      acc.attack   += up.attack;
      acc.control  += up.control;
      acc.defense  += up.defense;
    });
    return acc;
  }, { overall: 0, attack: 0, control: 0, defense: 0 });
}

// ─────────────────────────────────────────────
// Parse card object from the dev-panel data attribute
// ─────────────────────────────────────────────
function fieldsToCard(fields) {
  return {
    name:         fields.name?.stringValue         || 'Unknown',
    rating:       parseInt(fields.rating?.integerValue)    || 0,
    position:     fields.position?.stringValue     || 'NA',
    altPositions: fields.altPositions?.stringValue || '',
    PAC:     parseInt(fields.PAC?.integerValue)     || 0,
    SHO:     parseInt(fields.SHO?.integerValue)     || 0,
    PAS:     parseInt(fields.PAS?.integerValue)     || 0,
    DRI:     parseInt(fields.DRI?.integerValue)     || 0,
    DEF:     parseInt(fields.DEF?.integerValue)     || 0,
    PHY:     parseInt(fields.PHY?.integerValue)     || 0,
    attack:  parseInt(fields.attack?.integerValue)  || 0,
    control: parseInt(fields.control?.integerValue) || 0,
    defense: parseInt(fields.defense?.integerValue) || 0,
    nationId:  String(fields.nationId?.integerValue  || '0'),
    leagueId:  String(fields.leagueId?.integerValue  || '0'),
    clubId:    String(fields.clubId?.integerValue    || '0'),
    color:     fields.color?.stringValue             || 'default',
    id:        (fields.id?.stringValue || '').replace('id', ''),
    baseId:    String(fields.baseId?.integerValue    || '0'),
    specialChem: fields.specialChem?.stringValue     || '',
  };
}

// ─────────────────────────────────────────────
// Build a standalone card-and-breakdown element for one evo result
// Mirrors the structure Card.js produces so it sits naturally in the grid
// ─────────────────────────────────────────────
function buildEvoCardElement(finalCard, chain, baseCard) {
  const totals   = chainTotals(chain);
  const ck       = 'evo';
  const cm       = window.colorMap?.[ck] || {};
  const imgUrl   = cm.url_big || `https://mf-data.b-cdn.net/26/Colors/evo_big.png`;
  const top      = cm.top_text_color    || '#000000';
  const mid      = cm.middle_text_color || '#FFFFFF';
  const bot      = cm.bottom_text_color || '#FFFFFF';

  const A = finalCard.attack, C = finalCard.control, D = finalCard.defense;
  const h = Math.max(A, C, D), d = h - 3;
  const fc = `${A<=h&&A>=d?1:0}${C<=h&&C>=d?1:0}${D<=h&&D>=d?1:0}`;

  const isGK = (finalCard.position || '').toUpperCase() === 'GK';
  const sl   = isGK ? ['DIV','HAN','KIC','REF','SPD','POS'] : ['PAC','SHO','PAS','DRI','DEF','PHY'];
  const sv   = [finalCard.PAC, finalCard.SHO, finalCard.PAS, finalCard.DRI, finalCard.DEF, finalCard.PHY];

  const altHTML = finalCard.altPositions ? finalCard.altPositions.split(',').map(pos => {
    const hex = cm.alt_pos_background || '#333333';
    const r   = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `<div class="alt-pos" style="background:rgba(${r},${g},${b},0.8);color:${cm.alt_pos_text||'#fff'};border:1px solid ${cm.alt_pos_outline||'#000'}">${pos.trim()}</div>`;
  }).join('') : '';

  const chainLabel = chain.map(e => e.name).join(' → ');
  const safeId     = String(finalCard.id     || '');
  const safeBase   = String(finalCard.baseId || '');
  const safeName   = (finalCard.name || '').replace(/'/g,'').replace(/\s+/g,'_');

  // Stat diff pills for the chain label badge
  const pills = [
    totals.overall  ? `+${totals.overall} OVR` : '',
    totals.attack   ? `+${totals.attack} ATK`  : '',
    totals.control  ? `+${totals.control} CTL` : '',
    totals.defense  ? `+${totals.defense} DEF` : '',
  ].filter(Boolean).join('  ');

  const wrap = document.createElement('div');
  wrap.className      = 'card-and-breakdown evo-injected-card';
  wrap.dataset.evoFor = finalCard.name;

  // Store upgraded stats as a Firestore-shaped mapValue so Card.js
  // filterAndSort() reads the same field paths it uses for real cards
  const evoPlayerEntry = {
    _isEvoInjected: true,
    createTime: new Date().toISOString(),
    database: 'evo',
    mapValue: { fields: {
      name:         { stringValue:  finalCard.name },
      rating:       { integerValue: String(finalCard.rating) },
      position:     { stringValue:  finalCard.position },
      altPositions: { stringValue:  finalCard.altPositions || '' },
      PAC:          { integerValue: String(finalCard.PAC) },
      SHO:          { integerValue: String(finalCard.SHO) },
      PAS:          { integerValue: String(finalCard.PAS) },
      DRI:          { integerValue: String(finalCard.DRI) },
      DEF:          { integerValue: String(finalCard.DEF) },
      PHY:          { integerValue: String(finalCard.PHY) },
      attack:       { integerValue: String(finalCard.attack) },
      control:      { integerValue: String(finalCard.control) },
      defense:      { integerValue: String(finalCard.defense) },
      nationId:     { integerValue: finalCard.nationId },
      leagueId:     { integerValue: finalCard.leagueId },
      clubId:       { integerValue: finalCard.clubId },
      color:        { stringValue:  'evo' },
      id:           { stringValue:  finalCard.id },
      baseId:       { integerValue: finalCard.baseId },
    }}
  };
  wrap._evoPlayerEntry = evoPlayerEntry;

  // Flat fields object for the dev menu (human-readable + chain metadata)
 try { wrap.dataset.evoFields = JSON.stringify({
    _evoChain:   chainLabel,
    _evoTotals:  pills || 'none',
    name:        finalCard.name,
    position:    finalCard.position,
    altPositions: finalCard.altPositions || '',
    rating:      finalCard.rating,
    PAC:         finalCard.PAC,  SHO: finalCard.SHO, PAS: finalCard.PAS,
    DRI:         finalCard.DRI,  DEF: finalCard.DEF, PHY: finalCard.PHY,
    attack:      finalCard.attack, control: finalCard.control, defense: finalCard.defense,
    nationId:    finalCard.nationId, leagueId: finalCard.leagueId, clubId: finalCard.clubId,
    color:       'evo',
    id:          finalCard.id,
    baseId:      finalCard.baseId,
  }); } catch(e) { wrap.dataset.evoFields = '{}'; }

  // Build a Firestore-shaped fields object with upgraded stats for the dev panel + filtering
  const evoFieldsForDev = {
    
    name:         { stringValue:  finalCard.name },
    position:     { stringValue:  finalCard.position },
    altPositions: { stringValue:  finalCard.altPositions || '' },
    rating:       { integerValue: String(finalCard.rating) },
    PAC:          { integerValue: String(finalCard.PAC) },
    SHO:          { integerValue: String(finalCard.SHO) },
    PAS:          { integerValue: String(finalCard.PAS) },
    DRI:          { integerValue: String(finalCard.DRI) },
    DEF:          { integerValue: String(finalCard.DEF) },
    PHY:          { integerValue: String(finalCard.PHY) },
    attack:       { integerValue: String(finalCard.attack) },
    control:      { integerValue: String(finalCard.control) },
    defense:      { integerValue: String(finalCard.defense) },
    nationId:     { integerValue: String(finalCard.nationId) },
    leagueId:     { integerValue: String(finalCard.leagueId) },
    clubId:       { integerValue: String(finalCard.clubId) },
    color:        { stringValue:  'evo' },
    id:           { stringValue:  finalCard.id },
    baseId:       { integerValue: String(finalCard.baseId) },
  };

  function escEvo(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  const evoDevData = escEvo(JSON.stringify(evoFieldsForDev, null, 2));

  wrap.innerHTML = `
    <div class="card-menu-wrap">
      <button class="card-three-dots" onclick="toggleCardMenu(this)">⋮</button>
      <div class="card-menu-dropdown">
        <div class="card-menu-item" style="pointer-events:none;opacity:0.5;font-size:10px;white-space:normal;line-height:1.4">${chainLabel}</div>
        ${pills ? `<div class="card-menu-item" style="pointer-events:none;opacity:0.5;font-size:10px">${pills}</div>` : ''}
        <button class="card-menu-item" onclick="event.stopPropagation();window._evoDownloadCard(this.closest('.card-and-breakdown').querySelector('.card'),'${safeName}_evo.png')">Download Card</button>
        <button class="card-menu-item" onclick="event.stopPropagation();openDevMenu(this)">Dev Menu <span style="opacity:0.5;font-size:11px">evo</span></button>
      </div>
    </div>
    <div class="card-dev-panel" style="display:none;position:absolute;top:0;left:0;width:100%;z-index:200">
      <span class="card-dev-db" style="display:none">evo</span>
      <pre class="card-dev-pre" style="display:none" data-dev="${evoDevData}"></pre>
    </div>

    <div class="card-wrapper">
      <div class="card">
        <img src="${imgUrl}" alt="evo card">
        <div class="overall-position">
          <div class="overall player-rating" style="color:${top}">${finalCard.rating}</div>
          <div class="position player-position" style="color:${top}">${finalCard.position}</div>
        </div>
        ${altHTML ? `<div class="alt-positions">${altHTML}</div>` : ''}
        <div class="player-name" style="color:${mid}">${finalCard.name}</div>
        <div class="specialChem"></div>
        <div class="stats">
          ${sl.map((l,i) => `<div class="stat">
            <div class="stat-label" style="color:${bot}">${l}</div>
            <div class="stat-value" style="color:${bot}">${sv[i]}</div>
          </div>`).join('')}
        </div>
        <div class="stats-separator"></div>
        <div class="fatals">
          <img class="fatal-bg" src="https://mf-data.b-cdn.net/26/Fatal/Stats/fatal_card_stats_${fc}.png" alt="">
          <div class="fatal-value-container">
            <div class="fatal-value">${finalCard.attack}</div>
            <div class="fatal-value">${finalCard.control}</div>
            <div class="fatal-value">${finalCard.defense}</div>
          </div>
        </div>
        <div class="badges">
          <img class="badge flag"   src="https://mf-data.b-cdn.net/26/Badges/Nations/Large/nation_large_${finalCard.nationId}.png" onerror="this.style.opacity='.15'" alt="">
          <img class="badge league" src="https://mf-data.b-cdn.net/26/Badges/Leagues/Large/league_large_${finalCard.leagueId}.png" onerror="this.style.opacity='.15'" alt="">
          <img class="badge club"   src="https://mf-data.b-cdn.net/26/Badges/Clubs/Large/club_large_${finalCard.clubId}.png" onerror="this.style.opacity='.15'" alt="">
        </div>
        <img class="player-face"
          src="https://trivela.b-cdn.net/26/normalFacesSmall/${safeId}.png"
          alt=""
          onerror="
            if (!this.dataset.step) {
              this.dataset.step='p'; this.classList.add('normal-face');
              this.src='https://trivela.b-cdn.net/26/faces/p${safeId}.png';
            } else if (this.dataset.step==='p') {
              this.dataset.step='base'; this.classList.remove('normal-face'); this.classList.add('fallback-face');
              this.src='https://trivela.b-cdn.net/26/normalFacesSmall/${safeBase}.png';
            } else {
              this.onerror=null; this.src='Main Assets/boo.png';
            }
          ">
      </div>
    </div>`;

  return wrap;
}

// ─────────────────────────────────────────────
// Build evo player entries and inject into allPlayers
// Called once after Card.js has finished loading all players
// ─────────────────────────────────────────────
function buildAndInjectEvoPlayers() {
  const players = window._allPlayers;
  if (!Array.isArray(players) || !players.length) return;
  if (!allEvos.length) return;

  console.log('[EvoCards] building evo entries for', players.length, 'players');
  let count = 0;

  players
    .filter(p => !p._isEvoInjected) // skip any already-injected evo entries
    .forEach(p => {
      let card;
      try { card = fieldsToCard(p.mapValue.fields); } catch { return; }
      card._database   = p.database;
      card._createTime = p.createTime;

      buildChains(card).forEach(chain => {
        const finalCard = chain.reduce((c, evo) => applyEvo(c, evo), { ...card });
        const chainLabel = chain.map(e => e.name).join(' → ');
        const totals     = chainTotals(chain);
        const pills = [
          totals.overall  ? `+${totals.overall} OVR` : '',
          totals.attack   ? `+${totals.attack} ATK`  : '',
          totals.control  ? `+${totals.control} CTL` : '',
          totals.defense  ? `+${totals.defense} DEF` : '',
        ].filter(Boolean).join('  ');

        // Copy all original fields then override stats + evo-specific fields
        const baseFields = p.mapValue.fields;
        const evoEntry = {
            
          _isEvoInjected: true,
          _originalDb:    p.database,
          createTime:     p.createTime,
          database:       'evo',
          mapValue: { fields: {
            // ── copy everything from base card ──────────────────
            ...baseFields,
            // ── evo metadata ─────────────────────────────────────
            _evoChain:    { stringValue:  chainLabel },
            _evoTotals:   { stringValue:  pills || 'none' },
            // ── override upgraded stats ─────────────────────────
            name:         { stringValue:  finalCard.name },
            rating:       { integerValue: String(finalCard.rating) },
            position:     { stringValue:  finalCard.position },
            altPositions: { stringValue:  finalCard.altPositions || '' },
            PAC:          { integerValue: String(finalCard.PAC) },
            SHO:          { integerValue: String(finalCard.SHO) },
            PAS:          { integerValue: String(finalCard.PAS) },
            DRI:          { integerValue: String(finalCard.DRI) },
            DEF:          { integerValue: String(finalCard.DEF) },
            PHY:          { integerValue: String(finalCard.PHY) },
            attack:       { integerValue: String(finalCard.attack) },
            control:      { integerValue: String(finalCard.control) },
            defense:      { integerValue: String(finalCard.defense) },
            // ── evo-specific overrides ───────────────────────────
            color:        { stringValue:  'evo' },
            packable:     { integerValue: '-99' },
            tradable:     { booleanValue: false },
            inPicks:      { booleanValue: false },
            inTokens:     { booleanValue: false },
          }}
        };

        players.push(evoEntry);
        count++;
      });
    });

  console.log('[EvoCards]', count, 'evo entries injected into allPlayers');
  // Trigger a re-filter so the new entries appear
  window._filterAndSort?.();
}

// kept for compatibility but no longer used for DOM injection
function attachEvoCards() {
  const container = document.getElementById('card-container');
  if (!container) return;

  // Only process originals — skip any we already injected
  const originals = [...container.querySelectorAll('.card-and-breakdown:not(.evo-injected-card)')];

  originals.forEach(cardEl => {
    // Skip if we've already processed this one in this render cycle
    if (cardEl.dataset.evoAttached === '1') return;

    const devPre = cardEl.querySelector('.card-dev-pre');
    if (!devPre) return;

    let fields;
    try {
      const raw = devPre.dataset.dev
        .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
      fields = JSON.parse(raw);
    } catch { return; }

    const card = fieldsToCard(fields);

    let chains;
    if (chainCache.has(cardEl)) {
      chains = chainCache.get(cardEl);
    } else {
      chains = buildChains(card);
      chainCache.set(cardEl, chains);
    }

    // Mark so we don't double-inject on re-runs
    cardEl.dataset.evoAttached = '1';

    // Insert each chain result immediately after the original card
    let insertAfter = cardEl;
    chains.forEach(chain => {
      const finalCard = chain.reduce((c, evo) => applyEvo(c, evo), { ...card });
      const el        = buildEvoCardElement(finalCard, chain, card);
      insertAfter.insertAdjacentElement('afterend', el);
      insertAfter = el;
    });
  });
}

// ─────────────────────────────────────────────
// Remove all injected evo cards
// ─────────────────────────────────────────────
function removeEvoCards() {
  const container = document.getElementById('card-container');
  if (!container) return;

  // Unregister from _allPlayers before removing from DOM
  container.querySelectorAll('.evo-injected-card').forEach(el => {
    if (el._evoPlayerEntry && Array.isArray(window._allPlayers)) {
      const idx = window._allPlayers.indexOf(el._evoPlayerEntry);
      if (idx !== -1) window._allPlayers.splice(idx, 1);
    }
    el.remove();
  });

  // Reset the attachment markers so re-toggling works
  container.querySelectorAll('.card-and-breakdown[data-evo-attached]').forEach(el => {
    delete el.dataset.evoAttached;
  });
}

// ─────────────────────────────────────────────
// Toggle button
// ─────────────────────────────────────────────


function mountToggleButton() {} // no-op, toggle removed

function observeContainer() {} // no longer needed

// ─────────────────────────────────────────────
// Fetch evosStandard from Firestore
// ─────────────────────────────────────────────
async function fetchAllEvos() {
  const base = 'https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents/evosStandard';
  const evos = [];
  try {
    let pageToken = '';
    do {
      const res  = await fetch(`${base}?pageSize=300${pageToken ? '&pageToken=' + pageToken : ''}`);
      if (!res.ok) break;
      const data = await res.json();
      pageToken  = data.nextPageToken || '';
      (data.documents || []).forEach(doc => {
        (doc.fields?.evos?.arrayValue?.values || []).forEach(item => {
          const f = item?.mapValue?.fields;
          if (!f?.name?.stringValue) return;
          evos.push({
            name:         f.name.stringValue,
            requirements: (f.standardRequirements?.arrayValue?.values || []).map(v => v.stringValue).filter(Boolean),
            upgrades:     (f.standardUpgrades?.arrayValue?.values     || []).map(v => v.stringValue).filter(Boolean),
          });
        });
      });
    } while (pageToken);
  } catch (e) {
    console.error('[EvoCards] fetch error:', e);
  }
  console.log(`[EvoCards] ${evos.length} evolutions loaded`);
  return evos;
}

// ─────────────────────────────────────────────
// Download helper (keeps the existing global contract)
// ─────────────────────────────────────────────
window._evoDownloadCard = async function(cardEl, filename) {
  try {
    const canvas = await html2canvas(cardEl, { useCORS: true, backgroundColor: null, scale: 3 });
    const a      = document.createElement('a');
    a.download   = filename;
    a.href       = canvas.toDataURL('image/png');
    a.click();
  } catch (e) {
    console.error('[EvoCards] download failed:', e);
  }
};


// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
function injectStyles() {
  if (document.getElementById('evo-card-styles')) return;
  const s = document.createElement('style');
  s.id    = 'evo-card-styles';
  s.textContent = `

/* ── Toggle button ──────────────────────────── */
.evo-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 20px;
  border: 1.5px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.06);
  color: #ccc;
  font-size: 12px;
  font-weight: 700;
  font-family: 'Roboto Condensed', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.evo-toggle-btn:hover { border-color: rgba(255,255,255,0.4); color: #fff; }
.evo-toggle-btn--active {
  background: rgba(34,197,94,0.15);
  border-color: rgba(34,197,94,0.5);
  color: #4ade80;
}

/* ── Evo chain badge overlaid at top-left of each evo card ─ */
.evo-chain-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 140px;
  pointer-events: none;
}

.evo-chain-name {
  display: block;
  background: rgba(34,197,94,0.85);
  color: #052e16;
  font-family: 'Roboto Condensed', sans-serif;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.evo-chain-pills {
  display: block;
  background: rgba(0,0,0,0.55);
  color: #d1fae5;
  font-family: 'Roboto Condensed', sans-serif;
  font-size: 8px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  white-space: nowrap;
  letter-spacing: 0.2px;
}

`;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  injectStyles();

  // Wait for Card.js to finish loading all players, then build evo entries.
  // Card.js sets window._allPlayers and calls filterAndSort when done.
  // We poll until _allPlayers is populated, then inject once.
  let attempts = 0;
  const tryInject = async () => {
    attempts++;
    const players = window._allPlayers;
    if (Array.isArray(players) && players.length > 0 && window._filterAndSort) {
      allEvos = await fetchAllEvos();
      buildAndInjectEvoPlayers();
    } else if (attempts < 60) {
      setTimeout(tryInject, 500);
    } else {
      console.warn('[EvoCards] gave up waiting for allPlayers after 30s');
    }
  };
  setTimeout(tryInject, 500);
});