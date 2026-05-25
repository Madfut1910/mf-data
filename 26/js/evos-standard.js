console.error('[EVOS] evos-standard.js module loaded');
// ── Lookup maps (still needed by evo-specific formatting) ────────────────────
import { clubIdToName, leagueIdToName, nationIdToName } from './Mappings.js';

  window.clubIdToName   = clubIdToName;
  window.leagueIdToName = leagueIdToName;
  window.nationIdToName = nationIdToName;

  // ── Download helpers ─────────────────────────────────────────────────────────

  /**
   * Core capture helper. Clones the .card into a clean off-screen container
   * with NO inherited transforms, then captures it with html2canvas.
   */
  function captureCardToBlob(cardElement, fileName) {
    // Hide UI chrome on the original first (clone inherits this)
    const downloadBtn = cardElement.querySelector('.download-btn');
    const faceBtn     = cardElement.querySelector('.download-face-btn');
    const metaBadge   = cardElement.querySelector('.fatal-meta-badge');
    const totwEl      = cardElement.querySelector('.totwNumber');
    const chemEl      = cardElement.querySelector('.specialChem');

    if (downloadBtn) downloadBtn.style.display = 'none';
    if (faceBtn)     faceBtn.style.display     = 'none';
    if (metaBadge)   metaBadge.style.display   = 'none';
    const prevTotw = totwEl ? totwEl.style.display : null;
    const prevChem = chemEl ? chemEl.style.display : null;
    if (totwEl) totwEl.style.display = 'none';
    if (chemEl) chemEl.style.display = 'none';

    // Clone the card after hiding chrome so clone is already clean
    const clone = cardElement.cloneNode(true);

    // Card.css defines .card at 300px wide — use that as ground truth
    const CARD_W = 300;
    const CARD_H = cardElement.scrollHeight || 430;

    // Strip transforms from the clone itself
    clone.style.cssText += ';transform:none;transform-origin:top left;width:' + CARD_W + 'px;margin:0;position:static;overflow:visible;';

    // Off-screen host that is a direct child of <body> — breaks ALL inherited transform chains
    const offscreen = document.createElement('div');
    offscreen.style.cssText = 'position:fixed;top:-99999px;left:-99999px;width:' + CARD_W + 'px;height:' + CARD_H + 'px;overflow:visible;transform:none;pointer-events:none;z-index:-9999;background:transparent;';

    offscreen.appendChild(clone);
    document.body.appendChild(offscreen);

    requestAnimationFrame(() => {
      html2canvas(clone, {
        backgroundColor: null,
        useCORS:        true,
        scale:          3,
        width:          CARD_W,
        height:         CARD_H,
        x:              0,
        y:              0,
        scrollX:        0,
        scrollY:        0,
      }).then(canvas => {
        document.body.removeChild(offscreen);

        // Restore UI chrome on original
        if (downloadBtn) downloadBtn.style.display = '';
        if (faceBtn)     faceBtn.style.display     = '';
        if (metaBadge)   metaBadge.style.display   = '';
        if (totwEl)      totwEl.style.display      = prevTotw;
        if (chemEl)      chemEl.style.display      = prevChem;

        canvas.toBlob(blob => {
          const a   = document.createElement('a');
          a.href     = URL.createObjectURL(blob);
          a.download = fileName;
          a.click();
        }, 'image/png');
      }).catch(err => {
        if (document.body.contains(offscreen)) document.body.removeChild(offscreen);
        if (downloadBtn) downloadBtn.style.display = '';
        if (faceBtn)     faceBtn.style.display     = '';
        if (metaBadge)   metaBadge.style.display   = '';
        if (totwEl)      totwEl.style.display      = prevTotw;
        if (chemEl)      chemEl.style.display      = prevChem;
        console.error('[EVOS] captureCardToBlob failed', err);
      });
    });
  }

  function downloadCardImage(cardElement, fileName) {
    const downloadBtn = cardElement.querySelector('.download-btn');
    if (downloadBtn) {
      downloadBtn.classList.add('downloading');
      setTimeout(() => downloadBtn.classList.remove('downloading'), 600);
    }
    captureCardToBlob(cardElement, fileName);
  }

  function downloadFaceImage(imgElement, fileName) {
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d');
    canvas.width  = imgElement.naturalWidth  || imgElement.width;
    canvas.height = imgElement.naturalHeight || imgElement.height;
    ctx.drawImage(imgElement, 0, 0);
    canvas.toBlob(blob => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fileName; a.click(); }, 'image/png');
  }

  window.downloadCardImage = downloadCardImage;
  window.downloadFaceImage = downloadFaceImage;

  function getStr(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    return v.stringValue ?? '';
  }

  function getInt(v) {
    if (v == null) return 0;
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    const raw = v.integerValue ?? v.doubleValue ?? v.stringValue ?? 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  }

  function getArr(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    return v.arrayValue?.values || [];
  }

  function getMap(v) {
    if (!v) return null;
    return v.mapValue?.fields || v.fields || null;
  }

  function parseUpgradeString(upgrade) {
    const raw = getStr(upgrade) || '0,0,0,0';
    const [overall, fatalAtt, fatalCtrl, fatalDef] = raw.split(',').map(x => parseInt(x.trim(), 10) || 0);
    return { overall, fatalAtt, fatalCtrl, fatalDef };
  }

  function applyUpgradesToCard(cardFields, upgradeStrings) {
    const base = {
      rating: getInt(cardFields.rating),
      attack: getInt(cardFields.attack),
      control: getInt(cardFields.control),
      defense: getInt(cardFields.defense),
      PAC: getInt(cardFields.PAC), SHO: getInt(cardFields.SHO), PAS: getInt(cardFields.PAS),
      DRI: getInt(cardFields.DRI), DEF: getInt(cardFields.DEF), PHY: getInt(cardFields.PHY),
      DIV: getInt(cardFields.DIV), HAN: getInt(cardFields.HAN), KIC: getInt(cardFields.KIC),
      REF: getInt(cardFields.REF), SPD: getInt(cardFields.SPD), POS: getInt(cardFields.POS),
    };
    const stages = [];
    let current = { ...base };
    (upgradeStrings || []).forEach((u, idx) => {
      const parsed = parseUpgradeString(u);
      const next = { ...current };
      next.stage = idx + 1;
      next.rating += parsed.overall;
      next.attack += parsed.fatalAtt;
      next.control += parsed.fatalCtrl;
      next.defense += parsed.fatalDef;
      ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY', 'DIV', 'HAN', 'KIC', 'REF', 'SPD', 'POS'].forEach(k => {
        if (next[k] > 0) next[k] += parsed.overall;
      });
      stages.push(next);
      current = next;
    });
    return stages;
  }

  const BASE_TIER_COLORS = new Set([
    'default',
    'gold', 'gold_rare', 'gold_non_rare',
    'silver', 'silver_rare', 'silver_non_rare',
    'bronze', 'bronze_rare', 'bronze_non_rare'
  ]);

  function getCardRarityTier(cardFields) {
    const rating = getInt(cardFields.rating);
    const color  = (getStr(cardFields.color) || 'default').trim().toLowerCase();
    if (!BASE_TIER_COLORS.has(color) && color !== '') return 'special';
    let metal;
    if (rating >= 75)      metal = 'gold';
    else if (rating >= 65) metal = 'silver';
    else                   metal = 'bronze';
    const isExplicitRare    = /(?<![_-])rare/.test(color) && !/non[_-]?rare/.test(color);
    const isExplicitNonRare = /non[_-]?rare/.test(color);
    const rare = isExplicitRare ? true : (isExplicitNonRare ? false : false);
    return `${metal}_${rare ? 'rare' : 'non_rare'}`;
  }

  function requirementMatchesRarity(cardFields, requirementValue) {
    const v = (requirementValue || '').toLowerCase().trim();
    const tier = getCardRarityTier(cardFields);
    const rating = getInt(cardFields.rating);
    switch (v) {
      case 'all_gold':    return rating >= 75 && tier !== 'special';
      case 'all_silver':  return rating >= 65 && rating < 75 && tier !== 'special';
      case 'all_bronze':  return rating < 65 && tier !== 'special';
      case 'all_special': return tier === 'special';
      default:            return null;
    }
  }

  function cardMeetsRequirements(cardFields, requirements) {
    return requirements.every(req => {
      const key   = (req.key || '').toLowerCase();
      const value = req.value || '';
      if (key === 'nation')   return String(getInt(cardFields.nationId)) === value;
      if (key === 'league')   return String(getInt(cardFields.leagueId)) === value;
      if (key === 'club')     return String(getInt(cardFields.clubId))   === value;
      if (key === 'position') return getStr(cardFields.position).toUpperCase() === value.toUpperCase();
      if (key === 'color') {
        const rarityResult = requirementMatchesRarity(cardFields, value);
        if (rarityResult !== null) return rarityResult;
        return getStr(cardFields.color).toLowerCase() === value.toLowerCase();
      }
      const [minRaw, maxRaw] = value.split('-');
      const min = parseInt(minRaw, 10);
      const max = parseInt(maxRaw, 10);
      const statKeyMap = { pac: 'PAC', sho: 'SHO', pas: 'PAS', dri: 'DRI', def: 'DEF', phy: 'PHY' };
      const cardKey = statKeyMap[key] || key;
      const statVal = getInt(cardFields[cardKey]) || getInt(cardFields[key]);
      if (!Number.isNaN(min) && !Number.isNaN(max)) return statVal >= min && statVal <= max;
      return true;
    });
  }

  const EVOS_STANDARD_URL = 'https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents/evosStandard/';
  const CARDS_PER_PAGE    = 50;
  const CURRENT_PAGE      = window.location.pathname.split('/').pop() || 'Evolution.html';

  let allEvos      = [];
  let db26Players  = [];

  function debugLog(label, payload) {
    console.log(`[EVOS] ${label}`, payload ?? '');
  }

  function capitalizeWords(str) { return (str || '').replace(/\b\w/g, c => c.toUpperCase()); }
  function formatNumber(num)    { return Number(num).toLocaleString(); }

  function parseRequirements(reqStrings) {
    return (reqStrings || []).map(s => {
      const str   = getStr(s);
      if (!str) return null;
      const comma = str.indexOf(',');
      if (comma === -1) return null;
      const key   = str.slice(0, comma).trim().toLowerCase();
      const value = str.slice(comma + 1).trim();
      let displayValue = value;
      if      (key === 'nation') displayValue = window.nationIdToName?.[value] || value;
      else if (key === 'league') displayValue = window.leagueIdToName?.[value] || value;
      else if (key === 'club')   displayValue = window.clubIdToName?.[value]   || value;
      else if (key === 'color') {
        const rarityLabels = {
          all_gold:    'All Gold (Rare & Non-Rare)',
          all_silver:  'All Silver (Rare & Non-Rare)',
          all_bronze:  'All Bronze (Rare & Non-Rare)',
          all_special: 'All Special Cards'
        };
        displayValue = rarityLabels[value.toLowerCase()] || capitalizeWords(value.replace(/_/g, ' '));
      }
      return { key, value, displayValue };
    }).filter(Boolean);
  }

  function formatCondition(condMap, cardFields) {
    const type = getStr(condMap.type);
    const attr = getStr(condMap.attribute);
    const anyLabel = attr === '?' ? 'any' : attr;
    if (!cardFields) {
      if (type === 'nation')   return `Nation: ${attr === '?' ? 'any' : (window.nationIdToName?.[attr] || `Nation ${attr}`)}`;
      if (type === 'league')   return `League: ${attr === '?' ? 'any' : (window.leagueIdToName?.[attr] || `League ${attr}`)}`;
      if (type === 'club')     return `Club: ${attr === '?' ? 'any' : (window.clubIdToName?.[attr] || `Club ${attr}`)}`;
      if (type === 'player')   return `Player: ${anyLabel}`;
      if (type === 'position') return `Position: ${anyLabel}`;
      if (type === 'color')    return `Color: ${anyLabel}`;
    } else {
      if (type === 'nation')   { const cn = window.nationIdToName?.[String(getInt(cardFields.nationId))] || ''; return `Nation: ${attr === '?' ? 'any' : (window.nationIdToName?.[attr] || `Nation ${attr}`)} (card: ${cn})`; }
      if (type === 'league')   { const cl = window.leagueIdToName?.[String(getInt(cardFields.leagueId))] || ''; return `League: ${attr === '?' ? 'any' : (window.leagueIdToName?.[attr] || `League ${attr}`)} (card: ${cl})`; }
      if (type === 'club')     { const cc = window.clubIdToName?.[String(getInt(cardFields.clubId))] || ''; return `Club: ${attr === '?' ? 'any' : (window.clubIdToName?.[attr] || `Club ${attr}`)} (card: ${cc})`; }
      if (type === 'player')   return `Player: ${anyLabel}`;
      if (type === 'position') return `Position: ${anyLabel} (card: ${getStr(cardFields.position)})`;
      if (type === 'color')    return `Color: ${anyLabel} (card: ${getStr(cardFields.color)})`;
    }
    return `${type} ${attr}`;
  }

  function buildRewardsHTML(rewardsArray) {
    if (!rewardsArray?.length) return '';
    let html = '<div class="reward-heading">Rewards</div><div class="reward-list">';
    rewardsArray.forEach(rewardItem => {
      const f = getMap(rewardItem);
      if (!f) return;
      let text = '', iconSrc = '';
      if (f.rewardQuery) {
        const rq = getMap(f.rewardQuery);
        const ids = getArr(rq.ids);
        if (ids.length) {
          const idList = ids.map(v => {
            const id = getStr(v);
            const pf = db26Players.find(p => (getStr(p.mapValue?.fields?.id) || '') === id)?.mapValue?.fields;
            return pf ? `${getStr(pf.name) || 'Unknown'}: ${getInt(pf.rating)} Rated` : `Player Id ${id}`;
          });
          text = idList.join(', '); iconSrc = '26assets/Tokens/market_token.png';
        } else {
          const parts = [];
          const newProb = getInt(rq.newProbability); if (newProb) parts.push(`${newProb}% New`);
          const color   = getStr(rq.color);           if (color)   parts.push(capitalizeWords(color.replace(/_/g, ' ')));
          const minR = getInt(rq.minRating), maxR = getInt(rq.maxRating);
          if (minR && maxR) parts.push(`${minR}-${maxR}`);
          text = `Reward Query: ${parts.join(' ')}`; iconSrc = '26assets/Packs/pack_cover_query.png';
        }
      } else if (f.type) {
        const rawType = getStr(f.type);
        const amount  = formatNumber(getInt(f.amount) || 1);
        if (rawType === 'guar_hero_100') { text = '100% Hero Card'; iconSrc = '26assets/PP/guar_hero_100.png'; }
        else { text = `(${amount}) ${capitalizeWords(rawType.replace(/_/g, ' '))}`; iconSrc = rawType.toLowerCase() === 'coins' ? '26assets/coins.png' : `26assets/PP/${rawType}.png`; }
      }
      if (text) { html += '<div>'; if (iconSrc) html += `<img src="${iconSrc}" alt="" onerror="this.onerror=null;this.src='26assets/Packs/Custom Pack/pack_cover_color_special.png'">`; html += `<span>${text}</span></div>`; }
    });
    html += '</div>';
    return html;
  }

  function extractEvoFromMap(fields) {
    return {
      id:                   getInt(fields.id),
      name:                 getStr(fields.name),
      points:               getArr(fields.points),
      standardUpgrades:     getArr(fields.standardUpgrades),
      standardRequirements: getArr(fields.standardRequirements),
      conditions:           getArr(fields.conditions),
      rewards:              getArr(fields.rewards),
    };
  }

  async function fetchEvos() {
    const res  = await fetch(EVOS_STANDARD_URL);
    if (!res.ok) throw new Error('Failed to fetch evos');
    const data = await res.json();
    const seen = new Set(), evos = [];
    (data.documents || []).forEach(doc => {
      getArr(doc.fields?.evos).forEach(ev => {
        const evo = extractEvoFromMap(getMap(ev));
        if (evo.id && !seen.has(evo.id)) { seen.add(evo.id); evos.push(evo); }
      });
    });
    evos.sort((a, b) => b.id - a.id);
    return evos;
  }

  function wrapInCardWindow(cardHtml) {
    return `<div class="card-window">${cardHtml}</div>`;
  }

  async function renderEvoList() {
    const grid = document.getElementById('evo-grid');
    const cardApi = window.cardJsApi;

    const cards = await Promise.all(allEvos.map(async evo => {
      const requirements  = parseRequirements(evo.standardRequirements || []);
      const eligible      = db26Players.filter(p => cardMeetsRequirements(p.mapValue?.fields || {}, requirements));
      const preview3      = eligible.slice(0, 3);
      const upgradeStrings = evo.standardUpgrades || [];
      const totalPts      = (evo.points || []).reduce((sum, p) => sum + getInt(p), 0);

      const reqItems   = requirements.map(r => `<li>${capitalizeWords(r.key)}: ${r.displayValue}</li>`).join('');
      const reqContent = reqItems ? `<ul>${reqItems}</ul>` : '<span class="evo-no-data">No specific requirements</span>';

      let rewardRows = '';
      (evo.rewards || []).forEach(rewardItem => {
        const rf = rewardItem.mapValue?.fields;
        if (!rf) return;
        let text = '', iconSrc = '';
        if (rf.rewardQuery) {
          const rq    = rf.rewardQuery.mapValue?.fields || {};
          const ids   = rq.ids?.arrayValue?.values;
          if (ids?.length) {
            text = ids.map(v => `Player ${v.stringValue}`).join(', ');
            iconSrc = '26assets/Tokens/market_token.png';
          } else {
            const parts = [];
            const col  = rq.color?.stringValue; if (col) parts.push(capitalizeWords(col.replace(/_/g, ' ')));
            const minR = parseInt(rq.minRating?.integerValue || 0);
            const maxR = parseInt(rq.maxRating?.integerValue || 0);
            if (minR && maxR) parts.push(`${minR}-${maxR}`);
            text = `Reward Query: ${parts.join(' ') || 'Pack'}`;
            iconSrc = '26assets/Packs/pack_cover_query.png';
          }
        } else if (rf.type) {
          const rawType = rf.type.stringValue;
          const amount  = formatNumber(parseInt(rf.amount?.integerValue || 1));
          if (rawType === 'guar_hero_100') { text = '100% Hero Card'; iconSrc = '26assets/PP/guar_hero_100.png'; }
          else { text = `(${amount}) ${capitalizeWords(rawType.replace(/_/g, ' '))}`; iconSrc = rawType.toLowerCase() === 'coins' ? '26assets/coins.png' : `26assets/PP/${rawType}.png`; }
        }
        if (text) rewardRows += `<div class="reward-row">${iconSrc ? `<img src="${iconSrc}" onerror="this.onerror=null" alt="">` : ''}<span>${text}</span></div>`;
      });
      const rewardContent = rewardRows || '<span class="evo-no-data">No rewards listed</span>';

      let previewCardsHTML = '';
      if (preview3.length === 0) {
        previewCardsHTML = '<div style="color:#aaa;font-size:0.8rem;text-align:center;padding:20px 0;grid-column:1/-1;">No eligible cards</div>';
      } else {
        const previews = await Promise.all(preview3.map(async p => {
          const f   = p.mapValue.fields;
          const pid = (getStr(f.id) || '').replace('id', '') || '';

          const baseCardHtml = await cardApi.buildCardHTML(p, {
            linkPrefix:   'CardDetail26.html',
            showDownload: false
          });

          const allStages  = applyUpgradesToCard(f, upgradeStrings);
          const finalStage = allStages[allStages.length - 1];
          const stagedPlayer = {
            ...p,
            mapValue: {
              ...(p.mapValue || {}),
              fields: {
                ...f,
                color:   { stringValue: 'evo' },
                rating:  { integerValue: String(finalStage.rating) },
                attack:  { integerValue: String(finalStage.attack) },
                control: { integerValue: String(finalStage.control) },
                defense: { integerValue: String(finalStage.defense) },
                PAC: { integerValue: String(finalStage.PAC) },
                SHO: { integerValue: String(finalStage.SHO) },
                PAS: { integerValue: String(finalStage.PAS) },
                DRI: { integerValue: String(finalStage.DRI) },
                DEF: { integerValue: String(finalStage.DEF) },
                PHY: { integerValue: String(finalStage.PHY) },
                DIV: { integerValue: String(finalStage.DIV) },
                HAN: { integerValue: String(finalStage.HAN) },
                KIC: { integerValue: String(finalStage.KIC) },
                REF: { integerValue: String(finalStage.REF) },
                SPD: { integerValue: String(finalStage.SPD) },
                POS: { integerValue: String(finalStage.POS) },
              }
            }
          };
          const evoCardHtml = await cardApi.buildCardHTML(stagedPlayer, {
            linkPrefix:   'CardDetail26.html',
            showDownload: false
          });

          const clickUrl = `${CURRENT_PAGE}?id=${evo.id}&preselect=${pid}`;
          return `
            <div class="flip-card-outer" onclick="event.stopPropagation();window.location.href='${clickUrl}'" title="Click to see ${getStr(f.name)||'player'} upgraded">
              <div class="flip-front evo-preview-card-slot">${baseCardHtml}</div>
              <div class="flip-back  evo-preview-card-slot">${evoCardHtml}</div>
            </div>`;
        }));
        previewCardsHTML = previews.join('');
      }

      return `
        <div class="evo-card" data-id="${evo.id}">
          <div class="evo-card-header">
            <h3>${evo.name}</h3>
            <div class="evo-card-meta">
              <span class="evo-eligible-badge">${eligible.length.toLocaleString()} eligible</span>
              ${totalPts > 0 ? `<span style="font-size:0.72rem;color:#888;font-family:'cruyffSansMedium',sans-serif;">${totalPts} pts</span>` : ''}
            </div>
          </div>
          <div class="evo-preview-cards">${previewCardsHTML}</div>
          <div class="evo-info-sections">
            <div class="evo-section-label">Requirements</div>
            <div class="evo-reqs-content">${reqContent}</div>
            <div class="evo-rewards-section">
              <div class="evo-section-label">Rewards</div>
              <div class="evo-rewards-content">${rewardContent}</div>
            </div>
          </div>
          <button class="evo-view-btn" onclick="event.stopPropagation();navigateToEvo(${evo.id})">View Full Details →</button>
        </div>`;
    }));

    grid.innerHTML = cards.join('');
  }

  window.navigateToEvo = function (id) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    history.pushState({ evoId: id }, '', `${CURRENT_PAGE}?id=${id}`);
    showDetail(id);
  };

  function showDetail(evoId, preselectId) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const evo = allEvos.find(e => e.id === evoId);
    if (!evo) return;
    document.getElementById('list').style.display   = 'none';
    document.getElementById('detail').style.display = 'block';

    const points       = evo.points || [];
    const upgrades     = evo.standardUpgrades || [];
    const requirements = parseRequirements(evo.standardRequirements || []);
    const eligible     = db26Players.filter(p => cardMeetsRequirements(p.mapValue?.fields || {}, requirements));

    let selectedPlayer = eligible.length ? eligible[0] : null;
    if (preselectId && eligible.length) {
      const found = eligible.find(p => (getStr(p.mapValue?.fields?.id) || '').replace('id', '') === String(preselectId));
      if (found) selectedPlayer = found;
    }
    let eligiblePage = 1;

    const rewardsHTML      = buildRewardsHTML(evo.rewards || []);
    const requirementsHTML = requirements.length
      ? `<ul class="requirements-list">${requirements.map(r => `<li>${capitalizeWords(r.key)}: ${r.displayValue}</li>`).join('')}</ul>`
      : '<p>No specific requirements</p>';
    const stagesHTML = upgrades.length
      ? `<ul class="stages-list">${upgrades.map((u, i) => {
          const raw = getStr(u);
          const up  = parseUpgradeString(u);
          const pts = getInt((evo.points || [])[i]) || 0;
          return `<li><div class="stage-title">Stage ${i+1} — ${pts} pts</div><div class="stage-details">+${up.overall} OVR &amp; base stats | Fatal: Att +${up.fatalAtt}, Ctrl +${up.fatalCtrl}, Def +${up.fatalDef}<span class="upgrade-raw">(raw: ${raw || '0,0,0,0'})</span></div></li>`;
        }).join('')}<li style="background:rgba(0,184,148,0.2);font-weight:600;"><div class="stage-title">Total Points: ${points.reduce((s,p) => s + getInt(p), 0)} pts</div></li></ul>`
      : '<p>No stages defined</p>';

    const content = document.getElementById('detail-content');
    content.innerHTML = `
      <button type="button" class="back-btn" id="back-btn">← Back to list</button>
      <div class="tab-navigation">
        <button class="tab-button active" data-tab="info">Information</button>
        <button class="tab-button" data-tab="eligible">Eligible Cards</button>
        <button class="tab-button" data-tab="upgrades" id="upgrades-tab" disabled>Card Upgrades</button>
      </div>
      <div class="tab-content active" id="tab-info">
        <div class="detail-section">
          <h1 class="evo-title">${evo.name}</h1>
          <h6 class="evo-id">ID: ${evo.id}</h6>
          ${rewardsHTML}
        </div>
        <div class="detail-section"><h3>Requirements</h3>${requirementsHTML}</div>
        <div class="detail-section"><h3>Stages</h3>${stagesHTML}</div>
      </div>
      <div class="tab-content" id="tab-eligible">
        <div class="detail-section">
          <h3>Eligible Cards <h6>(${eligible.length} total)</h6></h3>
          <div class="results-count" id="eligible-results-count"></div>
          <div id="eligible-card-container"></div>
          <div class="pagination" id="eligible-pagination"></div>
        </div>
      </div>
      <div class="tab-content" id="tab-upgrades">
        <div class="detail-section" id="stages-section"><h3>Card Upgrades</h3><div class="evo-stages-grid" id="stages-row"></div></div>
        <div class="detail-section" id="challenges-section"><h3>Challenges</h3><table class="challenges-table" id="challenges-table"><thead><tr><th>Points</th><th>Action</th></tr></thead><tbody id="challenges-list"></tbody></table></div>
      </div>`;

    content.querySelector('#back-btn').addEventListener('click', hideDetail);

    const eligibleContainer = document.getElementById('eligible-card-container');
    const stagesRow         = document.getElementById('stages-row');
    const resultsCountEl    = document.getElementById('eligible-results-count');
    const paginationEl      = document.getElementById('eligible-pagination');
    const upgradesTab       = document.getElementById('upgrades-tab');

    let efSelectedClubs     = new Set();
    let efSelectedLeagues   = new Set();
    let efSelectedNations   = new Set();
    let efSelectedPositions = new Set();
    let efSelectedRarities  = new Set();
    let efRatingMin = 0, efRatingMax = 99;
    let efSearchQuery = '', efSortValue = 'rating-high', efSelectedStage = -1;
    let filteredEligible    = [...eligible];

    function efApplyFiltersAndSort() {
      const q = efSearchQuery.trim().toLowerCase();
      filteredEligible = eligible.filter(p => {
        const f = p.mapValue?.fields || {};
        if (q && !(getStr(f.name) || '').toLowerCase().includes(q)) return false;
        if (efSelectedClubs.size     > 0 && !efSelectedClubs.has(String(f.clubId?.integerValue || '')))     return false;
        if (efSelectedLeagues.size   > 0 && !efSelectedLeagues.has(String(f.leagueId?.integerValue || ''))) return false;
        if (efSelectedNations.size   > 0 && !efSelectedNations.has(String(f.nationId?.integerValue || ''))) return false;
        if (efSelectedPositions.size > 0 && !efSelectedPositions.has((getStr(f.position) || '').toUpperCase())) return false;
        if (efSelectedRarities.size  > 0) {
          const tier = getCardRarityTier(f);
          if (!efSelectedRarities.has(tier)) return false;
        }
        const rating = getInt(f.rating);
        if (rating < efRatingMin || rating > efRatingMax) return false;
        return true;
      });
      filteredEligible.sort((a, b) => {
        const af = a.mapValue?.fields || {}, bf = b.mapValue?.fields || {};
        switch (efSortValue) {
          case 'rating-high': return getInt(bf.rating) - getInt(af.rating);
          case 'rating-low':  return getInt(af.rating) - getInt(bf.rating);
          case 'name-az':     return (getStr(af.name)||'').localeCompare(getStr(bf.name)||'');
          case 'name-za':     return (getStr(bf.name)||'').localeCompare(getStr(af.name)||'');
          case 'position-az': return (getStr(af.position)||'').localeCompare(getStr(bf.position)||'');
          default: return 0;
        }
      });
      eligiblePage = 1;
      renderEligiblePage();
    }

    function efBuildSelectList(listId, searchId, entries, selectedSet, imageType) {
      const listEl   = document.getElementById(listId);
      const searchEl = document.getElementById(searchId);
      if (!listEl) return;
      const q      = searchEl ? searchEl.value.trim().toLowerCase() : '';
      const sorted = entries.slice().sort((a, b) => a[1].localeCompare(b[1]));
      listEl.innerHTML = sorted.filter(([, name]) => !q || name.toLowerCase().includes(q))
        .map(([id, name]) => {
          const imgSrc = imageType === 'club'   ? `26assets/Clubs/Small/club_small_${id}.png`
                       : imageType === 'league' ? `26assets/Leagues/Small/league_small_${id}.png`
                       : imageType === 'nation' ? `26assets/Nations/Small/nation_small_${id}.png` : '';
          return `<div class="ef-option ${selectedSet.has(id)?'selected':''}" data-id="${id}">${imgSrc ? `<img src="${imgSrc}" onerror="this.style.display='none'">` : ''}<span>${name}</span></div>`;
        }).join('');
      listEl.querySelectorAll('.ef-option').forEach(el => {
        el.addEventListener('click', () => {
          if (selectedSet.has(el.dataset.id)) selectedSet.delete(el.dataset.id); else selectedSet.add(el.dataset.id);
          efBuildSelectList(listId, searchId, entries, selectedSet, imageType);
          efApplyFiltersAndSort();
        });
      });
      if (searchEl) searchEl.oninput = () => efBuildSelectList(listId, searchId, entries, selectedSet, imageType);
    }

    function efBuildPositionList() {
      const positions = new Set();
      eligible.forEach(p => { const pos = p.mapValue?.fields?.position?.stringValue; if (pos) positions.add(pos.toUpperCase()); });
      const listEl   = document.getElementById('ef-position-list');
      const searchEl = document.getElementById('ef-position-search');
      if (!listEl) return;
      const q = searchEl ? searchEl.value.trim().toUpperCase() : '';
      listEl.innerHTML = [...positions].sort().filter(p => !q || p.includes(q))
        .map(p => `<div class="ef-option ${efSelectedPositions.has(p)?'selected':''}" data-id="${p}"><span>${p}</span></div>`).join('');
      listEl.querySelectorAll('.ef-option').forEach(el => {
        el.addEventListener('click', () => {
          if (efSelectedPositions.has(el.dataset.id)) efSelectedPositions.delete(el.dataset.id); else efSelectedPositions.add(el.dataset.id);
          efBuildPositionList(); efApplyFiltersAndSort();
        });
      });
      if (searchEl) searchEl.oninput = () => efBuildPositionList();
    }

    function efBuildRarityFilter() {
      const container = document.getElementById('ef-rarity-chips');
      if (!container) return;
      const rarityOptions = [
        { value: 'gold_rare',      label: 'Rare Gold',      rarity: 'gold'    },
        { value: 'gold_non_rare',  label: 'Non-Rare Gold',  rarity: 'gold'    },
        { value: 'silver_rare',    label: 'Rare Silver',    rarity: 'silver'  },
        { value: 'silver_non_rare',label: 'Non-Rare Silver',rarity: 'silver'  },
        { value: 'bronze_rare',    label: 'Rare Bronze',    rarity: 'bronze'  },
        { value: 'bronze_non_rare',label: 'Non-Rare Bronze',rarity: 'bronze'  },
        { value: 'special',        label: 'Special',        rarity: 'special' },
      ];
      container.innerHTML = rarityOptions.map(({ value, label, rarity }) =>
        `<button type="button" class="ef-rarity-chip ${efSelectedRarities.has(value) ? 'selected' : ''}" data-rarity="${rarity}" data-value="${value}">${label}</button>`
      ).join('');
      container.querySelectorAll('.ef-rarity-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const v = chip.dataset.value;
          if (efSelectedRarities.has(v)) efSelectedRarities.delete(v); else efSelectedRarities.add(v);
          efBuildRarityFilter();
          efApplyFiltersAndSort();
        });
      });
    }

    function efInitRatingSlider() {
      const minInput = document.getElementById('ef-rating-min-input');
      const maxInput = document.getElementById('ef-rating-max-input');
      const fill     = document.getElementById('ef-rating-fill');
      const minLabel = document.getElementById('ef-rating-min-label');
      const maxLabel = document.getElementById('ef-rating-max-label');
      if (!minInput) return;
      const update = () => {
        let lo = parseInt(minInput.value), hi = parseInt(maxInput.value);
        if (lo > hi) { const t = lo; lo = hi; hi = t; minInput.value = lo; maxInput.value = hi; }
        fill.style.left  = (lo/99*100) + '%';
        fill.style.width = ((hi-lo)/99*100) + '%';
        minLabel.textContent = lo; maxLabel.textContent = hi;
        efRatingMin = lo; efRatingMax = hi;
        efApplyFiltersAndSort();
      };
      minInput.addEventListener('input', update);
      maxInput.addEventListener('input', update);
      update();
    }

    function efBuildStageList() {
      const listEl = document.getElementById('ef-stage-list');
      if (!listEl) return;
      const upStrings = evo.standardUpgrades || [];
      const stageOpts = [{ idx: -1, label: 'Base Card' }];
      upStrings.forEach((_, i) => {
        const pts = getInt((evo.points || [])[i]) || 0;
        stageOpts.push({ idx: i, label: `Stage ${i+1}${pts ? ' — ' + pts + ' pts' : ''}` });
      });
      listEl.innerHTML = stageOpts.map(({ idx, label }) =>
        `<div class="ef-option${efSelectedStage === idx ? ' selected' : ''}" data-stage-idx="${idx}">${label}</div>`
      ).join('');
      listEl.querySelectorAll('.ef-option').forEach(opt => {
        opt.addEventListener('click', () => {
          efSelectedStage = parseInt(opt.dataset.stageIdx);
          efBuildStageList();
          efApplyFiltersAndSort();
        });
      });
    }

    function efInitFilters() {
      const clubEntries   = Object.entries(window.clubIdToName   || {});
      const leagueEntries = Object.entries(window.leagueIdToName || {});
      const nationEntries = Object.entries(window.nationIdToName || {});
      efBuildSelectList('ef-club-list',   'ef-club-search',   clubEntries,   efSelectedClubs,   'club');
      efBuildSelectList('ef-league-list', 'ef-league-search', leagueEntries, efSelectedLeagues, 'league');
      efBuildSelectList('ef-nation-list', 'ef-nation-search', nationEntries, efSelectedNations, 'nation');
      efBuildPositionList();
      efBuildRarityFilter();
      efBuildStageList();
      efInitRatingSlider();

      const searchEl = document.getElementById('eligible-search-input');
      if (searchEl) searchEl.addEventListener('input', () => { efSearchQuery = searchEl.value; efApplyFiltersAndSort(); });
      const sortEl = document.getElementById('eligible-sort-select');
      if (sortEl) sortEl.addEventListener('change', () => { efSortValue = sortEl.value; efApplyFiltersAndSort(); });

      document.getElementById('ef-clear-all')?.addEventListener('click', () => {
        efSelectedClubs.clear(); efSelectedLeagues.clear(); efSelectedNations.clear();
        efSelectedPositions.clear(); efSelectedRarities.clear();
        efRatingMin = 0; efRatingMax = 99; efSearchQuery = ''; efSortValue = 'rating-high'; efSelectedStage = -1;
        const si = document.getElementById('eligible-search-input'); if (si) si.value = '';
        const so = document.getElementById('eligible-sort-select');  if (so) so.value = 'rating-high';
        const rMin = document.getElementById('ef-rating-min-input'); if (rMin) rMin.value = 0;
        const rMax = document.getElementById('ef-rating-max-input'); if (rMax) rMax.value = 99;
        efInitRatingSlider();
        efBuildSelectList('ef-club-list',   'ef-club-search',   clubEntries,   efSelectedClubs,   'club');
        efBuildSelectList('ef-league-list', 'ef-league-search', leagueEntries, efSelectedLeagues, 'league');
        efBuildSelectList('ef-nation-list', 'ef-nation-search', nationEntries, efSelectedNations, 'nation');
        efBuildPositionList();
        efBuildRarityFilter();
        efBuildStageList();
        efApplyFiltersAndSort();
      });
    }

    const filterToggleBtn = document.getElementById('eligible-filter-toggle');
    const efSidebar       = document.getElementById('eligible-filter-sidebar');
    if (filterToggleBtn && efSidebar) {
      filterToggleBtn.style.display = 'flex';
      filterToggleBtn.addEventListener('click', () => {
        efSidebar.classList.toggle('visible');
        filterToggleBtn.classList.toggle('sidebar-open', efSidebar.classList.contains('visible'));
      });
    }

    content.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', () => {
        if (button.disabled) return;
        content.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        content.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
        button.classList.add('active');
        document.getElementById(`tab-${button.dataset.tab}`).classList.add('active');
        window.scrollTo({ top: 0, behavior: 'instant' });
        if (filterToggleBtn) filterToggleBtn.style.display = button.dataset.tab === 'eligible' ? 'flex' : 'none';
        if (button.dataset.tab !== 'eligible' && efSidebar) {
          efSidebar.classList.remove('visible');
          filterToggleBtn?.classList.remove('sidebar-open');
        }
      });
    });

    efInitFilters();
    efApplyFiltersAndSort();

    async function renderEligiblePage() {
      const totalFiltered       = filteredEligible.length;
      const totalPagesFiltered  = Math.max(1, Math.ceil(totalFiltered / CARDS_PER_PAGE));
      if (eligiblePage > totalPagesFiltered) eligiblePage = 1;
      const start       = (eligiblePage - 1) * CARDS_PER_PAGE;
      const pagePlayers = filteredEligible.slice(start, start + CARDS_PER_PAGE);

      const cardApi = window.cardJsApi;
      const rows = await Promise.all(pagePlayers.map(async (p) => {
        const globalIdx  = eligible.indexOf(p);
        const isSelected = selectedPlayer === p;
        const id         = (getStr(p.mapValue.fields.id) || '').replace('id', '') || '';
        const color      = (getStr(p.mapValue.fields.color) || 'default').trim().toLowerCase();
        const dbParam    = p.database || 'realmExport';
        const playerName = getStr(p.mapValue.fields.name) || 'Unknown';
        const shareUrl   = `${window.location.origin}${window.location.pathname}?id=${evoId}&preselect=${id}`;

        let cardMarkup = '';
        if (efSelectedStage >= 0) {
          const stages    = applyUpgradesToCard(p.mapValue.fields, evo.standardUpgrades || []);
          const stageData = stages[Math.min(efSelectedStage, stages.length - 1)];
          const stagedPlayer = {
            ...p,
            mapValue: {
              ...(p.mapValue || {}),
              fields: {
                ...p.mapValue.fields,
                color:   { stringValue: 'evo' },
                rating:  { integerValue: String(stageData.rating) },
                attack:  { integerValue: String(stageData.attack) },
                control: { integerValue: String(stageData.control) },
                defense: { integerValue: String(stageData.defense) },
                PAC: { integerValue: String(stageData.PAC) },
                SHO: { integerValue: String(stageData.SHO) },
                PAS: { integerValue: String(stageData.PAS) },
                DRI: { integerValue: String(stageData.DRI) },
                DEF: { integerValue: String(stageData.DEF) },
                PHY: { integerValue: String(stageData.PHY) },
              }
            }
          };
          cardMarkup = await cardApi.buildCardHTML(stagedPlayer, { linkPrefix: 'CardDetail26.html', showDownload: true });
        } else {
          if (!cardApi?.buildCardHTML) throw new Error('Card.js buildCardHTML is unavailable');
          cardMarkup = await cardApi.buildCardHTML(p, { linkPrefix: 'CardDetail26.html', showDownload: true });
        }

        return `
          <div class="eligible-card-wrap ${isSelected ? 'selected' : ''}" data-idx="${globalIdx}" onclick="window.eligibleSelect(${globalIdx})">
            ${wrapInCardWindow(cardMarkup)}
            <div class="eligible-card-actions">
              <button type="button" class="preview-stages-btn" onclick="event.stopPropagation();window.eligibleSelect(${globalIdx});">View Upgrades</button>
              <button type="button" class="download-card-btn" onclick="event.stopPropagation();window.downloadEligibleCard(this);" title="Download card">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M5 20h14v-2H5v2zm7-18L5.33 9h3.84v4h4.66V9h3.84L12 2z"/></svg>
              </button>
              <button type="button" class="share-card-btn" onclick="event.stopPropagation();window.shareEligibleCard('${shareUrl}','${playerName.replace(/'/g,"\\'")}');" title="Copy shareable link">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              </button>
            </div>
          </div>`;
      }));
      eligibleContainer.innerHTML = rows.join('');

      const startNum = totalFiltered === 0 ? 0 : start + 1;
      const endNum   = Math.min(start + CARDS_PER_PAGE, totalFiltered);
      resultsCountEl.textContent = totalFiltered === 0
        ? 'No cards match filters'
        : `Showing ${startNum}–${endNum} of ${totalFiltered} cards (${eligible.length} total eligible)`;
      resultsCountEl.style.display = 'block';

      paginationEl.innerHTML = '';
      if (totalPagesFiltered > 1) {
        function goToPage(page) { eligiblePage = page; renderEligiblePage(); window.scrollTo({ top: 0, behavior: 'instant' }); }
        const firstBtn = document.createElement('button'); firstBtn.textContent = '<<'; firstBtn.onclick = () => { if (eligiblePage > 1) goToPage(1); };
        const prevBtn  = document.createElement('button'); prevBtn.textContent  = '<';  prevBtn.onclick  = () => { if (eligiblePage > 1) goToPage(eligiblePage - 1); };
        const nextBtn  = document.createElement('button'); nextBtn.textContent  = '>';  nextBtn.onclick  = () => { if (eligiblePage < totalPagesFiltered) goToPage(eligiblePage + 1); };
        const lastBtn  = document.createElement('button'); lastBtn.textContent  = '>>'; lastBtn.onclick  = () => { if (eligiblePage < totalPagesFiltered) goToPage(totalPagesFiltered); };
        const span = document.createElement('span'); span.style.padding = '0 8px'; span.textContent = `Page ${eligiblePage} of ${totalPagesFiltered}`;
        paginationEl.append(firstBtn, prevBtn, span, nextBtn, lastBtn);
      }
    }

    window.eligibleSelect = function (globalIdx) {
      selectedPlayer = eligible[globalIdx];
      const selId = (getStr(selectedPlayer.mapValue.fields.id) || '').replace('id', '');
      history.replaceState({ evoId }, '', `${CURRENT_PAGE}?id=${evoId}&preselect=${selId}`);
      renderEligiblePage();
      void renderStages();
      upgradesTab.disabled = false;
      window.scrollTo({ top: 0, behavior: 'instant' });
      upgradesTab.click();
    };

    window.downloadEligibleCard = function(btn) {
      const wrap   = btn.closest('.eligible-card-wrap');
      const cardEl = wrap?.querySelector('.card');
      if (!cardEl) return;
      const name   = cardEl.querySelector('.player-name')?.textContent?.trim().replace(/\s+/g, '_') || 'card';
      const rating = cardEl.querySelector('.overall, .player-rating')?.textContent?.trim() || '0';
      captureCardToBlob(cardEl, `${name}_${rating}.png`);
    };

    window.shareEligibleCard = function (url, playerName) {
      const copy = () => { const ta = document.createElement('textarea'); ta.value = url; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => showShareToast(`Link for ${playerName} copied!`)).catch(copy);
      else { copy(); showShareToast(`Link for ${playerName} copied!`); }
    };

    function showShareToast(msg) {
      let toast = document.getElementById('share-toast');
      if (!toast) {
        toast = document.createElement('div'); toast.id = 'share-toast';
        toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(60px);background:#00b894;color:#fff;padding:10px 20px;border-radius:8px;font-family:cruyffSansBold,sans-serif;font-size:14px;z-index:9999;transition:transform 0.3s ease,opacity 0.3s ease;opacity:0;pointer-events:none;';
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.style.opacity = '1'; toast.style.transform = 'translateX(-50%) translateY(0)';
      clearTimeout(toast._t);
      toast._t = setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(60px)'; }, 2500);
    }

    function renderChallenges() {
      const listEl = document.getElementById('challenges-list');
      if (!listEl) return;
      const cardFields = selectedPlayer ? selectedPlayer.mapValue.fields : null;
      listEl.innerHTML = (evo.conditions || []).map(c => {
        const f = getMap(c);
        return `<tr><td class="challenge-points">${getInt(f.points)} pts</td><td>${getStr(f.category)}: ${formatCondition(getMap(f.condition), cardFields)}</td></tr>`;
      }).join('');
    }

    async function renderStages() {
      if (!selectedPlayer) { stagesRow.innerHTML = '<p>Select a card to see it upgraded at each stage.</p>'; renderChallenges(); return; }
      const f = selectedPlayer.mapValue.fields;
      const cardApi = window.cardJsApi;
      if (!cardApi?.buildCardHTML) throw new Error('Card.js buildCardHTML is unavailable for stage rendering');
      const stages = applyUpgradesToCard(f, evo.standardUpgrades || []);
      const stageRows = await Promise.all(stages.map(async (st) => {
        const stageIdx = Math.max(0, (getInt(st.stage) || 1) - 1);
        const up = parseUpgradeString((evo.standardUpgrades || [])[stageIdx] || '0,0,0,0');
        const stagedPlayer = {
          ...selectedPlayer,
          mapValue: {
            ...(selectedPlayer.mapValue || {}),
            fields: {
              ...f,
              color: { stringValue: 'evo' },
              rating: { integerValue: String(st.rating) },
              attack: { integerValue: String(st.attack) },
              control: { integerValue: String(st.control) },
              defense: { integerValue: String(st.defense) },
              PAC: { integerValue: String(st.PAC) }, SHO: { integerValue: String(st.SHO) }, PAS: { integerValue: String(st.PAS) },
              DRI: { integerValue: String(st.DRI) }, DEF: { integerValue: String(st.DEF) }, PHY: { integerValue: String(st.PHY) },
              DIV: { integerValue: String(st.DIV) }, HAN: { integerValue: String(st.HAN) }, KIC: { integerValue: String(st.KIC) },
              REF: { integerValue: String(st.REF) }, SPD: { integerValue: String(st.SPD) }, POS: { integerValue: String(st.POS) },
            }
          }
        };
        const cardHtml = await cardApi.buildCardHTML(stagedPlayer, { linkPrefix: 'CardDetail26.html', showDownload: true });
        return `
          <div class="evo-stage-item">
            <div class="evo-stage-meta">
              <div class="evo-stage-title">Stage ${st.stage}</div>
              <div class="evo-stage-upgrades">+${up.overall} OVR | ATK +${up.fatalAtt}, CTRL +${up.fatalCtrl}, DEF +${up.fatalDef}</div>
            </div>
            ${wrapInCardWindow(cardHtml)}
          </div>`;
      }));
      stagesRow.innerHTML = stageRows.join('');
      renderChallenges();
    }

    renderEligiblePage();
    if (selectedPlayer) {
      void renderStages();
      upgradesTab.disabled = false;
      if (preselectId) { window.scrollTo({ top: 0, behavior: 'instant' }); upgradesTab.click(); }
    }
  }

  function hideDetail() {
    window.scrollTo({ top: 0, behavior: 'instant' });
    history.pushState({}, '', CURRENT_PAGE);
    document.getElementById('detail').style.display     = 'none';
    document.getElementById('detail-content').innerHTML = '';
    const efSidebar = document.getElementById('eligible-filter-sidebar');
    const efToggle  = document.getElementById('eligible-filter-toggle');
    if (efSidebar) efSidebar.classList.remove('visible');
    if (efToggle)  { efToggle.style.display = 'none'; efToggle.classList.remove('sidebar-open'); }
    renderEvoList();
    document.getElementById('list').style.display = 'block';
  }

  (async () => {
    const loading = document.getElementById('loading');
    try {
      debugLog('starting data load');
      if (window.cardJsReadyPromise) {
        await window.cardJsReadyPromise;
      }
      const cardApi = window.cardJsApi;
      if (!cardApi?.fetchAllPlayersRaw || !cardApi?.fetchRemoteCardDesigns) {
        throw new Error('Card.js bridge not ready. Check Card.js import in Evolution.html');
      }
      await cardApi.fetchRemoteCardDesigns();
      const [evos, players] = await Promise.all([fetchEvos(), cardApi.fetchAllPlayersRaw()]);
      debugLog('data loaded', { evos: evos.length, players: players.length });
      allEvos     = evos;
      db26Players = players;
      loading.style.display = 'none';

      const params     = new URLSearchParams(window.location.search);
      const urlId      = params.get('id');
      const urlPresel  = params.get('preselect');
      if (urlId) {
        const evoId = parseInt(urlId, 10);
        if (allEvos.some(e => e.id === evoId)) showDetail(evoId, urlPresel || null);
        else { renderEvoList(); document.getElementById('list').style.display = 'block'; }
      } else {
        renderEvoList();
        document.getElementById('list').style.display = 'block';
      }
    } catch (e) {
      debugLog('bootstrap failed', e.message || String(e));
      console.error('[EVOS] bootstrap failed', e);
      loading.innerHTML = `<p class="error">Error: ${e.message}</p>`;
      throw e;
    }
  })();

  window.addEventListener('popstate', e => {
    if (e.state?.evoId) {
      showDetail(e.state.evoId);
    } else {
      document.getElementById('detail').style.display     = 'none';
      document.getElementById('detail-content').innerHTML = '';
      renderEvoList();
      document.getElementById('list').style.display = 'block';
    }
  });