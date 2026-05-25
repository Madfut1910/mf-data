/* ============================================================
   24VotePromo.js  —  Combined votes + promos, sorted by date
   ============================================================ */

(function () {
  const VOTES_URL      = "https://firestore.googleapis.com/v1/projects/madfut-24/databases/(default)/documents/votes/";
  const PROMOS_URL     = "https://firestore.googleapis.com/v1/projects/madfut-24/databases/(default)/documents/promotions/";
  const LOCAL_JSON_URL = "24assets/Txt/promo.json";

  const EXCLUDED_VOTE_IDS  = new Set(["fAqrb25c0p4P9X1RValu"]);
  const EXCLUDED_PROMO_IDS = new Set(["ECTdzGYHhiqWZeqRFliJ"]);

  /* ── helpers ── */
  function fmt(n) { return Number(n).toLocaleString("en-GB"); }
  function pct(val, total) { if (!total) return "0%"; return Math.round((val / total) * 100) + "%"; }

  function fmtUnix(secs) {
    if (!secs) return "—";
    const d = new Date(Number(secs) * 1000);
    let h = d.getHours(); const ampm = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
    return `${h}${ampm} ${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getFullYear()).slice(-2)}`;
  }

  function fmtISO(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    let h = d.getHours(); const ampm = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
    return `${h}${ampm} ${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getFullYear()).slice(-2)}`;
  }

  function toDate(iso) { return iso ? new Date(iso).getTime() : 0; }

  /* ── parsers ── */
  function parseVote(doc) {
    const f = doc.fields || {};
    const get = (k, type) => f[k] && f[k][type] !== undefined ? f[k][type] : null;
    const urlBunny  = get("urlBunny",  "stringValue");
    const urlGoogle = get("urlGoogle", "stringValue");
    return {
      _type:       "vote",
      _sortDate:   toDate(doc.createTime),
      id:          get("id",          "integerValue"),
      nameLeft:    get("nameLeft",    "stringValue"),
      nameMiddle:  get("nameMiddle",  "stringValue"),
      nameRight:   get("nameRight",   "stringValue"),
      a:           get("a",           "integerValue"),
      b:           get("b",           "integerValue"),
      c:           get("c",           "integerValue"),
      url:         urlBunny || urlGoogle || null,
      expireAt:    get("expireAt",    "integerValue"),
      showResults: get("showResults", "booleanValue"),
      createTime:  doc.createTime || null,
    };
  }

  function parsePromo(doc) {
    const f = doc.fields || {};
    const get = (k, type) => f[k] && f[k][type] !== undefined ? f[k][type] : null;
    const urlBunny  = get("urlBunny",  "stringValue");
    const urlGoogle = get("urlGoogle", "stringValue");
    return {
      _type:       "promo",
      _sortDate:   toDate(doc.createTime),
      docId:       (doc.name || "").split("/").pop(),
      ios:         get("ios",        "booleanValue"),
      android:     get("android",    "booleanValue"),
      urgent:      get("urgent",     "booleanValue"),
      minVersion:  get("minVersion", "stringValue"),
      maxVersion:  get("maxVersion", "stringValue"),
      expireAt:    get("expireAt",   "integerValue"),
      url:         urlBunny || urlGoogle || null,
      createTime:  doc.createTime || null,
    };
  }

  /* ── SVGs ── */
  const iosSVG     = `<svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>`;
  const androidSVG = `<svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4483-.9993.9993-.9993c.5511 0 .9993.4483.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4483.9993.9993 0 .5511-.4483.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 0 0-.1521-.5676.416.416 0 0 0-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 0 0-.5677-.1521.4157.4157 0 0 0-.1521.5676l1.9973 3.4592C3.6337 10.1484 2 12.716 2 15.6617h20c0-2.9457-1.6337-5.5133-4.1185-6.3403"/></svg>`;
  const fsIcon     = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><polyline points="10,2 14,2 14,6"/><polyline points="6,14 2,14 2,10"/><polyline points="14,2 9,7"/><polyline points="2,14 7,9"/></svg>`;

  /* ── shared lightbox ── */
  const lightbox = document.createElement("div");
  lightbox.className = "vote-lightbox";
  lightbox.innerHTML = `
    <button class="vote-lightbox-close" aria-label="Close">
      <svg viewBox="0 0 16 16"><line x1="2" y1="2" x2="14" y2="14"/><line x1="14" y1="2" x2="2" y2="14"/></svg>
    </button>
    <img id="vpLightboxImg" src="" alt="Full image">
  `;
  document.body.appendChild(lightbox);
  const lbImg = lightbox.querySelector("#vpLightboxImg");

  function openLightbox(src) { lbImg.src = src; lightbox.classList.add("open"); document.body.style.overflow = "hidden"; }
  function closeLightbox()   { lightbox.classList.remove("open"); document.body.style.overflow = ""; }

  lightbox.addEventListener("click", e => { if (e.target === lightbox) closeLightbox(); });
  lightbox.querySelector(".vote-lightbox-close").addEventListener("click", closeLightbox);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeLightbox(); });

  /* ── build vote card ── */
  function buildVoteCard(v) {
    const a = Number(v.a) || 0, b = Number(v.b) || 0, c = Number(v.c) || 0;
    const total = a + b + c;
    const show = v.showResults !== false;
    const pctA = show ? pct(a,total) : "—", pctB = show ? pct(b,total) : "—", pctC = show ? pct(c,total) : "—";
    const cntA = show ? fmt(a) : "—", cntB = show ? fmt(b) : "—", cntC = show ? fmt(c) : "—";
    const hasMiddle = v.nameMiddle && v.nameMiddle.trim().length > 0;
    const addedAt = fmtISO(v.createTime), endTime = fmtUnix(v.expireAt);

    let winA = false, winB = false, winC = false;
    let winnerClass = "";
    if (show && total > 0) {
      if (hasMiddle) {
        const max = Math.max(a,b,c);
        winA=a===max; winB=b===max; winC=c===max;
        winnerClass = winA?"vote-winner-a":winB?"vote-winner-b":"vote-winner-c";
      } else {
        winA=a>=b; winB=b>a;
        winnerClass = winA ? "vote-winner-a" : "vote-winner-b";
      }
    }

    const makeRow = (dotClass, name, p, cnt, isWinner) => `
      <div class="vote-option-row${isWinner ? ` ${winnerClass}` : ''}">
        <div class="vote-option-left"><span class="vote-dot ${dotClass}"></span><span class="vote-opt-name">${name}</span></div>
        <div class="vote-option-right"><span class="vote-pct">${p}</span><span class="vote-count">(${cnt})</span></div>
      </div>`;

    const rowA = makeRow("vote-dot-a", v.nameLeft||"—",   pctA, cntA, winA);
    const rowB = hasMiddle ? makeRow("vote-dot-b", v.nameMiddle||"—", pctB, cntB, winB) : makeRow("vote-dot-b", v.nameRight||"—", pctB, cntB, winB);
    const rowC = hasMiddle ? makeRow("vote-dot-c", v.nameRight||"—",  pctC, cntC, winC) : "";

    const card = document.createElement("div");
    card.className = "vote-card" + (hasMiddle ? " vote-card--three" : " vote-card--two");
    card.innerHTML = `
      <div class="vote-img-wrap">
        <img class="vote-img${hasMiddle?" vote-img--three":""}" src="${v.url||''}" alt="Vote image" loading="lazy">
        <button class="vote-fs-btn" aria-label="View full image">${fsIcon}</button>
      </div>
      <div class="vote-body">
        <div class="vote-options">${rowA}${rowB}${rowC}</div>
        ${!hasMiddle ? '<div class="vote-spacer"></div>' : ''}
        <div class="vote-divider"></div>
        <div class="vote-meta">
          <div><span class="vote-meta-key">ADDED AT:</span>&nbsp;&nbsp;${addedAt}</div>
          <div><span class="vote-meta-key">END TIME:</span>&nbsp;&nbsp;&nbsp;${endTime}</div>
        </div>
      </div>`;

    card.querySelector(".vote-img-wrap").addEventListener("click", () => openLightbox(v.url||''));
    card.querySelector(".vote-fs-btn").addEventListener("click", e => { e.stopPropagation(); openLightbox(v.url||''); });
    return card;
  }

  /* ── build promo card ── */
  function buildPromoCard(p) {
    const addedAt = fmtISO(p.createTime), endTime = fmtUnix(p.expireAt);
    let platformsHTML = "";
    if (p.ios)     platformsHTML += `<span class="promo-platform-badge promo-platform-badge--ios">${iosSVG}iOS</span>`;
    if (p.android) platformsHTML += `<span class="promo-platform-badge promo-platform-badge--android">${androidSVG}Android</span>`;
    const urgentHTML  = p.urgent ? `<span class="promo-urgent">URGENT</span>` : "";
    const versionHTML = (p.minVersion || p.maxVersion) ? `<div class="promo-version">v${p.minVersion||"0"} – v${p.maxVersion||"∞"}</div>` : "";

    const card = document.createElement("div");
    card.className = "promo-card";
    card.innerHTML = `
      <div class="promo-img-wrap">
        <img class="promo-img" src="${p.url||''}" alt="Promotion image" loading="lazy">
      </div>
      <div class="promo-footer">
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="promo-platforms">${platformsHTML}</div>
          ${urgentHTML}${versionHTML}
        </div>
        <div class="promo-divider"></div>
        <div class="promo-meta">
          <div><span class="promo-meta-key">ADDED AT:</span>&nbsp;&nbsp;${addedAt}</div>
          <div><span class="promo-meta-key">END TIME:</span>&nbsp;&nbsp;&nbsp;${endTime}</div>
        </div>
      </div>`;
    card.querySelector(".promo-img-wrap").addEventListener("click", () => openLightbox(p.url||''));
    return card;
  }

  /* ── fetch & render ── */
  async function loadAll() {
    const container = document.getElementById("allGrid");
    if (!container) return;
    container.innerHTML = '<p class="votes-loading">Loading…</p>';

    const [votesRes, promosRes, localRes] = await Promise.allSettled([
      fetch(VOTES_URL).then(r  => { if (!r.ok) throw new Error(r.status); return r.json(); }),
      fetch(PROMOS_URL).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }),
      fetch(LOCAL_JSON_URL).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }),
    ]);

    let items = [];

    if (votesRes.status === "fulfilled") {
      (votesRes.value.documents || [])
        .filter(d => !EXCLUDED_VOTE_IDS.has((d.name||"").split("/").pop()))
        .map(parseVote)
        .forEach(v => items.push(v));
    }

    if (promosRes.status === "fulfilled") {
      (promosRes.value.documents || [])
        .filter(d => !EXCLUDED_PROMO_IDS.has((d.name||"").split("/").pop()))
        .map(parsePromo)
        .forEach(p => items.push(p));
    }

    if (localRes.status === "fulfilled") {
      const raw = localRes.value;
      const existingIds = new Set(items.filter(i => i._type==="promo").map(i => i.docId));
      let localDocs = Array.isArray(raw) ? raw : raw.documents ? raw.documents : raw.fields ? [raw] : [];
      localDocs.map(parsePromo).filter(p => !existingIds.has(p.docId)).forEach(p => items.push(p));
    }

    if (!items.length) { container.innerHTML = '<p class="votes-empty">Nothing found.</p>'; return; }

    items.sort((a, b) => b._sortDate - a._sortDate);

    container.innerHTML = "";
    items.forEach(item => container.appendChild(item._type === "vote" ? buildVoteCard(item) : buildPromoCard(item)));
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", loadAll); }
  else { loadAll(); }
})();