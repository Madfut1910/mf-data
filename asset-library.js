/* ══════════════════════════════════════════════════════
   LIGHTBOX - with nav arrows, swipe, keyboard, download
══════════════════════════════════════════════════════ */
const alLightbox   = document.getElementById("alLightbox");
const alLbImg      = document.getElementById("alLbImg");
const alLbName     = document.getElementById("alLbName");
const alLbDownload = document.getElementById("alLbDownload");
const alLbPrev     = document.getElementById("alLbPrev");
const alLbNext     = document.getElementById("alLbNext");
const alLbCounter  = document.getElementById("alLbCounter");
const alLbBody     = document.getElementById("alLbBody");

let lbImages = [];   /* current filtered image list */
let lbIndex  = 0;

document.getElementById("alLbClose").addEventListener("click", closeLightbox);
alLightbox.addEventListener("click", e => {
  if (e.target === alLightbox || e.target === document.getElementById("alLbBackdrop")) closeLightbox();
});

alLightbox.addEventListener("click", e => {
  console.log("clicked:", e.target, e.target.id, e.target.className);
  if (e.target === alLightbox || e.target === document.getElementById("alLbBackdrop")) closeLightbox();
});

function openLightbox(images, index) {
  lbImages = images;
  lbIndex  = index;
  showLbImage();
  alLightbox.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeLightbox() {
  alLightbox.classList.remove("open");
  document.body.style.overflow = "";
}
function showLbImage() {
  const img = lbImages[lbIndex];
  alLbImg.src           = img.url;
  alLbName.textContent  = img.name || img.url.split("/").pop().split("?")[0];
  alLbDownload.href     = img.url;
  alLbDownload.removeAttribute("download");
  alLbDownload.target   = "_blank";
  alLbPrev.disabled     = lbIndex <= 0;
  alLbNext.disabled     = lbIndex >= lbImages.length - 1;
  alLbCounter.textContent = (lbIndex + 1) + " / " + lbImages.length;
}
alLbPrev.addEventListener("click", () => { if (lbIndex > 0) { lbIndex--; showLbImage(); } });
alLbNext.addEventListener("click", () => { if (lbIndex < lbImages.length-1) { lbIndex++; showLbImage(); } });

/* Keyboard navigation */
document.addEventListener("keydown", e => {
  if (!alLightbox.classList.contains("open")) return;
  if (e.key === "ArrowLeft")  { if (lbIndex > 0) { lbIndex--; showLbImage(); } }
  if (e.key === "ArrowRight") { if (lbIndex < lbImages.length-1) { lbIndex++; showLbImage(); } }
  if (e.key === "Escape")     closeLightbox();
});

/* Touch swipe */
let _tsX = null;
alLbBody.addEventListener("touchstart", e => { _tsX = e.touches[0].clientX; }, { passive: true });
alLbBody.addEventListener("touchend",   e => {
  if (_tsX === null) return;
  const dx = e.changedTouches[0].clientX - _tsX;
  _tsX = null;
  if (Math.abs(dx) < 40) return;
  if (dx < 0 && lbIndex < lbImages.length-1) { lbIndex++; showLbImage(); }
  if (dx > 0 && lbIndex > 0)                 { lbIndex--; showLbImage(); }
});

/* ══════════════════════════════════════════════════════
   FOLDER / URL STRUCTURE
══════════════════════════════════════════════════════ */

/* Folder icon SVG */
function folderSVG(color="#000000ff") {
  return `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 24 24">
    <path d="M20,6h-8l-2-2H4C2.9,4,2,4.9,2,6v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V8C22,6.9,21.1,6,20,6z M20,18H4V8h16V18z"></path>
</svg>
    <rect x="0" y="8" width="56" height="38" rx="5" fill="${color}" opacity="0.9"/>
    <rect x="0" y="13" width="56" height="33" rx="5" fill="${color}"/>
    <rect x="0" y="8" width="22" height="10" rx="4" fill="${color}"/>
  </svg>`;
}

/* Download icon */
const dlSVG = `<svg viewBox="0 0 16 16"><line x1="8" y1="2" x2="8" y2="11"/><polyline points="4,7 8,11 12,7"/><line x1="2" y1="14" x2="14" y2="14"/></svg>`;

/* State: path = array of {id, label} */
let path = [];

/* ── Firestore endpoints ── */
const FIRESTORE = {
  "26": {
    draftCups:    "https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents/draftCups/",
    cupsLocal:    "26assets/Txt/cups.json",
    cardDesigns:  "https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents/images/",
    colorLocal:   "26/json/color.json",
    voteImages:   "https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents/votes/",
    promoImages:  "https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents/promotions/",
    promoLocal:   "26assets/Txt/promo.json",
    sbcBadges:    "https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents/sbcGroups/",
  },
  "25": {
    draftCups:    "https://firestore.googleapis.com/v1/projects/madfut-25/databases/(default)/documents/draftCups/",
    cupsLocal:    "25assets/Txt/cups.json",
    cardDesigns:  "https://firestore.googleapis.com/v1/projects/madfut-25/databases/(default)/documents/images/",
    voteImages:   "https://firestore.googleapis.com/v1/projects/madfut-25/databases/(default)/documents/votes/",
    promoImages:  "https://firestore.googleapis.com/v1/projects/madfut-25/databases/(default)/documents/promotions/",
    promoLocal:   "25assets/Txt/promo.json",
    sbcBadges:    "https://firestore.googleapis.com/v1/projects/madfut-25/databases/(default)/documents/sbcGroups/",
  },
  "24": {
    draftCups:    "https://firestore.googleapis.com/v1/projects/madfut-24/databases/(default)/documents/draftCups/",
    cupsLocal:    "24assets/Txt/cups.json",
    cardDesigns:  "https://firestore.googleapis.com/v1/projects/madfut-24/databases/(default)/documents/images/",
    voteImages:   "https://firestore.googleapis.com/v1/projects/madfut-24/databases/(default)/documents/votes/",
    promoImages:  "https://firestore.googleapis.com/v1/projects/madfut-24/databases/(default)/documents/promotions/",
    promoLocal:   "24assets/Txt/promo.json",
    sbcBadges:    "https://firestore.googleapis.com/v1/projects/madfut-24/databases/(default)/documents/sbcGroups/",
  },
};

/* ── Sub-folder definitions per year ── */
const YEAR_FOLDERS = {
  "26": [
    { id:"google-drive",   label:"Google Drive",      sub:"External link", external:"https://drive.google.com/drive/folders/1AFMhNpf90qCGPzCuvn64cStYt1yC_n1Z?usp=drive_link" },
    { id:"draft-cups",     label:"Draft Cups",         sub:"" },
    { id:"card-designs",   label:"Card Designs",       sub:"" },
    { id:"sbc",            label:"SBC Badges",         sub:"" },
    { id:"clubs",          label:"Clubs",              sub:"" },
    { id:"nations",        label:"Nations",            sub:"" },
    { id:"leagues",        label:"Leagues",            sub:"" },
    { id:"special-badges", label:"Special Badges",     sub:"" },
    { id:"vote-images",    label:"Vote Images",        sub:"" },
    { id:"promo-images",   label:"Promo Images",       sub:"" },
  ],
  "25": [
    { id:"google-drive", label:"Google Drive", sub:"External link", external:"https://drive.google.com/drive/folders/18KItrcvQ6pyAEeEe997OCjrv9kcZSsk9?usp=drive_link" },
    { id:"draft-cups",   label:"Draft Cups",   sub:"" },
    { id:"card-designs", label:"Card Designs",  sub:"" },
    { id:"sbc",          label:"SBC Badges",   sub:"" },
    { id:"vote-images",  label:"Vote Images",   sub:"" },
    { id:"promo-images", label:"Promo Images",  sub:"" },
  ],
  "24": [
    { id:"draft-cups",   label:"Draft Cups",   sub:"" },
    { id:"card-designs", label:"Card Designs",  sub:"" },
    { id:"sbc",          label:"SBC Badges",   sub:"" },
    { id:"vote-images",  label:"Vote Images",   sub:"" },
    { id:"promo-images", label:"Promo Images",  sub:"" },
  ],
};

/* ── helpers ── */

function isImageUrl(u) {
  if (!u || typeof u !== "string" || u.trim() === "") return false;
  return /\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i.test(u);
}

function resolveUrl(u) {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  try { return new URL(u, window.location.href).href; } catch(e) { return u; }
}

function cupNameFromDoc(doc) {
  const f = doc.fields || {};
  const explicit = f.name?.stringValue;
  if (explicit) return explicit;
  const imgFields = ["badgeUrl","bracketHeaderUrl","bracketWinnerUrl",
                     "squadsHeaderUrl","squadsHeaderFinalUrl","cellBackgroundUrl"];
  for (const key of imgFields) {
    const u = f[key]?.stringValue || "";
    const match = u.match(/draftCups\/([^/]+?)(?:Badge|BracketHeader|BracketWinner|SquadsHeader|SquadsHeaderFinal|CellBackground)\.png/i);
    if (match) return slugToTitle(match[1]);
  }
  return (doc.name || "").split("/").pop();
}

function slugToTitle(slug) {
  return slug
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, s => s.toUpperCase())
    .trim();
}

