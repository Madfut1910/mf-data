/* ============================================================
   26Promos.js  —  Fetch & render promotion cards
   ============================================================ */

(function () {
  const FIRESTORE_URL =
    "https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents/promotions/";
  const LOCAL_JSON_URL = "https://firestore.googleapis.com/v1/projects/madfut-data/databases/(default)/documents/madfut/26/promo/";

  const EXCLUDED_DOC_IDS = new Set([
    "hiO0BIxs10uNjuXxA56N"
  ]);

  /* ── helpers ── */
  function fmtUnix(secs) {
    if (!secs) return "—";
    const d = new Date(Number(secs) * 1000);
    let h = d.getHours();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${h}${ampm} ${dd}/${mm}/${yy}`;
  }

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

  /* ── parse Firestore document ── */
  function parseFirestoreDoc(doc) {
    const f = doc.fields || {};
    const get = (k, type) => f[k] && f[k][type] !== undefined ? f[k][type] : null;
    return {
      docId:      (doc.name || "").split("/").pop(),
      ios:        get("ios",        "booleanValue"),
      android:    get("android",    "booleanValue"),
      urgent:     get("urgent",     "booleanValue"),
      minVersion: get("minVersion", "stringValue"),
      maxVersion: get("maxVersion", "stringValue"),
      expireAt:   get("expireAt",   "integerValue"),
      url:        get("url",        "stringValue"),
      createTime: doc.createTime || null,
      updateTime: doc.updateTime || null,
      source:     "firestore",
    };
  }

  /* ── SVGs ── */
  const iosSVG = `<svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>`;

  const androidSVG = `<svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4483-.9993.9993-.9993c.5511 0 .9993.4483.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4483.9993.9993 0 .5511-.4483.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 0 0-.1521-.5676.416.416 0 0 0-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 0 0-.5677-.1521.4157.4157 0 0 0-.1521.5676l1.9973 3.4592C3.6337 10.1484 2 12.716 2 15.6617h20c0-2.9457-1.6337-5.5133-4.1185-6.3403"/>
  </svg>`;

  /* ── lightbox ── */
  const lightbox = document.createElement("div");
  lightbox.className = "promo-lightbox";
  lightbox.innerHTML = `
    <button class="promo-lightbox-close" aria-label="Close">
      <svg viewBox="0 0 16 16"><line x1="2" y1="2" x2="14" y2="14"/><line x1="14" y1="2" x2="2" y2="14"/></svg>
    </button>
    <img id="promoLightboxImg" src="" alt="Promotion full image">
  `;
  document.body.appendChild(lightbox);

  const lbImg = lightbox.querySelector("#promoLightboxImg");

  function openLightbox(src) {
    lbImg.src = src;
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
  }

  lightbox.addEventListener("click", e => { if (e.target === lightbox) closeLightbox(); });
  lightbox.querySelector(".promo-lightbox-close").addEventListener("click", closeLightbox);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeLightbox(); });

  /* ── build one card ── */
  function buildCard(p) {
    const addedAt = fmtISO(p.createTime);
    const endTime = fmtUnix(p.expireAt);

    let platformsHTML = "";
    if (p.ios)     platformsHTML += `<span class="promo-platform-badge promo-platform-badge--ios">${iosSVG}iOS</span>`;
    if (p.android) platformsHTML += `<span class="promo-platform-badge promo-platform-badge--android">${androidSVG}Android</span>`;

    const urgentHTML = p.urgent ? `<span class="promo-urgent">URGENT</span>` : "";

    const versionHTML = (p.minVersion || p.maxVersion)
      ? `<div class="promo-version">v${p.minVersion || "0"} – v${p.maxVersion || "∞"}</div>`
      : "";

    const card = document.createElement("div");
    card.className = "promo-card";
    card.innerHTML = `
      <div class="promo-img-wrap">
        <img class="promo-img" src="${p.url || ''}" alt="Promotion image" loading="lazy">
      </div>
      <div class="promo-footer">
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="promo-platforms">${platformsHTML}</div>
          ${urgentHTML}
          ${versionHTML}
        </div>
        <div class="promo-divider"></div>
        <div class="promo-meta">
          <div><span class="promo-meta-key">ADDED AT:</span>&nbsp;&nbsp;${addedAt}</div>
          <div><span class="promo-meta-key">END TIME:</span>&nbsp;&nbsp;&nbsp;${endTime}</div>
        </div>
      </div>
    `;

    card.querySelector(".promo-img-wrap").addEventListener("click", () => openLightbox(p.url || ''));

    return card;
  }

/* ── sort helper — newest → oldest by createTime ── */
function sortDocs(docs) {
  return docs.sort((a, b) => {
    const tA = a.createTime ? new Date(a.createTime).getTime() : 0;
    const tB = b.createTime ? new Date(b.createTime).getTime() : 0;
    return tB - tA; // newest first
  });
}

  /* ── fetch & render ── */
  async function loadPromos() {
    const container = document.getElementById("promosGrid");
    if (!container) return;

    container.innerHTML = '<p class="promos-loading">Loading promotions…</p>';

    /* fetch both sources in parallel, local failure is non-fatal */
    const [firestoreResult, localResult] = await Promise.allSettled([
      fetch(FIRESTORE_URL).then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }),
      fetch(LOCAL_JSON_URL).then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }),
    ]);

    let docs = [];

    /* Firestore docs */
    if (firestoreResult.status === "fulfilled") {
      const firestoreDocs = (firestoreResult.value.documents || [])
        .filter(doc => {
          const id = (doc.name || "").split("/").pop();
          return !EXCLUDED_DOC_IDS.has(id);
        })
        .map(parseFirestoreDoc);
      docs.push(...firestoreDocs);
    } else {
      console.warn("Firestore fetch failed:", firestoreResult.reason);
    }

    /* Local JSON — it's a Firestore document, parse it the same way */
    if (localResult.status === "fulfilled") {
      const raw = localResult.value;
      const existingIds = new Set(docs.map(d => d.docId));

      /* Could be a single doc, an array of docs, or { documents: [...] } */
      let localDocs = [];
      if (Array.isArray(raw)) {
        localDocs = raw;
      } else if (raw.documents) {
        localDocs = raw.documents;
      } else if (raw.fields) {
        /* single Firestore document */
        localDocs = [raw];
      }

      const newEntries = localDocs
        .map(parseFirestoreDoc)
        .filter(e => !existingIds.has(e.docId));
      docs.push(...newEntries);
    } else {
      console.warn("Local JSON fetch failed:", localResult.reason);
    }

    if (!docs.length) {
      container.innerHTML = '<p class="promos-empty">No promotions found.</p>';
      return;
    }

    sortDocs(docs);
    container.innerHTML = "";
    docs.forEach(p => container.appendChild(buildCard(p)));
  }

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadPromos);
} else {
  loadPromos();
}})();