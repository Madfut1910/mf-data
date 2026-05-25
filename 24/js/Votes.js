/* ============================================================
   26Votes.js  —  Fetch & render vote cards
   ============================================================ */

(function () {
  const FIRESTORE_URL =
    "https://firestore.googleapis.com/v1/projects/madfut-24/databases/(default)/documents/votes/";

  /* ── helpers ── */
  function fmt(n) {
    return Number(n).toLocaleString("en-GB");
  }

  function pct(val, total) {
    if (!total) return "0%";
    return Math.round((val / total) * 100) + "%";
  }

  /* Unix seconds → "6PM 19/10/26" */
  function fmtUnix(secs) {
    if (!secs) return "—";
    const d = new Date(Number(secs) * 1000);
    let h = d.getHours();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    const dd  = String(d.getDate()).padStart(2, "0");
    const mm  = String(d.getMonth() + 1).padStart(2, "0");
    const yy  = String(d.getFullYear()).slice(-2);
    return `${h}${ampm} ${dd}/${mm}/${yy}`;
  }

  /* ISO string → "6PM 13/12/25" */
  function fmtISO(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    let h = d.getHours();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${h}${ampm} ${dd}/${mm}/${yy}`;
  }

  /* ── parse a Firestore document ── */
function parseDoc(doc) {
  const f = doc.fields || {};
  const get = (k, type) => f[k] && f[k][type] !== undefined ? f[k][type] : null;

  const urlGoogle = get("urlGoogle", "stringValue");
  const urlBunny  = get("urlBunny", "stringValue");

  return {
    id:          get("id",          "integerValue"),
    nameLeft:    get("nameLeft",    "stringValue"),
    nameMiddle:  get("nameMiddle",  "stringValue"),
    nameRight:   get("nameRight",   "stringValue"),
    a:           get("a",           "integerValue"),
    b:           get("b",           "integerValue"),
    c:           get("c",           "integerValue"),
    
    // Prefer Bunny CDN
    url: urlBunny || urlGoogle || null,

    expireAt:    get("expireAt",    "integerValue"),
    showResults: get("showResults", "booleanValue"),
    createTime:  doc.createTime || null,
    updateTime:  doc.updateTime || null,
  };
}

  /* ── lightbox ── */
  const lightbox     = document.createElement("div");
  lightbox.className = "vote-lightbox";
  lightbox.innerHTML = `
    <button class="vote-lightbox-close" aria-label="Close">
      <svg viewBox="0 0 16 16"><line x1="2" y1="2" x2="14" y2="14"/><line x1="14" y1="2" x2="2" y2="14"/></svg>
    </button>
    <img id="voteLightboxImg" src="" alt="Vote image full">
  `;
  document.body.appendChild(lightbox);

  const lbImg = lightbox.querySelector("#voteLightboxImg");

  function openLightbox(src) {
    lbImg.src = src;
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
  }

  lightbox.addEventListener("click", e => {
    if (e.target === lightbox) closeLightbox();
  });
  lightbox.querySelector(".vote-lightbox-close").addEventListener("click", closeLightbox);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeLightbox();
  });

  /* ── build one card ── */
  function buildCard(v) {
    const a     = Number(v.a) || 0;
    const b     = Number(v.b) || 0;
    const c     = Number(v.c) || 0;
    const total = a + b + c;

    const show = v.showResults !== false;

    const pctA = show ? pct(a, total) : "—";
    const pctB = show ? pct(b, total) : "—";
    const pctC = show ? pct(c, total) : "—";
    const cntA = show ? fmt(a) : "—";
    const cntB = show ? fmt(b) : "—";
    const cntC = show ? fmt(c) : "—";

    /* determine winner */
    const hasMiddle = v.nameMiddle && v.nameMiddle.trim().length > 0;
    let winnerClass = "";
    if (show && total > 0) {
      if (hasMiddle) {
        const max = Math.max(a, b, c);
        if      (a === max) winnerClass = "vote-winner-a";
        else if (b === max) winnerClass = "vote-winner-b";
        else                winnerClass = "vote-winner-c";
      } else {
        winnerClass = a >= b ? "vote-winner-a" : "vote-winner-b";
      }
    }

    const addedAt = fmtISO(v.createTime);
    const endTime = fmtUnix(v.expireAt);

    /* fullscreen icon svg */
    const fsIcon = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <polyline points="10,2 14,2 14,6"/>
      <polyline points="6,14 2,14 2,10"/>
      <polyline points="14,2 9,7"/>
      <polyline points="2,14 7,9"/>
    </svg>`;

    /* option rows */
    const makeRow = (dotClass, name, p, cnt, isWinner) => `
      <div class="vote-option-row${isWinner ? ` ${winnerClass}` : ''}">
        <div class="vote-option-left">
          <span class="vote-dot ${dotClass}"></span>
          <span class="vote-opt-name">${name}</span>
        </div>
        <div class="vote-option-right">
          <span class="vote-pct">${p}</span>
          <span class="vote-count">(${cnt})</span>
        </div>
      </div>`;

    let winA = false, winB = false, winC = false;
    if (show && total > 0) {
      if (hasMiddle) {
        const max = Math.max(a, b, c);
        winA = a === max; winB = b === max; winC = c === max;
        /* if tie, all with max get highlighted */
      } else {
        winA = a >= b; winB = b > a;
      }
    }

    const rowA = makeRow("vote-dot-a", v.nameLeft  || "—", pctA, cntA, winA);
    const rowB = hasMiddle
      ? makeRow("vote-dot-b", v.nameMiddle || "—", pctB, cntB, winB)
      : makeRow("vote-dot-b", v.nameRight  || "—", pctB, cntB, winB);
    const rowC = hasMiddle
      ? makeRow("vote-dot-c", v.nameRight  || "—", pctC, cntC, winC)
      : "";

    const card = document.createElement("div");
    card.className = "vote-card" + (hasMiddle ? " vote-card--three" : " vote-card--two");
    card.innerHTML = `
      <div class="vote-img-wrap">
        <img class="vote-img${hasMiddle ? " vote-img--three" : ""}" src="${v.url || ''}" alt="Vote image" loading="lazy">
        <button class="vote-fs-btn" aria-label="View full image" data-src="${v.url || ''}">${fsIcon}</button>
      </div>
      <div class="vote-body">
        <div class="vote-options">
          ${rowA}
          ${rowB}
          ${rowC}
        </div>
        ${!hasMiddle ? '<div class="vote-spacer"></div>' : ''}
        <div class="vote-divider"></div>
        <div class="vote-meta">
          <div><span class="vote-meta-key">ADDED AT:</span>&nbsp;&nbsp;${addedAt}</div>
          <div><span class="vote-meta-key">END TIME:</span>&nbsp;&nbsp;&nbsp;${endTime}</div>
        </div>
      </div>
    `;

    /* image wrap click → lightbox */
    card.querySelector(".vote-img-wrap").addEventListener("click", () => {
      openLightbox(v.url || '');
    });

    /* fullscreen button click */
    card.querySelector(".vote-fs-btn").addEventListener("click", e => {
      e.stopPropagation();
      openLightbox(v.url || '');
    });

    return card;
  }

  /* ── fetch & render ── */
  async function loadVotes() {
    const container = document.getElementById("votesGrid");
    if (!container) return;

    container.innerHTML = '<p class="votes-loading">Loading votes…</p>';

    try {
      const res  = await fetch(FIRESTORE_URL);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();

      const EXCLUDED_IDS = new Set([
        "fAqrb25c0p4P9X1RValu"
      ]);

      const docs = (data.documents || [])
        .filter(doc => {
          const name = doc.name || "";
          const id = name.split("/").pop();
          return !EXCLUDED_IDS.has(id);
        })
        .map(parseDoc);
      docs.sort((x, y) => Number(y.id) - Number(x.id));

      container.innerHTML = "";

      if (!docs.length) {
        container.innerHTML = '<p class="votes-empty">No votes found.</p>';
        return;
      }

      docs.forEach(v => container.appendChild(buildCard(v)));

    } catch (err) {
      console.error("Votes fetch error:", err);
      container.innerHTML = `<p class="votes-error">Failed to load votes. Please try again later.</p>`;
    }
  }

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadVotes);
} else {
  loadVotes();
}})();