function assetLabel(key) {
  return key
    .replace(/Url$/i, "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, s => s.toUpperCase())
    .trim();
}


function getSortDate(doc) {
  /* Firestore REST createTime */
  if (doc.createTime) return new Date(doc.createTime).getTime();
  /* Local JSON: try fields.createTime or fields.expireAt as fallback ordering */
  const f = doc.fields || {};
  if (f.createTime?.stringValue)  return new Date(f.createTime.stringValue).getTime();
  if (f.expireAt?.integerValue)   return parseInt(f.expireAt.integerValue, 10) * 1000;
  /* Numeric doc ID as a proxy (higher id = newer) */
  const idNum = parseInt((doc.name||"").split("/").pop(), 10);
  if (!isNaN(idNum)) return idNum;
  return 0;
}

/* Parse promo doc → url. For MF24, urlBunny is the preferred CDN. */
function promoUrl(doc, year) {
  const f = doc.fields || {};
  /* For year 24 prefer the Bunny CDN URL, then Google Storage */
  if (year === "24") {
    return f.urlBunny?.stringValue || f.urlGoogle?.stringValue || f.url?.stringValue || null;
  }
  return f.url?.stringValue || f.urlBunny?.stringValue || f.urlGoogle?.stringValue || null;
}

/* Normalise local JSON to array of pseudo-docs */
function normaliseLocalDocs(raw, sourceName) {
  if (!raw) return [];
  /* Already an array of doc-like objects */
  if (Array.isArray(raw)) return raw.map((entry, i) => ({
    name: sourceName + "/" + (entry.id || i),
    createTime: entry.createTime || null,
    fields: entry.fields || entry,  /* support both wrapped and flat */
  }));
  if (raw.documents) return raw.documents;
  if (raw.fields)    return [raw];
  return [];
}

/* Pull card image entries from a Firestore images doc */
function extractCardsFromDoc(doc, images) {
  const imgArray = doc.fields?.images?.arrayValue?.values || [];
  imgArray.forEach(entry => {
    const fields = entry.mapValue?.fields || {};
    const label  = fields.name?.stringValue || fields.id?.stringValue || "Card";
    /* Also handle flat structure (color.json entries stored directly) */
const cardUrl = fields.url_big?.stringValue
  || fields.url_big_bunny?.stringValue
  || fields.url_big_google?.stringValue
  || fields.url_small?.stringValue
  || fields.url_small_bunny?.stringValue
  || fields.url_small_google?.stringValue;
if (cardUrl && isImageUrl(cardUrl)) items.push({ name: label, url: resolveUrl(cardUrl), _sort: sort });
  });
}

/* ── Fetch images for a given year + category.
   Returns array of { name, url } sorted newest→oldest, or null on hard error. ── */
async function fetchImages(year, category) {
  const cfg = FIRESTORE[year];
  if (!cfg) return [];

  let items = []; /* { name, url, _sort } */

  /* ─── DRAFT CUPS ─── */

  
  if (category === "draftCups") {
    const imgFields = ["badgeUrl","bracketHeaderUrl","bracketWinnerUrl",
                       "squadsHeaderUrl","squadsHeaderFinalUrl","cellBackgroundUrl"];

    const [fsRes, localRes] = await Promise.allSettled([
      fetch(cfg.draftCups).then(r => { if (!r.ok) throw new Error("HTTP "+r.status); return r.json(); }),
      cfg.cupsLocal ? fetch(cfg.cupsLocal).then(r => { if (!r.ok) throw new Error(); return r.json(); }) : Promise.reject("none"),
    ]);

    if (fsRes.status === "fulfilled") {
      (fsRes.value.documents || []).forEach(doc => {
        const f    = doc.fields || {};
        const name = f.name?.stringValue || (doc.name||"").split("/").pop();
        const sort = getSortDate(doc);
        imgFields.forEach(key => {
          const u = f[key]?.stringValue;
          if (u && isImageUrl(u)) {
            const label = key.replace(/([A-Z])/g, " $1").trim();
            items.push({ name: name + " - " + label, url: resolveUrl(u), _sort: sort });
          }
        });
      });
    }

    if (localRes.status === "fulfilled") {
      normaliseLocalDocs(localRes.value, cfg.cupsLocal).forEach(doc => {
        const f    = doc.fields || {};
        const name = f.name?.stringValue || (doc.name||"").split("/").pop() || "Cup";
        const sort = getSortDate(doc);
        imgFields.forEach(key => {
          const rawVal = f[key];
          const u = rawVal?.stringValue ?? (typeof rawVal === "string" ? rawVal : null);
          if (u && isImageUrl(u)) {
            const label = key.replace(/([A-Z])/g, " $1").trim();
            items.push({ name: name + " - " + label, url: resolveUrl(u), _sort: sort });
          }
        });
      });
    }

    if (fsRes.status !== "fulfilled" && localRes.status !== "fulfilled") return null;
  }

  /* ─── CARD DESIGNS ─── */
  else if (category === "cardDesigns") {
    const [fsRes, colorRes] = await Promise.allSettled([
      fetch(cfg.cardDesigns).then(r => { if (!r.ok) throw new Error("HTTP "+r.status); return r.json(); }),
      cfg.colorLocal ? fetch(cfg.colorLocal).then(r => { if (!r.ok) throw new Error(); return r.json(); }) : Promise.reject("none"),
    ]);

    const seenCardUrls = new Set();
    function pushCard(name, url, sort) {
      const resolved = resolveUrl(url);
      if (!resolved || seenCardUrls.has(resolved)) return;
      seenCardUrls.add(resolved);
      items.push({ name, url: resolved, _sort: sort });
    }

    if (fsRes.status === "fulfilled") {
      (fsRes.value.documents || []).forEach(doc => {
        const sort = getSortDate(doc);
        const imgArray = doc.fields?.images?.arrayValue?.values || [];
        imgArray.forEach(entry => {
          const fields = entry.mapValue?.fields || {};
          const label  = fields.name?.stringValue || fields.id?.stringValue || "Card";
const bigUrl   = fields.url_big?.stringValue   || fields.url_big_bunny?.stringValue   || fields.url_big_google?.stringValue;
const smallUrl = fields.url_small?.stringValue || fields.url_small_bunny?.stringValue || fields.url_small_google?.stringValue;
const microUrl = fields.url_micro?.stringValue || fields.url_micro_bunny?.stringValue || fields.url_micro_google?.stringValue;
if (bigUrl   && isImageUrl(bigUrl))   pushCard(label + " (big)",   bigUrl,   sort);
if (smallUrl && isImageUrl(smallUrl)) pushCard(label + " (small)", smallUrl, sort);
if (microUrl && isImageUrl(microUrl)) pushCard(label + " (micro)", microUrl, sort);
        });
      });
    }

    if (colorRes.status === "fulfilled") {
      const raw = colorRes.value;
      /* color.json may be:
         A) { documents: [...Firestore docs] }
         B) An array of card entries with fields.images
         C) A flat object with an "images" array of mapValue entries
         D) An array of flat card objects with url_big etc. directly */
      let colorDocs = [];
      if (raw && raw.documents)                   colorDocs = raw.documents;
      else if (Array.isArray(raw))                colorDocs = raw;
      else if (raw && raw.fields)                 colorDocs = [raw];
      else if (raw && raw.images)                 colorDocs = [{ fields: raw }];

colorDocs.forEach(doc => {
  const sort = getSortDate(doc);

  // ✅ Unwrap mapValue wrapper if present (raw Firestore array element format)
  const unwrapped = doc.mapValue ? { fields: doc.mapValue.fields } : doc;
  const f = unwrapped.fields || unwrapped;
  const label = (f.name?.stringValue ?? f.name) || (f.id?.stringValue ?? f.id) || "Card";

  /* Try Firestore-wrapped images array */
  const imgArray = unwrapped.fields?.images?.arrayValue?.values || [];
  if (imgArray.length) {
    imgArray.forEach(entry => {
      const fields = entry.mapValue?.fields || {};
      const label  = fields.name?.stringValue || fields.id?.stringValue || "Card";
      ["url_big","url_small","url_micro"].forEach(key => {
        const u = fields[key]?.stringValue
          || fields[key + "_bunny"]?.stringValue
          || fields[key + "_google"]?.stringValue;
        if (u && isImageUrl(u)) pushCard(label + " (" + key.replace("url_","") + ")", u, sort);
      });
    });
} else {
    /* Flat card entry: { name, id, url_big, url_small, url_micro } */
    const bigUrl   = (f.url_big?.stringValue   ?? (typeof f.url_big   === "string" ? f.url_big   : null)) || f.url_big_bunny?.stringValue   || f.url_big_google?.stringValue;
    const smallUrl = (f.url_small?.stringValue ?? (typeof f.url_small === "string" ? f.url_small : null)) || f.url_small_bunny?.stringValue || f.url_small_google?.stringValue;
    const microUrl = (f.url_micro?.stringValue ?? (typeof f.url_micro === "string" ? f.url_micro : null)) || f.url_micro_bunny?.stringValue || f.url_micro_google?.stringValue;
    if (bigUrl   && isImageUrl(bigUrl))   pushCard(label + " (big)",   bigUrl,   sort);
    if (smallUrl && isImageUrl(smallUrl)) pushCard(label + " (small)", smallUrl, sort);
    if (microUrl && isImageUrl(microUrl)) pushCard(label + " (micro)", microUrl, sort);
  }
});
    }

    if (fsRes.status !== "fulfilled" && colorRes.status !== "fulfilled") return null;
  }

  /* ─── SBC BADGES ─── */
else if (category === "sbcBadges") {
  try {
    const data = await fetch(cfg.sbcBadges).then(r => { if (!r.ok) throw new Error("HTTP "+r.status); return r.json(); });
    (data.documents || []).forEach(doc => {
      const f    = doc.fields || {};
      const name = f.name?.stringValue || (doc.name||"").split("/").pop();
      const sort = getSortDate(doc);
      const urlVal = f.url?.stringValue
        || f.urlBunny?.stringValue
        || f.urlGoogle?.stringValue;
      if (urlVal) {
        const isAbsolute = /^https?:\/\//.test(urlVal);
        const primaryUrl = isAbsolute ? urlVal : `https://trivela.b-cdn.net/26/sbc/${urlVal}.png`;
        const fallbackUrl = isAbsolute ? null : `https://mf-data.b-cdn.net/26/SBC/Badge/${urlVal}.png`;
        items.push({ name: name + " Badge", url: primaryUrl, fallbackUrl, _sort: sort });
      }
    });
  } catch(err) { console.error("sbcBadges:", err); return null; }
}
  /* ─── VOTE IMAGES ─── */
  else if (category === "voteImages") {
    try {
      const data = await fetch(cfg.voteImages).then(r => { if (!r.ok) throw new Error("HTTP "+r.status); return r.json(); });
      (data.documents || []).forEach(doc => {
        const f     = doc.fields || {};
        const url   = f.url?.stringValue || f.urlBunny?.stringValue || f.urlGoogle?.stringValue;
const nameL = f.nameLeft?.stringValue || "";
const nameM = f.nameMiddle?.stringValue || "";
const nameR = f.nameRight?.stringValue || "";
const label = [nameL, nameM, nameR].filter(Boolean).join(" vs ") || "Vote";
        if (url && isImageUrl(url)) items.push({ name: label, url: resolveUrl(url), _sort: getSortDate(doc) });
      });
    } catch(err) { console.error("voteImages:", err); return null; }
  }

  /* ─── PROMO IMAGES ─── */
  else if (category === "promoImages") {
    const [fsRes, localRes] = await Promise.allSettled([
      fetch(cfg.promoImages).then(r => { if (!r.ok) throw new Error("HTTP "+r.status); return r.json(); }),
      cfg.promoLocal ? fetch(cfg.promoLocal).then(r => { if (!r.ok) throw new Error(); return r.json(); }) : Promise.reject("none"),
    ]);

    const seenUrls = new Set();

    if (fsRes.status === "fulfilled") {
      (fsRes.value.documents || []).forEach(doc => {
        const u     = promoUrl(doc, year);
        const docId = (doc.name||"").split("/").pop();
        if (u && isImageUrl(u)) {
          const resolved = resolveUrl(u);
          if (!seenUrls.has(resolved)) { seenUrls.add(resolved); items.push({ name: "Promo " + docId, url: resolved, _sort: getSortDate(doc) }); }
        }
      });
    }

    if (localRes.status === "fulfilled") {
      normaliseLocalDocs(localRes.value, cfg.promoLocal).forEach(doc => {
        const u     = promoUrl(doc, year);
        const docId = (doc.name||"").split("/").pop() || "local";
        if (u && isImageUrl(u)) {
          const resolved = resolveUrl(u);
          if (!seenUrls.has(resolved)) { seenUrls.add(resolved); items.push({ name: "Promo " + docId, url: resolved, _sort: getSortDate(doc) }); }
        }
      });
    }

    if (fsRes.status !== "fulfilled" && localRes.status !== "fulfilled") return null;
  }

/* ── Sort newest → oldest ── */
items.sort((a, b) => b._sort - a._sort);

/* ── Dedupe by URL (skip for sbcBadges) ── */
if (category === "sbcBadges") return items;

const seen = new Set();
return items.filter(img => {
  if (!img.url || seen.has(img.url)) return false;
  seen.add(img.url);
  return true;
});
}

/* ══════════════════════════════════════════════════════
   RENDER FUNCTIONS
══════════════════════════════════════════════════════ */

function renderTrail() {
  const trail = document.getElementById("alTrail");
  trail.innerHTML = "";

  const root = document.createElement("span");
  root.className = "al-trail-item" + (path.length === 0 ? " active" : "");
  root.textContent = "Asset Library";
  if (path.length > 0) root.addEventListener("click", () => navigate([]));
  trail.appendChild(root);

  path.forEach((seg, i) => {
    const sep = document.createElement("span"); sep.className = "al-trail-sep"; sep.textContent = "›";
    trail.appendChild(sep);
    const item = document.createElement("span");
    item.className = "al-trail-item" + (i === path.length-1 ? " active" : "");
    item.textContent = seg.label;
    if (i < path.length-1) item.addEventListener("click", () => navigate(path.slice(0,i+1)));
    trail.appendChild(item);
  });

  document.getElementById("alBackSticky").style.display = path.length > 0 ? "block" : "none";
}

function renderYearFolders() {
  const content = document.getElementById("alContent");
  const grid = document.createElement("div");
  grid.className = "al-grid";

  ["26","25","24"].forEach(yr => {
    const folder = document.createElement("div");
    folder.className = "al-folder";
    folder.innerHTML = `
      <div class="al-folder-icon">
        <img src="https://mf-data.b-cdn.net/web/Icons/madfut_${yr}.png" alt="MADFUT ${yr}" class="al-folder-year-img" onerror="this.style.display='none'">
      </div>
      <span class="al-folder-label">MADFUT ${yr}</span>
      <span class="al-folder-sub"></span>`;
    folder.addEventListener("click", () => navigate([{id:"year-"+yr, label:"MADFUT "+yr}]));
    grid.appendChild(folder);
  });

  content.innerHTML = "";
  content.appendChild(grid);
}

function renderSubFolders(year) {
  const content = document.getElementById("alContent");
  const grid = document.createElement("div");
  grid.className = "al-grid";

  const folders = YEAR_FOLDERS[year] || [];
  folders.forEach(f => {
    const folder = document.createElement("div");

    if (f.external) {
      folder.className = "al-folder al-folder--external";
      folder.innerHTML = `
        <div class="al-folder-icon">${folderSVG("#1a73e8")}</div>
        <span class="al-folder-label">${f.label}</span>
        <span class="al-folder-sub">${f.sub}</span>`;
      folder.addEventListener("click", () => window.open(f.external, "_blank"));
    } else {
      folder.className = "al-folder";
      folder.innerHTML = `
        <div class="al-folder-icon">${folderSVG()}</div>
        <span class="al-folder-label">${f.label}</span>
        <span class="al-folder-sub">${f.sub}</span>`;
      folder.addEventListener("click", () => {
        navigate([...path, {id:f.id, label:f.label}]);
      });
    }
    grid.appendChild(folder);
  });

  content.innerHTML = "";
  content.appendChild(grid);
}

/* ── Build image grid from a filtered list ── */
function buildImageGrid(images, grid) {
  grid.innerHTML = "";
  if (!images.length) {
    grid.innerHTML = `<div class="al-empty">No images match your search.</div>`;
    return;
  }
images.forEach((img, idx) => {
  const card = document.createElement("div");
  card.className = "al-img-card";
  card.innerHTML = `
    <img class="al-img-card-thumb" src="${img.url}" alt="${img.name}" loading="lazy"${img.fallbackUrl ? ` onerror="if(!this._fb){this._fb=true;this.src='${img.fallbackUrl}'}"` : ''}>
    <div class="al-img-card-footer">
      <span class="al-img-card-name" title="${img.name}">${img.name}</span>
      <a class="al-dl-btn" href="${img.url}" target="_blank" rel="noopener" title="Download">${dlSVG}</a>
    </div>`;
  const thumb = card.querySelector(".al-img-card-thumb");
  const dlBtn = card.querySelector(".al-dl-btn");
  thumb.addEventListener("click", () => {
    const activeUrl = thumb._fb ? img.fallbackUrl : img.url;
    const activeImg = { ...img, url: activeUrl };
    const activeImages = images.map((im, i) => {
      const t = document.querySelectorAll(".al-img-card-thumb")[i];
      return t?._fb ? { ...im, url: im.fallbackUrl || im.url } : im;
    });
    openLightbox(activeImages, idx);
  });
  thumb.addEventListener("load", () => { dlBtn.href = thumb.src; });
  thumb.addEventListener("error", () => { if (thumb._fb) dlBtn.href = img.fallbackUrl; });
  grid.appendChild(card);
});
}

async function renderImages(year, category) {
  const content = document.getElementById("alContent");
  content.innerHTML = `<div class="al-img-grid"><div class="al-loading">Loading images…</div></div>`;

  const allImages = await fetchImages(year, category);

  if (allImages === null) {
    content.innerHTML = `<div class="al-img-grid"><div class="al-error">Failed to load images. Please try again.</div></div>`;
    return;
  }
  if (!allImages.length) {
    content.innerHTML = `<div class="al-img-grid"><div class="al-empty">No images found.</div></div>`;
    return;
  }

  /* Build UI: search bar + count + grid */
  content.innerHTML = "";

  /* Search bar row */
  const searchWrap = document.createElement("div");
  searchWrap.className = "al-search-wrap";
  searchWrap.innerHTML = `
    <div class="al-search">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" id="alSearchInput" placeholder="SEARCH ${allImages.length} IMAGES…" autocomplete="off" spellcheck="false">
    </div>
    <span class="al-count" id="alCountLabel">${allImages.length} images</span>`;
  content.appendChild(searchWrap);

  /* Image grid */
  const grid = document.createElement("div");
  grid.className = "al-img-grid";
  content.appendChild(grid);
  buildImageGrid(allImages, grid);

  /* Live filter — scoped to this folder's images only */
  document.getElementById("alSearchInput").addEventListener("input", function() {
    const q = this.value.trim().toLowerCase();
    const filtered = q ? allImages.filter(img => img.name.toLowerCase().includes(q)) : allImages;
    document.getElementById("alCountLabel").textContent = filtered.length + " of " + allImages.length + " images";
    buildImageGrid(filtered, grid);
  });
}

/* ══════════════════════════════════════════════════════
   NAVIGATION - hash-based for shareable links
══════════════════════════════════════════════════════ */

const CATEGORY_MAP = {
  "draft-cups":     "draftCups",
  "card-designs":   "cardDesigns",
  "sbc-badges":     "sbcBadges",
  "sbc":            "sbc",
  "clubs":          "clubs",
  "nations":        "nations",
  "leagues":        "leagues",
  "special-badges": "specialBadges",
  "vote-images":    "voteImages",
  "promo-images":   "promoImages",
};

let _suppressHashChange = false;

function navigate(newPath) {
  path = newPath;
  const hash = path.map(s => s.id).join("/");
  _suppressHashChange = true;
  window.location.hash = hash ? "#" + hash : "#";
  render();
}

function render() {
  renderTrail();

  if (path.length === 0) { renderYearFolders(); return; }

  const seg0 = path[0]?.id || "";
  const year  = seg0.replace("year-","");

  if (path.length === 1) { renderSubFolders(year); return; }

  const seg1   = path[1]?.id || "";
  const catKey = CATEGORY_MAP[seg1];

  if (!catKey) { navigate([]); return; }

  if (catKey === "draftCups") {
    if (path.length === 2) { renderDraftCupFolders(year); return; }
    if (path.length === 3) { renderDraftCupImages(year, path[2].id); return; }
  }

  if (catKey === "clubs") {
    if (path.length === 2) { renderSizeFolders(year, "clubs"); return; }
    if (path.length === 3) { renderBadgeImages(year, "clubs", path[2].id); return; }
  }

  if (catKey === "nations") {
    if (path.length === 2) { renderSizeFolders(year, "nations"); return; }
    if (path.length === 3) { renderBadgeImages(year, "nations", path[2].id); return; }
  }

  if (catKey === "leagues") {
    if (path.length === 2) { renderSizeFolders(year, "leagues"); return; }
    if (path.length === 3) { renderBadgeImages(year, "leagues", path[2].id); return; }
  }

  if (catKey === "specialBadges") {
    if (path.length === 2) { renderAchievementLockFolders(); return; }
    if (path.length === 3) { renderAchievementImages(path[2].id); return; }
  }

  if (catKey === "sbc") {
    if (path.length === 2) { renderSbcSubFolders(year); return; }
    if (path.length === 3) { renderSbcImages(year, path[2].id); return; }
  }

  if (catKey) { renderImages(year, catKey); return; }

  navigate([]);
}
/* Back button */
document.getElementById("alBack").addEventListener("click", () => {
  navigate(path.slice(0, -1));
});


let _draftCupCache = {};

async function getDraftCupDocs(year) {
  if (_draftCupCache[year]) return _draftCupCache[year];
  const cfg = FIRESTORE[year];
  const docs = [];

  /* Try local file first, fall back to Firestore */
  let usedLocal = false;
  if (cfg.cupsLocal) {
    try {
      const r = await fetch(cfg.cupsLocal);
      if (r.ok) {
        const json = await r.json();
        docs.push(...normaliseLocalDocs(json, cfg.cupsLocal));
        usedLocal = true;
      }
    } catch(e) { /* fall through to Firestore */ }
  }

  if (!usedLocal && cfg.draftCups) {
    try {
      const r = await fetch(cfg.draftCups);
      if (r.ok) {
        const json = await r.json();
        const EXCLUDED_IDS = ["3s1s8rWGwVNzpNBBetqy", "1l80Ip0oZSbFgXh4Tf5t", "aCCJJbHJSQundGXFGYGf"];
docs.push(...(json.documents || []).filter(d => {
  const id = (d.name || "").split("/").pop();
  return !EXCLUDED_IDS.includes(id);
}));
      } else {
        console.error("Firestore draftCups fetch failed:", r.status);
      }
    } catch(e) { console.error("getDraftCupDocs Firestore:", e); }
  }

  _draftCupCache[year] = docs;
  return docs;
}

async function renderDraftCupFolders(year) {
  const content = document.getElementById("alContent");
  content.innerHTML = `<div class="al-loading">Loading cups…</div>`;

const rawDocs = await getDraftCupDocs(year);
const docs = [...rawDocs].sort((a, b) => getSortDate(b) - getSortDate(a));
if (!docs.length) {
    content.innerHTML = `<div class="al-empty">No draft cups found.</div>`;
    return;
  }

  content.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "al-grid";

  docs.forEach(doc => {
    const cupName = cupNameFromDoc(doc);
    const cupId   = (doc.name || "").split("/").pop() || cupName;

    const folder = document.createElement("div");
    folder.className = "al-folder";
const f24 = doc.fields || {};
const badgeUrl = f24.badgeUrl?.stringValue
  || f24.badgeUrlBunny?.stringValue
  || f24.badgeUrlGoogle?.stringValue
  || "";
    folder.innerHTML = `
      <div class="al-folder-icon" style="width:72px;height:72px;">
        ${badgeUrl
          ? `<img src="${badgeUrl}" alt="${cupName}" style="width:100%;height:100%;object-fit:contain;" onerror="this.style.display='none'">`
          : folderSVG()}
      </div>
      <span class="al-folder-label">${cupName}</span>
      <span class="al-folder-sub"></span>`;
    folder.addEventListener("click", () => navigate([...path, { id: cupId, label: cupName }]));
    grid.appendChild(folder);
  });

  content.appendChild(grid);
}

const DRAFT_IMG_FIELDS = ["badgeUrl","bracketHeaderUrl","bracketWinnerUrl",
                           "squadsHeaderUrl","squadsHeaderFinalUrl","cellBackgroundUrl"];

async function renderDraftCupImages(year, cupId) {
  const content = document.getElementById("alContent");
  content.innerHTML = `<div class="al-loading">Loading images…</div>`;

  const docs = await getDraftCupDocs(year);
  const doc  = docs.find(d => (d.name || "").split("/").pop() === cupId);
  if (!doc) {
    content.innerHTML = `<div class="al-empty">Cup not found.</div>`;
    return;
  }

  const cupName = cupNameFromDoc(doc);
  const f       = doc.fields || {};
  const images  = [];

  /* Each logical asset has a label and a priority-ordered list of field names to try */
  const ASSET_SLOTS = [
    { label: "Badge",                keys: ["badgeUrl",              "badgeUrlBunny",              "badgeUrlGoogle"]              },
    { label: "Bracket Header",       keys: ["bracketHeaderUrl",      "bracketHeaderUrlBunny",      "bracketHeaderUrlGoogle"]      },
    { label: "Bracket Winner",       keys: ["bracketWinnerUrl",      "bracketWinnerUrlBunny",      "bracketWinnerUrlGoogle"]      },
    { label: "Squads Header",        keys: ["squadsHeaderUrl",       "squadsHeaderUrlBunny",       "squadsHeaderUrlGoogle"]       },
    { label: "Squads Header Final",  keys: ["squadsHeaderFinalUrl",  "squadsHeaderFinalUrlBunny",  "squadsHeaderFinalUrlGoogle"]  },
    { label: "Cell Background",      keys: ["cellBackgroundUrl",     "cellBackgroundUrlBunny",     "cellBackgroundUrlGoogle"]     },
  ];

  ASSET_SLOTS.forEach(slot => {
    for (const key of slot.keys) {
      const u = f[key]?.stringValue ?? (typeof f[key] === "string" ? f[key] : null);
      if (u && isImageUrl(u)) {
        images.push({ name: cupName + " " + slot.label, url: resolveUrl(u), _sort: 0 });
        break; /* use first available URL, don't add duplicates */
      }
    }
  });

  if (!images.length) {
    content.innerHTML = `<div class="al-empty">No images for this cup.</div>`;
    return;
  }

  content.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "al-img-grid";
  content.appendChild(grid);
  buildImageGrid(images, grid);
}

/* ── Generic Large / Small size picker ── */
function renderSizeFolders(year, catKey) {
  const content = document.getElementById("alContent");
  content.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "al-grid";

  const folders = [
    { id: "large", label: "Large" },
    { id: "small", label: "Small" },
    ...(catKey === "nations" ? [{ id: "badges", label: "Badges" }] : []),
  ];

  folders.forEach(f => {
    const folder = document.createElement("div");
    folder.className = "al-folder";
    folder.innerHTML = `
      <div class="al-folder-icon">${folderSVG()}</div>
      <span class="al-folder-label">${f.label}</span>
      <span class="al-folder-sub"></span>`;
    folder.addEventListener("click", () => navigate([...path, { id: f.id, label: f.label }]));
    grid.appendChild(folder);
  });

  content.appendChild(grid);
}

/* ── Badge config per category ── */
const BADGE_CONFIG = {
  clubs: {
    urlFn: (size, id) => `https://mf-data.b-cdn.net/26/Badges/Clubs/${size === "large" ? "Large" : "Small"}/club_${size}_${id}.png`,
    label: "clubs",
  },
  nations: {
    urlFn: (size, id) => size === "badges"
      ? `https://mf-data.b-cdn.net/26/Badges/Achievements/Nation/nation_badge_${id}.png`
      : `https://mf-data.b-cdn.net/26/Badges/Nations/${size === "large" ? "Large" : "Small"}/nation_${size}_${id}.png`,
    label: "nations",
  },
  leagues: {
    urlFn: (size, id) => `https://mf-data.b-cdn.net/26/Badges/Leagues/${size === "large" ? "Large" : "Small"}/league_${size}_${id}.png`,
    label: "leagues",
  },
};

/* ── ID → Name maps ── */
const CLUB_ID_TO_NAME = {"1":"Arsenal","2":"Aston Villa","3":"Blackburn Rovers","4":"Bolton","5":"Chelsea","7":"Everton","8":"Leeds United","9":"Liverpool","10":"Manchester City","11":"Manchester Utd","12":"Middlesbrough","13":"Newcastle Utd","14":"Nott'm Forest","15":"QPR","17":"Southampton","18":"Spurs","19":"West Ham","21":"Bayern München","22":"Borussia Dortmund","23":"M'gladbach","25":"Freiburg","27":"Hansa Rostock","28":"Hamburger","29":"Kaiserslautern","31":"Köln","32":"Leverkusen","33":"1860 München","34":"Schalke 04","36":"Stuttgart","38":"Werder Bremen","45":"Juventus","47":"Milan","48":"Napoli","50":"Parma","52":"Roma","54":"Torino","55":"Udinese","57":"Auxerre","58":"Bastia","59":"Bordeaux","62":"Guingamp","64":"Lens","65":"Lille","66":"OL","67":"FC Martigues","68":"Metz","69":"Monaco","70":"Montpellier","71":"Nantes","72":"Nice","73":"PSG","74":"Rennais","76":"Strasbourg","77":"Aberdeen","78":"Celtic","79":"Falkirk","80":"Hearts","81":"Hibernian","82":"Kilmarnock","83":"Motherwell","86":"Rangers","88":"Birmingham City","89":"Charlton Ath","91":"Derby County","92":"Grimsby Town","94":"Ipswich","95":"Leicester City","97":"Millwall","106":"Sunderland","109":"West Brom","110":"Wolves","121":"Crewe Alexandra","127":"Shrewsbury","135":"Barnet","142":"Doncaster","143":"Exeter City","144":"Fulham","149":"Lincoln City","159":"Arminia Bielefeld","160":"Bochum","162":"Energie Cottbus","165":"Fürth","166":"Hertha Berlin","169":"Mainz 05","171":"Nürnberg","172":"Unterhaching","175":"Wolfsburg","180":"Dundee","181":"Dundee United","189":"Bologna","191":"RB Salzburg","200":"Pescara Calcio","205":"Venezia","206":"Hellas Verona","209":"Sturm Graz","210":"Caen","211":"Dinamo Zagreb","217":"Lorient","219":"OM","229":"Anderlecht","230":"Royal Antwerp","231":"Club Brugge","232":"Standard Liège","234":"Benfica","236":"Porto","237":"Sporting","240":"Atlético","241":"Barcelona","242":"RC Deportivo","243":"Real Madrid","244":"Real Zaragoza","245":"SC Amsterdam","246":"Rotterdam South","247":"Eindhoven Reds","252":"LASK","254":"Rapid Wien","256":"Austria Wien","260":"Tenerife","263":"Hajduk Split","266":"Slavia Praha","267":"Sparta Praha","269":"Brøndby","270":"Silkeborg","271":"AGF","272":"Odense","278":"AEK Athens","280":"Olympiacos FC","294":"ESTAC Troyes","298":"Rosenborg","299":"Lillestrøm","300":"Viking","301":"Widzew Łódź","305":"Bohemian","306":"Shamrock Rovers","308":"Univ. Craiova","310":"Rapid 1923","319":"Göteborg","320":"Malmö","321":"Halmstads","322":"Grasshopper Club","324":"Servette","325":"Galatasaray","326":"Fenerbahçe","327":"Beşiktaş","347":"Lecce","357":"Morecambe","361":"Stevenage","378":"Brestois","379":"Reims","381":"Barrow","383":"Palmeiras","393":"PAOK","417":"Molde FK","418":"Tromsø IL","420":"Górnik Zabrze","422":"Cork City","423":"St. Pats","433":"AIK","436":"Trabzonspor","445":"Derry City","448":"Athletic Club","449":"Real Betis","450":"Celta","452":"Espanyol","453":"Mallorca","456":"Racing Club","457":"Real Sociedad","459":"Real Sporting","461":"Valencia","462":"Valladolid","463":"D. Alavés","467":"Eibar","468":"Elche","472":"Las Palmas","479":"Osasuna","480":"Rayo Vallecano","481":"Sevilla","483":"Villarreal","485":"Hannover 96","487":"Osnabrück","489":"Farense","492":"Wehen Wiesbaden","503":"Dynamo Dresden","506":"Erzgebirge Aue","517":"Botafogo","518":"GD Chaves","523":"Saarbrücken","526":"Rot-Weiss Essen","531":"Preußen Münster","537":"FCV Dender EH","543":"Jahn Regensburg","561":"Forest Green","563":"Sligo Rovers","567":"Fluminense","568":"Cruzeiro","569":"Vasco da Gama","570":"Ternana","573":"Málaga CF","576":"Holstein Kiel","580":"Elversberg","583":"FC Schweinfurt 05","598":"São Paulo","605":"Al Hilal","607":"Al Ittihad","614":"Ajaccio","621":"Livingston","631":"Ross County","634":"Sittard FC","645":"Markermeer","670":"Sp. Charleroi","673":"Genk","674":"Gent","675":"K. Beerschot VA","680":"STVV","681":"KVC Westerlo","687":"Columbus Crew","688":"D.C. United","689":"Red Bulls","691":"New England","693":"Chicago Fire","694":"Colorado Rapids","695":"Dallas","696":"Sporting KC","697":"LA Galaxy","698":"Houston Dynamo","700":"Elfsborg","702":"Norrköping","708":"Hammarby","710":"Djurgårdens","711":"Häcken","717":"FC Alverca","718":"Estrela Amadora","741":"Antalyaspor","744":"Rio Ave","746":"İstanbulspor","748":"Samsunspor","753":"Waterford","780":"SV Oberbank Ried","781":"Austria","819":"København","820":"AaB","822":"Vejle Boldklub","834":"Shelbourne","837":"Dundalk","873":"Lech Poznań","874":"Ruch Chorzów","894":"Zürich","896":"Basel 1893","897":"Luzern","898":"St. Gallen","900":"Young Boys","917":"Stabæk Fotball","918":"Bodø/Glimt","919":"Brann","920":"Vålerenga Fotball","922":"Strømsgodset","980":"Daejeon Citizen","982":"Seoul","983":"Suwon Samsung","1013":"San Lorenzo","1035":"Atlético Mineiro","1039":"Athletico-PR","1041":"Corinthians","1043":"Flamengo","1048":"Internacional","1053":"Santos","1438":"Santa Clara","1439":"Kalmar","1443":"Viborg","1447":"Sønderjyske","1456":"Odds BK","1463":"Haugesund","1473":"Ulsan Hyundai","1474":"Pohang Steelers","1477":"Jeonbuk Hyundai","1478":"Jeju United","1480":"Carlisle United","1516":"Midtjylland","1523":"Bryne Fotballklubb","1530":"Angers SCO","1569":"Wisła Płock","1571":"Galway United","1572":"Drogheda United","1598":"Bahia","1629":"Grêmio","1704":"Yverdon Sport","1713":"Winterthur","1715":"FC Thun","1719":"Vitória","1738":"Havre AC","1739":"Le Mans FC","1744":"Modena","1745":"Como","1746":"Empoli","1750":"Cercle Brugge","1755":"Aalesunds FK","1756":"HamKam Fotball","1757":"Sandefjord","1786":"Randers","1787":"Austria Klagenfurt","1788":"Nordsjaelland","1790":"Portsmouth","1792":"Norwich","1793":"Reading","1794":"Sheffield Utd","1795":"Watford","1796":"Burnley","1797":"Rotherham Utd","1798":"MK Dons","1799":"Crystal Palace","1800":"Coventry City","1801":"Preston","1802":"Gillingham","1803":"Walsall","1804":"Bradford City","1805":"Grenoble Foot","1806":"Stoke City","1807":"Sheffield Wed","1808":"Brighton","1809":"Toulouse","1814":"Lavallois","1815":"Clermont Foot","1816":"Amiens","1819":"AS Saint-Étienne","1823":"AS Nancy Lorraine","1824":"Frankfurt","1825":"Duisburg","1826":"Aleman. Aachen","1829":"Lübeck","1831":"Union Berlin","1832":"Karlsruher","1837":"Sampdoria","1842":"Cagliari","1843":"Palermo","1846":"Borgocalcio","1847":"Ascoli","1848":"Bari","1853":"Levante UD","1854":"Albacete BP","1860":"Getafe","1861":"UD Almería","1862":"Lausanne-Sport","1867":"Córdoba CF","1870":"Östers IF","1871":"Legia Warszawa","1874":"Ferencvárosi TC","1876":"River Plate","1877":"Boca Juniors","1884":"Panathinaikos","1887":"Arouca","1888":"Gil Vicente","1891":"Nacional","1894":"AD Ceuta FC","1896":"Braga","1898":"Boavista","1900":"Moreirense","1903":"Utrecht","1904":"Breda","1905":"RKC Waalwijk","1906":"AZ","1907":"Willem II","1908":"Twente","1909":"Vitesse","1910":"Nijmegen","1913":"Heerenveen","1914":"Zwolle Blues","1915":"FC North","1917":"Wigan Athletic","1919":"Bristol City","1920":"Oldham Athletic","1923":"Luton Town","1924":"Chesterfield","1925":"Brentford","1926":"Blackpool","1928":"Port Vale","1929":"Plymouth Argyle","1930":"Northampton","1931":"Stockport","1932":"Barnsley","1933":"Wycombe","1934":"Swindon Town","1935":"Colchester","1936":"Cheltenham Town","1937":"Notts County","1938":"Peterborough","1939":"Huddersfield","1940":"Mansfield Town","1943":"Bournemouth","1944":"Cambridge Utd","1947":"Wrexham AFC","1951":"Oxford United","1952":"Hull City","1958":"Leyton Orient","1960":"Swansea City","1961":"Cardiff City","1962":"Bristol Rovers","1968":"Cádiz","1971":"Honingerdijk","2002":"Hvidovre IF","2013":"KAS Eupen","2014":"R. Union St.-G.","2017":"Hartberg","2038":"Avellino","2041":"Fredrikstad FK","2055":"Gimcheon Sangmu","2056":"Daegu","8001":"RWD Molenbeek","10020":"Estoril Praia","10029":"TSG Hoffenheim","10030":"Paderborn 07","10031":"Portimonense","10032":"Lugano","10846":"Burgos","15001":"Lyngby BK","15005":"SV Zulte Waregem","15006":"FC Fredericia","15009":"SCR Altach","15012":"Cultural Leonesa","15015":"Burton Albion","15029":"Universidad de Chile","15040":"WSG Tirol","15048":"Tranmere Rovers","100081":"KV Kortrijk","100087":"OH Leuven","100135":"Apoel","100325":"HJK Helsinki","100409":"Augsburg","100632":"Deventer CF","100634":"Almelo","100638":"Telstar","100646":"Rotterdam OG","100757":"Dinamo 1948","100759":"FC Argeș","100761":"FCSB","100804":"St. Johnstone","100805":"St. Mirren","100831":"AD Alcorcón","100851":"Cartagena","100852":"CD Castellón","100888":"CD Leganés","101007":"MKE Ankaragücü","101014":"Başakşehir","101016":"Adana Demirspor","101020":"Kayserispor","101025":"Gençlerbirliği SK","101026":"Göztepe","101028":"Hatayspor","101032":"Kocaelispor","101033":"Konyaspor","101037":"Çaykur Rizespor","101041":"Sivasspor","101047":"Dynamo Kyiv","101059":"Shakhtar Donetsk","101083":"Estudiantes","101084":"Gimnasia","101085":"Racing Club","101088":"Vélez Sarsfield","101097":"Audax Italiano","101099":"América de Cali","101100":"Atl. Nacional","101101":"Junior","101103":"Indep. Medellín","101104":"Santa Fe","101105":"Millonarios","101106":"Once Caldas","101108":"Olimpia","101109":"Defensor","101110":"Peñarol","101112":"Whitecaps","110062":"Girona","110069":"CD Mirandés","110072":"Oțelul Galați","110075":"Farul Constanța","110078":"Petrolul","110093":"Independiente","110176":"Ulm 1846","110178":"Sandhausen","110206":"GKS Katowice","110242":"Racing de Ferrol","110313":"Accrington","110321":"Pau","110329":"St. Pauli","110373":"Salernitana","110374":"Fiorentina","110394":"Arsenal","110395":"Lanús","110396":"Newell's","110404":"Banfield","110406":"Colón","110456":"Valenciennes","110468":"Viktoria Plzeň","110482":"Hallescher","110500":"Braunschweig","110501":"Verl","110502":"Darmstadt 98","110532":"Waldhof","110556":"Genoa","110580":"Rosario Central","110588":"Magdeburg","110636":"Düsseldorf","110645":"Viktoria Köln","110676":"B. Dortmund II","110678":"TSV Havelse","110683":"Hannover 96 II","110685":"TSG Hoffenheim II","110691":"Freiburg II","110697":"VfB Stuttgart II","110711":"Real Sociedad B","110720":"Blau-Weiss Linz","110724":"KV Mechelen","110738":"Pisa","110740":"Reggiana","110745":"Jagiellonia","110746":"Pogoń Szczecin","110747":"Cracovia","110749":"Zagłębie Lubin","110750":"UTA Arad","110751":"Univ. Cluj","110752":"Botoșani","110765":"Incheon United","110770":"FC Sion","110776":"Gaziantep","110799":"Sutton United","110815":"Politehnica Iași","110827":"R. Oviedo","110832":"Granada","110839":"SD Huesca","110890":"Crawley Town","110902":"Villarreal B","110908":"Catanzaro","110912":"Calcio Padova","110915":"Cesena","110953":"Instituto","110955":"Shanghai Shenhua","110967":"Blooming","110968":"Bolívar","110969":"The Strongest","110970":"O. Petrolero","110974":"Wilstermann","110975":"Uni. Católica","110977":"Unión Española","110978":"Cobresal","110980":"Colo-Colo","110981":"Barcelona SC","110982":"Dep. Cuenca","110984":"CS Emelec","110986":"LDU Quito","110987":"Aucas","110989":"Caracas F.C.","110990":"Dep. Táchira","110991":"Carabobo FC","110993":"Monagas","110998":"Danubio","111001":"Wanderers","111004":"Tacuary","111006":"Sportivo Luqueño","111008":"Libertad","111010":"Alianza Lima","111011":"Cienciano","111013":"Sporting Cristal","111014":"Universitario","111019":"Argentinos Jrs.","111020":"Ind. Rivadavia","111022":"Belgrano","111042":"Goiás","111052":"Fortaleza","111065":"Real Salt Lake","111082":"Arka Gdynia","111083":"Korona Kielce","111085":"ŁKS Łódź","111086":"Piast Gliwice","111088":"Radomiak Radom","111091":"Lechia Gdańsk","111092":"Śląsk Wrocław","111097":"Motor Lublin","111117":"Karagümrük SK","111132":"UCD AFC","111138":"Minnesota United","111139":"CF Montréal","111140":"Portland Timbers","111144":"Sounders","111235":"Heidenheim","111239":"Ingolstadt 04","111273":"Red Star FC","111276":"USL Dunkerque","111325":"Nacional","111326":"Liverpool","111327":"Huachipato","111328":"Palestino","111329":"Guaraní","111332":"Est. de Mérida","111334":"FBC Melgar","111339":"Kasımpaşa","111380":"Almere","111393":"Adelaide United","111395":"Brisbane Roar","111396":"Central Coast","111397":"Melb. Victory","111398":"Newcastle Jets","111399":"Perth Glory","111400":"Sydney","111433":"Mantova","111434":"Cremonese","111539":"Vizela","111594":"GAIS","111629":"East Bengal","111633":"Mohammedan SC","111651":"Toronto","111657":"Frosinone","111659":"Rodez AF","111674":"Al Shabab","111701":"Al Ain","111705":"Brommapojkarna","111706":"Godoy Cruz","111707":"Atlético Aldosivi","111708":"Atlético Tucumán","111710":"Defensa","111711":"Huracán","111713":"Atlético San Martín","111715":"Tigre","111716":"Unión","111722":"Deportes Tolima","111724":"Shandong Taishan","111766":"Well. Phoenix","111768":"Beijing Guoan","111769":"Changchun Yatai","111773":"Shenzhen","111774":"Tianjin JMT","111779":"Henan SSLM","111811":"Monza","111817":"Paris","111822":"Wolfsberger AC","111928":"SJ Earthquakes","111974":"Sassuolo","111993":"Cittadella","112001":"América Mineiro","112072":"Mjällby AIF","112096":"Ettifaq","112115":"Gangwon","112124":"SS Juve Stabia","112126":"Värnamo","112134":"Philadelphia","112139":"Al Nassr","112163":"Zhejiang Pro","112168":"Cosenza","112172":"RB Leipzig","112180":"Västerås SK","112184":"River Plate","112199":"Sarpsborg 08","112222":"Harrogate Town","112224":"Melbourne City","112254":"Newport County","112258":"GwangJu","112259":"Wimbledon","112260":"Fleetwood Town","112378":"Dalian Pro","112387":"Al Ahli","112390":"Al Fateh","112391":"Al Qadisiyah","112392":"Al Raed","112393":"Al Taawoun","112408":"Al Wehda","112427":"WS Wanderers","112472":"RB Bragantino","112493":"Carrarese Calcio","112494":"Südtirol","112499":"FeralpisalÒ","112510":"Termalica Nieciecza","112511":"Warta Poznań","112513":"Arouca","112516":"CD Tondela","112531":"Deportes Iquique","112535":"Unión La Calera","112540":"Shanghai Port","112552":"Quevilly Rouen","112555":"FC Anyang","112558":"Suwon","112572":"Al Tai","112578":"Águilas Doradas","112584":"Everton","112585":"Ñublense","112606":"Orlando City","112615":"Racing Club","112658":"Icons","112667":"Nacional Potosí","112670":"Talleres","112671":"Club Nacional","112675":"Al Orobah","112689":"Platense","112705":"Coquimbo Unido","112707":"Club Magallanes","112713":"Sarmiento","112716":"Cerro Porteño","112744":"Dep. Pereira","112764":"Bromley FC","112809":"Famalicão","112828":"New York City","112853":"Dep. La Guaira","112868":"Boston River","112883":"Al Khaleej","112885":"Atlanta United","112893":"Inter Miami","112908":"Independiente DV","112914":"Metropolitanos","112965":"Central Córdoba","112979":"Nantong Zhiyun","112985":"Cangzhou","112992":"Atlético Bucaramanga","112996":"LAFC","113018":"St. Louis CITY","113029":"UCV","113037":"Al Riyadh","113040":"NorthEast United","113044":"Barracas Central","113057":"Al Fayha","113058":"Abha Club","113060":"Al Okhdood","113142":"Alanyaspor","113146":"ATK Mohun Bagan","113147":"Virtus Entella","113149":"Cincinnati","113182":"Voluntari","113217":"Damac","113222":"Al Hazem","113257":"Odisha","113297":"Chennaiyin","113298":"Goa","113299":"Kerala Blasters","113300":"Mumbai City","113301":"Hyderabad","113302":"Bengaluru","113356":"SD Amorebieta","113378":"Sepsi OSK","113458":"IK Sirius","113459":"Kristiansund BK","113616":"Grazer AK","113742":"US Concarneau","113743":"Varbergs BoIS","113746":"Técnico U.","113888":"Qarabağ FK","113892":"Degerfors IF","113926":"Salford City","113973":"Brisigonza","113974":"Spezia","114004":"Stal Mielec","114023":"Western United","114147":"Hermannstadt","114161":"Austin","114162":"Nashville","114168":"Jamshedpur","114326":"Raków","114385":"CFR 1907 Cluj","114393":"Puszcza","114510":"Casa Pia AC","114511":"Sport Huancayo","114545":"FC Metaloglobus","114546":"FK Csíkszereda","114549":"FC Gloria Buzău","114554":"Andorra","114577":"Always Ready","114580":"Delfín S.C.","114581":"U. Católica","114582":"Binacional","114598":"Atlético Grau","114600":"Guabirá","114604":"Macarthur","114605":"Heroes","114611":"Puerto Cabello","114615":"Mushuc Runa","114628":"Meizhou Hakka","114640":"Charlotte","114912":"Racing Club","115201":"Stade-Lausanne","115202":"Punjab","115358":"Palmaflor","115472":"Dep. Riestra","115491":"Real Tomayapo","115536":"Cerro Largo","115716":"FCU 1948","115841":"Latium","115845":"Bergamo Calcio","115892":"Al Najmah","116000":"Turbine Potsdam","116001":"SGS Essen","116005":"Carl Zeiss Jena","116007":"Gral. Caballero","116036":"Fleury 91","116039":"Dijon","116044":"AS Saint Étienne","116263":"ADT","116292":"Universitario","116295":"S. Ameliano","116300":"OL Reign","116303":"NC Courage","116304":"Washington Spirit","116305":"Chicago Red Stars","116306":"Houston Dash","116307":"Orlando Pride","116308":"Rac. Louisville","116309":"KC Current","116310":"NJ/NY Gotham","116311":"Angel City","116312":"San Diego Wave","116323":"S. Trinidense","116332":"UDG Tenerife","116334":"Madrid CFF","116338":"Sporting Huelva","116360":"Rongcheng","116361":"Wuhan 3 Towns","116365":"Racing Club","131110":"CD Eldense","131123":"Alhama CF ElPozo","131125":"Levante LP","131161":"Dep. Garcilaso","131173":"Qingdao Hainiu","131174":"Eyüpspor","131388":"Bodrum FK","131389":"Pendikspor","131439":"San Diego FC","131447":"Annecy","131459":"Unirea Slobozia","131463":"AVS Futebol SAD","131474":"Rayo Zuliano","131477":"Bay FC","131478":"Utah Royals FC","131487":"SZ Peng City","131488":"Qingdao W. Coast","131491":"KFUM-Kameratene","131511":"Alianza FC","131531":"Yunnan Yukun FC","131681":"Milano FC","131682":"Lombardia FC","131735":"Al Kholood","131739":"Auckland FC","131795":"San Antonio","131798":"Neom","132176":"Lionesses","132231":"RAAL La Louvière","132305":"Dalian Young Boy","132375":"GV San José","132629":"DUX Logroño","132680":"US Boulogne"};

const NATION_ID_TO_NAME = {"1":"Albania","2":"Andorra","3":"Armenia","4":"Austria","5":"Azerbaijan","6":"Belarus","7":"Belgium","8":"Bosnia Herzegovina","9":"Bulgaria","10":"Croatia","11":"Cyprus","12":"Czech Republic","13":"Denmark","14":"England","15":"Montenegro","16":"Faroe Islands","17":"Finland","18":"France","19":"FYR Macedonia","20":"Georgia","21":"Germany","22":"Greece","23":"Hungary","24":"Iceland","25":"Republic of Ireland","26":"Israel","27":"Italy","28":"Latvia","29":"Liechtenstein","30":"Lithuania","31":"Luxemburg","32":"Malta","33":"Moldova","34":"Netherlands","35":"Northern Ireland","36":"Norway","37":"Poland","38":"Portugal","39":"Romania","40":"Russia","42":"Scotland","43":"Slovakia","44":"Slovenia","45":"Spain","46":"Sweden","47":"Switzerland","48":"Türkiye","49":"Ukraine","50":"Wales","51":"Serbia","52":"Argentina","53":"Bolivia","54":"Brazil","55":"Chile","56":"Colombia","57":"Ecuador","58":"Paraguay","59":"Peru","60":"Uruguay","61":"Venezuela","63":"Antigua & Barbuda","66":"Barbados","67":"Belize","68":"Bermuda","70":"Canada","72":"Costa Rica","73":"Cuba","76":"El Salvador","77":"Grenada","78":"Guatemala","79":"Guyana","80":"Haiti","81":"Honduras","82":"Jamaica","83":"Mexico","84":"Montserrat","85":"Netherlands Antilles","87":"Panama","88":"Puerto Rico","89":"St Kitts Nevis","90":"St Lucia","92":"Suriname","93":"Trinidad & Tobago","95":"United States","97":"Algeria","98":"Angola","99":"Benin","101":"Burkina Faso","102":"Burundi","103":"Cameroon","104":"Cape Verde Islands","105":"CAR","106":"Chad","107":"Congo","108":"Ivory Coast","110":"DR Congo","111":"Egypt","112":"Equatorial Guinea","113":"Eritrea","114":"Ethiopia","115":"Gabon","116":"Gambia","117":"Ghana","118":"Guinea","119":"Guinea Bissau","120":"Kenya","122":"Liberia","123":"Libya","124":"Madagascar","125":"Malawi","126":"Mali","127":"Mauritania","128":"Mauritius","129":"Morocco","130":"Mozambique","131":"Namibia","132":"Niger","133":"Nigeria","134":"Rwanda","136":"Senegal","138":"Sierra Leone","139":"Somalia","140":"South Africa","141":"Sudan","143":"Tanzania","144":"Togo","145":"Tunisia","146":"Uganda","147":"Zambia","148":"Zimbabwe","149":"Afghanistan","151":"Bangladesh","155":"China PR","157":"Guam","158":"Hong Kong","159":"India","160":"Indonesia","161":"Iran","162":"Iraq","163":"Japan","164":"Jordan","165":"Kazakhstan","166":"Korea DPR","167":"Korea Republic","171":"Lebanon","173":"Malaysia","179":"Pakistan","180":"Palestinian Authority","181":"Philippines","183":"Saudi Arabia","185":"Sri Lanka","186":"Syria","187":"Tajikistan","188":"Thailand","190":"UAE","191":"Uzbekistan","192":"Vietnam","195":"Australia","197":"Fiji","198":"New Zealand","204":"Vanuatu","205":"Gibraltar","207":"Dominican Republic","208":"Estonia","213":"Chinese Taipei","214":"Comoros","218":"South Sudan","219":"Kosovo"};

const LEAGUE_ID_TO_NAME = {"1":"3F Superliga","4":"1A Pro League","10":"Dutch League","13":"Premier League","14":"EFL Championship","16":"Ligue 1","17":"Ligue 2","19":"Bundesliga","20":"Bundesliga 2","31":"Serie A","32":"Serie B","39":"MLS","41":"Eliteserien","50":"Scottish League","53":"LaLiga","54":"LaLiga 2","56":"Allsvenskan","60":"EFL League One","61":"EFL League Two","63":"Hellas Liga","65":"SSE Airtricity PD","66":"Ekstraklasa","68":"Süper Lig","80":"Ö. Bundesliga","83":"K League 1","189":"CSSL","308":"Liga Portugal","317":"Liga Hrvatska","319":"Česká Liga","322":"Finnliiga","330":"Romanian Superliga","332":"Ukrayina Liha","350":"Saudi League","351":"A-League","353":"LPF","1003":"Libertadores","1014":"Sudamericana","2012":"CSL","2076":"3. Liga","2118":"Icons","2149":"Indian League","2172":"UEL","2209":"Liga Colombia","2210":"Liga Cyprus","2211":"Magyar Liga","2215":"GPFBL","2216":"Barclays WSL","2218":"D1 Arkema","2221":"NWSL","2222":"Liga F","2228":"Liga Portugal F.","2229":"Nederland Vrouwen L.","2230":"Ceska Liga Žen","2231":"Schweizer Damen L.","2232":"Sverige Liga","2233":"Scottish Women's L.","2236":"Calcio A Femminile","2244":"Liga Azerbaijan","2249":"Liga Chile"};

const BADGE_ID_MAP = { clubs: CLUB_ID_TO_NAME, nations: NATION_ID_TO_NAME, leagues: LEAGUE_ID_TO_NAME };

/* ── Render badge images, probe each URL and hide missing ones ── */
async function renderBadgeImages(year, catKey, sizeId) {
  const content = document.getElementById("alContent");
  content.innerHTML = `<div class="al-img-grid"><div class="al-loading">Loading…</div></div>`;

  const cfg    = BADGE_CONFIG[catKey];
  const idMap  = BADGE_ID_MAP[catKey];
  const size   = sizeId; /* "large" | "small" | "badges" */

  /* Build all candidate entries sorted alphabetically by name */
  const candidates = Object.entries(idMap)
    .map(([id, name]) => ({ name, url: cfg.urlFn(size, id) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  /* Probe all URLs in parallel — keep only those that actually load */
  const probeResults = await Promise.all(candidates.map(item =>
    new Promise(resolve => {
      const img = new Image();
      img.onload  = () => resolve(item);
      img.onerror = () => resolve(null);
      img.src = item.url;
    })
  ));

  const images = probeResults.filter(Boolean);

  content.innerHTML = "";

  if (!images.length) {
    content.innerHTML = `<div class="al-img-grid"><div class="al-empty">No images found.</div></div>`;
    return;
  }

  const searchWrap = document.createElement("div");
  searchWrap.className = "al-search-wrap";
  searchWrap.innerHTML = `
    <div class="al-search">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" id="alSearchInput" placeholder="SEARCH ${images.length} ${cfg.label.toUpperCase()}…" autocomplete="off" spellcheck="false">
    </div>
    <span class="al-count" id="alCountLabel">${images.length} ${cfg.label}</span>`;
  content.appendChild(searchWrap);

  const grid = document.createElement("div");
  grid.className = "al-img-grid";
  content.appendChild(grid);
  buildImageGrid(images, grid);

  document.getElementById("alSearchInput").addEventListener("input", function() {
    const q = this.value.trim().toLowerCase();
    const filtered = q ? images.filter(img => img.name.toLowerCase().includes(q)) : images;
    document.getElementById("alCountLabel").textContent = filtered.length + " of " + images.length + " " + cfg.label;
    buildImageGrid(filtered, grid);
  });
}


/* ══════════════════════════════════════════════════════
   ACHIEVEMENTS
══════════════════════════════════════════════════════ */

const SPECIAL_BADGES = [
  { id: "specialBadgeDefault",                name: "MADFUT 26" },
  { id: "specialBadgeDraft121",               name: "121-RATED DRAFT" },
  { id: "specialBadgeCollection100",          name: "100% COLLECTION" },
  { id: "specialBadgeCollectionGold",         name: "GOLD COLLECTION" },
  { id: "specialBadgeDotd10InARow",           name: "10 DOTDS IN A ROW" },
  { id: "specialBadgeSquadBuilder125",        name: "125 SQUAD BUILDER" },
  { id: "specialBadgeDraftCupWinsInARow",     name: "DRAFT WINS IN A ROW" },
  { id: "specialBadgeFreePacks",              name: "FREE PACKS" },
  { id: "specialBadgeCollectionIcons",        name: "ICONS COLLECTION" },
  { id: "specialBadgeDraftCupChamp",          name: "DRAFT CUP CHAMP" },
  { id: "specialBadgeDraftCupInvincibles",    name: "DRAFT: INVINCIBLES" },
  { id: "specialBadgeCollectionRareGold",     name: "RARE GOLD COLLECTION" },
  { id: "specialBadgeCollectionSilver",       name: "SILVER COLLECTION" },
  { id: "specialBadgeCollectionBronze",       name: "BRONZE COLLECTION" },
  { id: "specialBadgeBulkSeller",             name: "BULK SELLER" },
  { id: "specialBadgeDraft124",               name: "124-RATED DRAFT" },
  { id: "specialBadgeDraftCupPenalty",        name: "PENALTY SPECIALIST" },
  { id: "specialBadgeDraftCupDefenderGoals",  name: "DEFENDER GOALS" },
  { id: "specialBadgeDraftCupCleanSheets15",  name: "15 CLEAN SHEETS" },
  { id: "specialBadgeDraftOneClub",           name: "ONE CLUB DRAFTS" },
  { id: "specialBadgeSquadBuilder128",        name: "128 SQUAD BUILDER" },
  { id: "specialBadgeSBCLive40",              name: "40 LIVE SBCS" },
  { id: "specialBadgeLoginRewards",           name: "LOGIN REWARDS" },
  { id: "specialBadgeFatalMyClubWinsInARow",  name: "MY CLUB: 9 IN A ROW" },
  { id: "specialBadgeFatalMyClubInvincibles", name: "MY CLUB: INVINCIBLES" },
  { id: "specialBadgeFatalMyClubSeasons4",    name: "MY CLUB: 4 SEASONS" },
  { id: "specialBadgeFatalDraftWinsInARow",   name: "FATAL DRAFT: 7 IN A ROW" },
  { id: "specialBadgeFatalDraftSeasons4",     name: "FATAL DRAFT: 4 SEASONS" },
  { id: "specialBadgeDraftRanks100K",         name: "DRAFT: 100K POINTS" },
  { id: "specialBadgeDraftRanksGold",         name: "DRAFT: GOLD I" },
  { id: "specialBadgeDraftRanksElite",        name: "DRAFT: ELITE I" },
  { id: "specialBadgeDraftRanksLegend",       name: "DRAFT: LEGEND" },
  { id: "specialBadgeHigherLowerStreak",      name: "H/L: STREAK" },
  { id: "specialBadgeHigherLowerLTMCards",    name: "H/L: LTM CARDS" },
  { id: "specialBadgeHigherLowerLTMMarket",   name: "H/L: MARKET" },
  { id: "specialBadgeFatalSimWinsInARow",     name: "FATAL SIM: 6 IN A ROW" },
  { id: "specialBadgeFatalSimSeasons3",       name: "FATAL SIM: 3 SEASONS" },
  { id: "specialBadgeDraftPuzzlesChem100",    name: "33-CHEM PUZZLES" },
  { id: "specialBadgeDraftPuzzlesLTMCards",   name: "DRAFT PUZZLES: CARDS" },
  { id: "specialBadgeDraftPuzzlesLTMMarket",  name: "DRAFT PUZZLES: MARKET" },
  { id: "specialBadgeDraftHybrid",            name: "HYBRID EXPERT" },
  { id: "specialBadgeSpecialCards",           name: "SPECIAL CARDS" },
];

/* ── Unlocked / Locked folders (Special Badges, depth 2) ── */
function renderAchievementLockFolders() {
  const content = document.getElementById("alContent");
  content.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "al-grid";

  [
    { id: "unlocked", label: "Unlocked" },
    { id: "locked",   label: "Locked"   },
  ].forEach(f => {
    const folder = document.createElement("div");
    folder.className = "al-folder";
    folder.innerHTML = `
      <div class="al-folder-icon">${folderSVG()}</div>
      <span class="al-folder-label">${f.label}</span>
      <span class="al-folder-sub"></span>`;
    folder.addEventListener("click", () => navigate([...path, { id: f.id, label: f.label }]));
    grid.appendChild(folder);
  });
  content.appendChild(grid);
}

/* ── Probe and render Special Badge images (depth 3) ── */
async function renderAchievementImages(lockState) {
  const content = document.getElementById("alContent");
  content.innerHTML = `<div class="al-img-grid"><div class="al-loading">Loading…</div></div>`;

  const isLocked = lockState === "locked";

  const candidates = SPECIAL_BADGES.map(badge => {
    const fileId = badge.id.toLowerCase();
    const url = isLocked
      ? `https://mf-data.b-cdn.net/26/Badges/Achievements/Special/Locked/${fileId}_locked.png`
      : `https://mf-data.b-cdn.net/26/Badges/Achievements/Special/${fileId}.png`;
    return { name: badge.name, url };
  });

  const probeResults = await Promise.all(candidates.map(item =>
    new Promise(resolve => {
      const img = new Image();
      img.onload  = () => resolve(item);
      img.onerror = () => resolve(null);
      img.src = item.url;
    })
  ));

  const images = probeResults.filter(Boolean);
  content.innerHTML = "";

  if (!images.length) {
    content.innerHTML = `<div class="al-img-grid"><div class="al-empty">No images found.</div></div>`;
    return;
  }

  const searchWrap = document.createElement("div");
  searchWrap.className = "al-search-wrap";
  searchWrap.innerHTML = `
    <div class="al-search">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" id="alSearchInput" placeholder="SEARCH ${images.length} BADGES…" autocomplete="off" spellcheck="false">
    </div>
    <span class="al-count" id="alCountLabel">${images.length} badges</span>`;
  content.appendChild(searchWrap);

  const grid = document.createElement("div");
  grid.className = "al-img-grid";
  content.appendChild(grid);
  buildImageGrid(images, grid);

  document.getElementById("alSearchInput").addEventListener("input", function() {
    const q = this.value.trim().toLowerCase();
    const filtered = q ? images.filter(img => img.name.toLowerCase().includes(q)) : images;
    document.getElementById("alCountLabel").textContent = filtered.length + " of " + images.length + " badges";
    buildImageGrid(filtered, grid);
  });
}

/* ══════════════════════════════════════════════════════
   SBC BADGES
══════════════════════════════════════════════════════ */

/* Depth 2: Group Badges / Challenge Badges sub-folders */
function renderSbcSubFolders(year) {
  const content = document.getElementById("alContent");
  content.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "al-grid";

  [
    { id: "group-badges",     label: "Group Badges"     },
    { id: "challenge-badges", label: "Challenge Badges" },
    { id: "marquee-matchups", label: "Marquee Matchups" },
  ].forEach(f => {
    const folder = document.createElement("div");
    folder.className = "al-folder";
    folder.innerHTML = `
      <div class="al-folder-icon">${folderSVG()}</div>
      <span class="al-folder-label">${f.label}</span>
      <span class="al-folder-sub"></span>`;
    folder.addEventListener("click", () => navigate([...path, { id: f.id, label: f.label }]));
    grid.appendChild(folder);
  });
  content.appendChild(grid);
}

/* ── Shared image grid renderer ── */
function _renderImageList(content, images, noun) {
  if (!images.length) {
    content.innerHTML = `<div class="al-img-grid"><div class="al-empty">No images found.</div></div>`;
    return;
  }
  const searchWrap = document.createElement("div");
  searchWrap.className = "al-search-wrap";
  searchWrap.innerHTML = `
    <div class="al-search">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" id="alSearchInput" placeholder="SEARCH ${images.length} ${noun.toUpperCase()}…" autocomplete="off" spellcheck="false">
    </div>
    <span class="al-count" id="alCountLabel">${images.length} ${noun}</span>`;
  content.appendChild(searchWrap);
  const grid = document.createElement("div");
  grid.className = "al-img-grid";
  content.appendChild(grid);
  buildImageGrid(images, grid);
  document.getElementById("alSearchInput").addEventListener("input", function() {
    const q = this.value.trim().toLowerCase();
    const filtered = q ? images.filter(img => img.name.toLowerCase().includes(q)) : images;
    document.getElementById("alCountLabel").textContent = filtered.length + " of " + images.length + " " + noun;
    buildImageGrid(filtered, grid);
  });
}

/* Depth 3: Render Group or Challenge badge images from Firestore */
async function renderSbcImages(year, subId) {
  const content = document.getElementById("alContent");
  content.innerHTML = `<div class="al-img-grid"><div class="al-loading">Loading…</div></div>`;

  const cfg = FIRESTORE[year];
  if (!cfg?.sbcBadges) {
    content.innerHTML = `<div class="al-img-grid"><div class="al-error">Not available for this year.</div></div>`;
    return;
  }

  let docs = [];
  try {
    const data = await fetch(cfg.sbcBadges).then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
    docs = data.documents || [];
  } catch(err) {
    content.innerHTML = `<div class="al-img-grid"><div class="al-error">Failed to load. Please try again.</div></div>`;
    return;
  }

  /* Derive a human-readable name from a CDN URL filename or slug.
     Handles:
       sbc_badge_bundesliga_group → Bundesliga
       sbc_badge_epl_group        → EPL
       sbc_badge_laliga_group     → LaLiga
       sbc_badge_ligue1_group     → Ligue 1
       sbc_badge_seriea_group     → Serie A
       madridIcon.png             → Madrid Icon
       brazil.png                 → Brazil
       historicXICard.png         → Historic XI Card    */
  function nameFromUrl(url) {
    let file = url.split("/").pop().replace(/\.[^.]+$/, ""); // strip extension

    /* Handle sbc_badge_*_group slugs — extract the middle part */
    const slugMatch = file.match(/^sbc_badge_(.+)_group$/i);
    if (slugMatch) {
      const mid = slugMatch[1].toLowerCase();
      const slugMap = {
        bundesliga: "Bundesliga",
        epl:        "EPL",
        laliga:     "LaLiga",
        ligue1:     "Ligue 1",
        seriea:     "Serie A",
      };
      if (slugMap[mid]) return slugMap[mid];
      /* Unknown slug: title-case it */
      return mid.charAt(0).toUpperCase() + mid.slice(1);
    }

    /* camelCase → spaced words */
    let name = file
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, s => s.toUpperCase())
      .trim();

    /* Fix broken Roman numeral: "X I" → "XI", "X Ii" → "XII" etc. */
    name = name.replace(/\bX\s+I{1,3}\b/g, m => m.replace(/\s+/g, ""));

    return name;
  }

  const isGroup    = subId === "group-badges";
  const isMarquee  = subId === "marquee-matchups";
  const images     = [];
  const seenUrls   = new Set();

  /* ── Marquee Matchups: static list, probe and render ── */
  if (isMarquee) {
    const MARQUEE_URLS = [
      "bundesliga_bottom","bundesliga_top","conference_bottom","conference_top",
      "epl_bottom","epl_top","europa_bottom","europa_top",
      "international_bottom","international_top","laliga_bottom","laliga_top",
      "ligue1_bottom","ligue1_top","other_bottom","other_top",
      "seriea_bottom","seriea_top","ucl_bottom","ucl_top",
    ].map(s => `https://mf-data.b-cdn.net/${year}/SBC/Badge/marquee_${s}.png`);

    /* Name from filename: marquee_bundesliga_bottom → Bundesliga Bottom */
    function marqueeNameFromUrl(url) {
      const file = url.split("/").pop().replace(/\.[^.]+$/, "");
      const parts = file.split("_").slice(1); // drop "marquee"
      return parts.map(p => {
        const pretty = { bundesliga:"Bundesliga", epl:"EPL", conference:"Conference",
                         europa:"Europa", international:"International", laliga:"LaLiga",
                         ligue1:"Ligue 1", other:"Other", seriea:"Serie A", ucl:"UCL" };
        return pretty[p] || (p.charAt(0).toUpperCase() + p.slice(1));
      }).join(" ");
    }

    const candidates = MARQUEE_URLS.map(url => ({ name: marqueeNameFromUrl(url), url }));
    const probeResults = await Promise.all(candidates.map(item =>
      new Promise(resolve => {
        const img = new Image();
        img.onload  = () => resolve(item);
        img.onerror = () => resolve(null);
        img.src = item.url;
      })
    ));
    const probed = probeResults.filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
    content.innerHTML = "";
    _renderImageList(content, probed, "badges");
    return;
  }

  /* For challenge badges, seed the custom badge first */
  const CUSTOM_BADGE_URL = `https://mf-data.b-cdn.net/${year}/SBC/Badge/sbc_badge_custom.png`;
  if (!isGroup) {
    seenUrls.add(CUSTOM_BADGE_URL);
    images.push({ name: "Custom", url: CUSTOM_BADGE_URL, _sort: Infinity });
  }

  docs.forEach(doc => {
    const f    = doc.fields || {};
    const sort = getSortDate(doc);

    if (isGroup) {
      /* Group badge: top-level f.url / urlBunny / urlGoogle — must be absolute.
         Slugs like "sbc_badge_bundesliga_group" are only on f.url for MF26;
         MF24/25 use absolute URLs in urlBunny/urlGoogle for group badges. */
      const urlVal = f.url?.stringValue || f.urlBunny?.stringValue || f.urlGoogle?.stringValue;
      if (!urlVal) return;

      let resolvedUrl, fallbackUrl;
      if (/^https?:\/\//i.test(urlVal)) {
        resolvedUrl = urlVal;
        fallbackUrl = null;
      } else if (/^sbc_badge_/i.test(urlVal)) {
        /* MF26-style group badge slug */
        resolvedUrl = `https://trivela.b-cdn.net/${year}/sbc/${urlVal}.png`;
        fallbackUrl = `https://mf-data.b-cdn.net/${year}/SBC/Badge/${urlVal}.png`;
      } else {
        /* Anything else (e.g. club_large_X) is a challenge image slug, skip */
        return;
      }

      if (seenUrls.has(resolvedUrl)) return;
      seenUrls.add(resolvedUrl);

      const name = nameFromUrl(resolvedUrl);
      images.push({ name, url: resolvedUrl, fallbackUrl, _sort: sort });

    } else {
      /* Challenge badges: all sbcs[] entries where url is absolute.
         MF26 uses sf.url; MF24/25 use sf.urlBunny / sf.urlGoogle */
      const sbcs = f.sbcs?.arrayValue?.values || [];
      sbcs.forEach(entry => {
        const sf     = entry.mapValue?.fields || {};
        const urlVal = sf.url?.stringValue
          || sf.urlBunny?.stringValue
          || sf.urlGoogle?.stringValue;
        if (!urlVal || !/^https?:\/\//i.test(urlVal)) return;
        if (seenUrls.has(urlVal)) return;
        seenUrls.add(urlVal);
        images.push({ name: nameFromUrl(urlVal), url: urlVal, _sort: sort });
      });
    }
  });

  if (isGroup) {
    images.sort((a, b) => b._sort - a._sort);
  } else {
    images.sort((a, b) => a.name.localeCompare(b.name));
  }
  content.innerHTML = "";
  _renderImageList(content, images, "badges");
}

function parseHash() {
  const hash = window.location.hash.replace("#","").trim();
  if (!hash) { path = []; render(); return; }

  const parts = hash.split("/");
  const rebuilt = [];

  if (parts[0] && parts[0].startsWith("year-")) {
    const yr = parts[0].replace("year-","");
    const yearLabels = {"26":"MADFUT 26","25":"MADFUT 25","24":"MADFUT 24"};
    if (yearLabels[yr]) {
      rebuilt.push({id:"year-"+yr, label:yearLabels[yr]});
      if (parts[1]) {
        const folders = YEAR_FOLDERS[yr] || [];
        const found = folders.find(f => f.id === parts[1]);
        if (found && !found.external) rebuilt.push({id:found.id, label:found.label});
      }
    }
  }

  path = rebuilt;
  render();
}

window.addEventListener("hashchange", () => {
  if (_suppressHashChange) { _suppressHashChange = false; return; }
  parseHash();
});parseHash();