(function () {
  // Inject col-bc-inner layout style
  const s = document.createElement("style");
  s.textContent = `.col-bc-inner{display:flex;align-items:flex-start;gap:0;}`;
  document.head.appendChild(s);

  const nav = document.createElement("div");
  nav.innerHTML = `
<nav class="top-nav">
  <button class="menu-btn" id="menuBtn" aria-label="Toggle menu" aria-expanded="false">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
      <path class="bar1" d="M 3 5 A 1.0001 1.0001 0 1 0 3 7 L 21 7 A 1.0001 1.0001 0 1 0 21 5 L 3 5 z"/>
      <path class="bar2" d="M 3 11 A 1.0001 1.0001 0 1 0 3 13 L 21 13 A 1.0001 1.0001 0 1 0 21 11 L 3 11 z"/>
      <path class="bar3" d="M 3 17 A 1.0001 1.0001 0 1 0 3 19 L 21 19 A 1.0001 1.0001 0 1 0 21 17 L 3 17 z"/>
    </svg>
  </button>

  <div class="search-wrap" id="searchWrap">
    <div class="search-box">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="2.5" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" id="searchInput" placeholder="SEARCH PLAYERS OR PAGES" aria-label="Search" autocomplete="off">
      <div class="search-year-filter" id="searchYearFilter">
        <button class="search-year-filter-btn" id="searchYearFilterBtn" aria-haspopup="listbox" aria-expanded="false" title="Filter by year">
          <img class="syf-img" id="syfImg" src="https://mf-data.b-cdn.net/web/Icons/madfut_26.png" alt="Year filter" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
          <span class="syf-img-fallback" id="syfFallback">26</span>
        </button>
        <div class="search-year-filter-drop" id="syfDrop" role="listbox">
          <button class="syf-drop-item active" data-year="26" role="option" aria-selected="true">
            <img src="https://mf-data.b-cdn.net/web/Icons/madfut_26.png" alt="" onerror="this.style.display='none'">MADFUT 26
            <span class="syf-check"><svg viewBox="0 0 12 9"><polyline points="1,4.5 4.5,8 11,1"/></svg></span>
          </button>
          <button class="syf-drop-item" data-year="25" role="option" aria-selected="false">
            <img src="https://mf-data.b-cdn.net/web/Icons/madfut_25.png" alt="" onerror="this.style.display='none'">MADFUT 25
            <span class="syf-check"><svg viewBox="0 0 12 9"><polyline points="1,4.5 4.5,8 11,1"/></svg></span>
          </button>
          <button class="syf-drop-item" data-year="24" role="option" aria-selected="false">
            <img src="https://mf-data.b-cdn.net/web/Icons/madfut_24.png" alt="" onerror="this.style.display='none'">MADFUT 24
            <span class="syf-check"><svg viewBox="0 0 12 9"><polyline points="1,4.5 4.5,8 11,1"/></svg></span>
          </button>
        </div>
      </div>
    </div>
    <div class="search-dropdown" id="searchDropdown" role="listbox"></div>
  </div>

  <a href="/index.html" class="nav-logo">DATA</a>
</nav>

<div class="nav-drawer" id="navDrawer" aria-hidden="true">
  <div class="nav-drawer-inner">

    <div class="gen-row" role="group" aria-label="Select generation">
      <a href="#" class="gen-btn selected" data-year="26" aria-label="Madfut 26" aria-pressed="true">
        <img src="https://mf-data.b-cdn.net/web/Icons/madfut_26.png" alt="Madfut 26" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
        <span class="gen-fallback">26</span>
      </a>
      <a href="#" class="gen-btn" data-year="25" aria-label="Madfut 25" aria-pressed="false">
        <img src="https://mf-data.b-cdn.net/web/Icons/madfut_25.png" alt="Madfut 25" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
        <span class="gen-fallback">25</span>
      </a>
      <a href="#" class="gen-btn" data-year="24" aria-label="Madfut 24" aria-pressed="false">
        <img src="https://mf-data.b-cdn.net/web/Icons/madfut_24.png" alt="Madfut 24" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
        <span class="gen-fallback">24</span>
      </a>
    </div>

    <div class="drawer-body">
      <div class="content-area">
        <div class="content-col-a">
          <div class="sec-head">CARDS</div>
          <ul class="drawer-links" id="colA"></ul>
        </div>
        <div class="col-bc">
          <div class="sec-head col-bc-head">CONTENT</div>
          <div class="col-bc-inner">
            <ul class="drawer-links" id="colB"></ul>
            <ul class="drawer-links" id="colC"></ul>
          </div>
        </div>
      </div>

      <div class="drawer-sep" aria-hidden="true"></div>

      <div class="right-panel">
        <div class="misc-col">
          <div class="sec-head">MISC</div>
          <ul class="drawer-links" id="colMisc"></ul>
        </div>
        <div class="data-col">
          <div class="sec-head">DATA</div>
          <ul class="drawer-links" id="colData"></ul>
        </div>
        <div class="socials-col">
          <div class="sec-head">SOCIALS</div>
          <a href="https://www.instagram.com/madfoot1910" class="social-link" target="_blank" rel="noopener">
            <div class="soc-icon insta">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="5"/>
                <circle cx="17.5" cy="6.5" r="1.2" style="fill:var(--mid);stroke:none;" class="insta-dot"/>
              </svg>
            </div>INSTAGRAM
          </a>
          <a href="https://www.youtube.com/@madfut1910" class="social-link" target="_blank" rel="noopener">
            <div class="soc-icon">
              <svg viewBox="0 0 24 24"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
            </div>YOUTUBE
          </a>
          <a href="https://www.tiktok.com/@madfut1910" class="social-link" target="_blank" rel="noopener">
            <div class="soc-icon">
              <svg viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
            </div>TIKTOK
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="overlay" id="overlay"></div>`;

  const breadcrumb = document.querySelector("nav.breadcrumb-bar");
  if (breadcrumb) {
    document.body.insertBefore(nav, breadcrumb);
  } else {
    document.body.prepend(nav);
  }
  const parent = nav.parentNode;
  while (nav.firstChild) parent.insertBefore(nav.firstChild, nav);
  parent.removeChild(nav);

  const scroll = document.querySelector(".breadcrumb-scroll");
  if (scroll) {
    const bcWrap = document.createElement("div");
    bcWrap.innerHTML = `<div class="bc-year-wrap" id="bcYearWrap">
      <button class="bc-year-btn" id="bcYearBtn" aria-haspopup="listbox" aria-expanded="false">
        <span id="bcYearLabel">MADFUT 26</span>
        <svg viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4"/></svg>
      </button>
      <div class="bc-year-drop" id="bcYearDrop" role="listbox">
        <button class="bc-year-drop-item" data-year="26" role="option" aria-selected="false">
          <img src="https://mf-data.b-cdn.net/web/Icons/madfut_26.png" alt="" onerror="this.style.display='none'">MADFUT 26
        </button>
        <button class="bc-year-drop-item" data-year="25" role="option" aria-selected="false">
          <img src="https://mf-data.b-cdn.net/web/Icons/madfut_25.png" alt="" onerror="this.style.display='none'">MADFUT 25
        </button>
        <button class="bc-year-drop-item" data-year="24" role="option" aria-selected="false">
          <img src="https://mf-data.b-cdn.net/web/Icons/madfut_24.png" alt="" onerror="this.style.display='none'">MADFUT 24
        </button>
      </div>
    </div>`;
    const refNode = scroll.children[1] ? scroll.children[1].nextSibling : null;
    scroll.insertBefore(bcWrap.firstElementChild, refNode);
  }
})();

const { PAGE_YEAR, PAGE_SLUG } = (function() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts.length >= 2) {
    const yr   = parts[parts.length - 2];
    const slug = parts[parts.length - 1].replace(".html", "");
    return { PAGE_YEAR: yr, PAGE_SLUG: slug };
  }
  const file = (parts[parts.length - 1] || "").replace(".html", "");
  const m = file.match(/^(\d+)(.+)$/);
  return m ? { PAGE_YEAR: m[1], PAGE_SLUG: m[2] } : { PAGE_YEAR: "26", PAGE_SLUG: file };
})();

const menuBtn   = document.getElementById("menuBtn");
const navDrawer = document.getElementById("navDrawer");
const overlay   = document.getElementById("overlay");

function toggleNav(open) {
  menuBtn.classList.toggle("active", open);
  menuBtn.setAttribute("aria-expanded", String(open));
  navDrawer.classList.toggle("open", open);
  navDrawer.setAttribute("aria-hidden", String(!open));
  overlay.classList.toggle("active", open);
  if (window.innerWidth > 768) document.body.style.overflow = open ? "hidden" : "";
}

menuBtn.addEventListener("click", () => toggleNav(!navDrawer.classList.contains("open")));
overlay.addEventListener("click", () => toggleNav(false));
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { toggleNav(false); closeSyfDrop(); closeBcDrop(); }
});

(function(){
  const input  = document.getElementById("searchInput");
  const wrap   = document.getElementById("searchWrap");
  const canvas = document.createElement("canvas");
  const ctx    = canvas.getContext("2d");
  ctx.font = "13px 'Roboto Condensed', sans-serif";
  const textW = ctx.measureText(input.placeholder).width;
  wrap.style.maxWidth = Math.ceil(14 + 8 + textW + 26 + 60) + "px";
  wrap.style.width = "100%";
})();

let activeYear = PAGE_YEAR || "26";

// ─────────────────────────────────────────────
// NAV LINK CONFIGURATION
// Set enabled: false to disable (dim + no click) any link.
// slug is used to build the href: /{year}/{slug}.html
// For non-year links (misc/data), href is used directly.
// ─────────────────────────────────────────────

const colAData = {
  heading: "CARDS",
  items: [
    { slug: "Cards",         label: "ALL CARDS",       enabled: true  },
    { slug: "LiveCards",     label: "UPGRADE HUB",     enabled: true  },
    { slug: "LTMCards",      label: "LTM CARD",        enabled: false  },
    { slug: "Rarity-Groups", label: "RARITY / GROUP",  enabled: true  },
    { slug: "Nation",        label: "NATION",          enabled: true  },
    { slug: "League",        label: "LEAGUE",          enabled: true  },
    { slug: "Club",          label: "CLUB",            enabled: true  },
  ]
};

const colBData = {
  heading: "CONTENT",
  items: [
    { slug: "Database",          label: "DATABASE",            enabled: false  },
    { slug: "SBC",               label: "SBC",                 enabled: false  },
    { slug: "Objective",         label: "OBJECTIVE",           enabled: false  },
    { slug: "Evolution",         label: "EVOLUTION",           enabled: true  },
    { slug: "Draft",             label: "DRAFT",               enabled: false  },
    { slug: "Ranked",            label: "RANKED",              enabled: false  },
    { slug: "Fatal",             label: "FATAL",               enabled: false  },
  ]
};

// Second sub-column alongside colB under the CONTENT heading
const colCData = {
  items: [
    { slug: "Vote-Promo",        label: "VOTES / PROMO",       enabled: true  },
    { slug: "LTMMarket",         label: "LTM MARKET",          enabled: false  },
    { slug: "DraftPackBonuses",  label: "DRAFT / PACK BONUSES",enabled: false  },
    { slug: "DailyLogin",        label: "DAILY LOGIN",         enabled: false  },
    { slug: "Badges",            label: "BADGES",              enabled: false  },
    { slug: "LevelRewards",      label: "LEVEL REWARDS",       enabled: false  },
    { slug: "Codes",             label: "CODES",               enabled: true  },
  ]
};



// Static (non-year) columns
const colMiscData = [
  { label: "ASSET LIBRARY",   href: "/Asset-Libary.html",  enabled: true  },
  { label: "CARD CREATOR",    href: "/26/Card-Creator.html", enabled: true  },
  { label: "CONCEPT STUDIO",  href: "/concept-studio.html", enabled: false },
  { label: "SQUAD BUILDER",   href: "/26/Squad-Builder.html", enabled: false },
];

const colDataData = [
  { label: "HOME PAGE",   href: "/index.html",   enabled: true  },
  { label: "ARTICLES",    href: "/news.html",    enabled: false  },
  { label: "CONTACT US",  href: "/contact.html", enabled: true  },
];

// ─────────────────────────────────────────────
// Build a year-based link list
// ─────────────────────────────────────────────
function buildList(id, data, year) {
  const ul = document.getElementById(id);
  if (!ul) return;
  ul.innerHTML = "";

  const items = data.items || [];
  items.forEach(item => {
    // Evolution disabled for 25/24
    const isEvoDisabled = item.slug === "Evolution" && (year === "25" || year === "24");
    const isCodesDisabled = item.slug === "Codes" & (year === "24");
    const disabled = !item.enabled || isEvoDisabled || isCodesDisabled;

    const li = document.createElement("li");
    const a  = document.createElement("a");

    a.href = item.global ? item.href : ("/" + year + "/" + item.slug + ".html");
    a.textContent = item.label;

    if (disabled) {
      a.style.cssText = "opacity:0.35;pointer-events:none;cursor:default;";
    }

    li.appendChild(a);
    ul.appendChild(li);
  });
}

// Build static (non-year) columns
function buildStaticList(id, items) {
  const ul = document.getElementById(id);
  if (!ul) return;
  ul.innerHTML = "";
  items.forEach(item => {
    const li = document.createElement("li");
    const a  = document.createElement("a");
    a.href = item.href;
    a.textContent = item.label;
    if (!item.enabled) {
      a.style.cssText = "opacity:0.35;pointer-events:none;cursor:default;";
    }
    li.appendChild(a);
    ul.appendChild(li);
  });
}

function setYear(yr, updateGen = false) {
  activeYear = yr;

  if (updateGen) {
    document.querySelectorAll(".gen-btn").forEach(b => {
      const sel = b.dataset.year === yr;
      b.classList.toggle("selected", sel);
      b.setAttribute("aria-pressed", String(sel));
    });
  }

  const syfImg = document.getElementById("syfImg");
  const syfFallback = document.getElementById("syfFallback");
  syfImg.style.display = "";
  syfFallback.style.display = "none";
  syfImg.src = "https://mf-data.b-cdn.net/web/Icons/madfut_" + yr + ".png";
  syfImg.onerror = function() {
    syfImg.style.display = "none";
    syfFallback.style.display = "block";
    syfFallback.textContent = yr;
  };
  syfFallback.textContent = yr;
  document.querySelectorAll(".syf-drop-item").forEach(b => {
    const sel = b.dataset.year === yr;
    b.classList.toggle("active", sel);
    b.setAttribute("aria-selected", String(sel));
  });

  buildList("colA", colAData, yr);
  buildList("colB", colBData, yr);
  buildList("colC", colCData, yr);
  buildStaticList("colMisc", colMiscData);
  buildStaticList("colData", colDataData);

  if (searchDropdown.classList.contains("show")) renderDrop(searchInput.value);
}

document.querySelectorAll(".gen-btn").forEach(btn => {
  btn.addEventListener("click", e => { e.preventDefault(); setYear(btn.dataset.year, true); });
});

const searchYearFilter    = document.getElementById("searchYearFilter");
const searchYearFilterBtn = document.getElementById("searchYearFilterBtn");

function closeSyfDrop() {
  searchYearFilter.classList.remove("open");
  searchYearFilterBtn.setAttribute("aria-expanded", "false");
}

searchYearFilterBtn.addEventListener("click", e => {
  e.stopPropagation();
  const open = searchYearFilter.classList.toggle("open");
  searchYearFilterBtn.setAttribute("aria-expanded", String(open));
  closeBcDrop();
  searchDropdown.classList.remove("show");
});

document.querySelectorAll(".syf-drop-item").forEach(btn => {
  btn.addEventListener("click", e => {
    e.stopPropagation();
    setYear(btn.dataset.year, true);
    closeSyfDrop();
    searchInput.focus();
    renderDrop(searchInput.value);
  });
});

const bcYearWrap = document.getElementById("bcYearWrap");
const bcYearBtn  = document.getElementById("bcYearBtn");
const bcYearDrop = document.getElementById("bcYearDrop");

document.body.appendChild(bcYearDrop);
bcYearDrop.style.position = "fixed";
bcYearDrop.style.zIndex   = "9999";

function positionBcDrop() {
  const r = bcYearBtn.getBoundingClientRect();
  bcYearDrop.style.top  = r.bottom + 4 + "px";
  bcYearDrop.style.left = r.left + "px";
}

function closeBcDrop() {
  bcYearWrap.classList.remove("open");
  bcYearBtn.setAttribute("aria-expanded", "false");
  if (bcYearDrop) bcYearDrop.style.display = "none";
}

bcYearBtn.addEventListener("click", e => {
  e.stopPropagation();
  const opening = bcYearDrop.style.display === "none" || !bcYearDrop.style.display;
  if (opening) {
    positionBcDrop();
    bcYearDrop.style.display = "block";
    bcYearWrap.classList.add("open");
    bcYearBtn.setAttribute("aria-expanded", "true");
  } else {
    closeBcDrop();
  }
  closeSyfDrop();
  searchDropdown.classList.remove("show");
});

document.querySelectorAll(".bc-year-drop-item").forEach(btn => {
  btn.addEventListener("click", e => {
    e.stopPropagation();
    const yr = btn.dataset.year;
    closeBcDrop();
    window.location.href = "/" + yr + "/" + PAGE_SLUG + ".html";
  });
});

document.addEventListener("click", e => {
  if (!e.target.closest("#searchYearFilter")) closeSyfDrop();
  if (!e.target.closest("#bcYearWrap"))       closeBcDrop();
  if (!e.target.closest("#searchWrap"))       searchDropdown.classList.remove("show");
});

// ─────────────────────────────────────────────
// PLAYER SEARCH — data cache & loading state
// ─────────────────────────────────────────────
let _navPlayers       = [];
let _navColorMap      = {};
let _navDataLoaded    = false;
let _navDataLoading   = false;

function _navNorm(str) {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

async function _fetchCollection(baseURL, dbName) {
  const promises = [];
  for (let i = 150; i >= 1; i--) {
    promises.push(
      fetch(`${baseURL}${i}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return [];
          const players = data.fields?.players?.arrayValue?.values || [];
          return players.map(p => ({
            fields:     p?.mapValue?.fields || {},
            createTime: data.createTime || '',
            database:   dbName
          }));
        })
        .catch(() => [])
    );
  }
  const results = await Promise.all(promises);
  return results.flat();
}

async function _loadNavData() {
  if (_navDataLoaded || _navDataLoading) return;
  _navDataLoading = true;

  try {
    const [colorRes, fsRes] = await Promise.all([
      fetch("json/color.json").catch(() => null),
      fetch("https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents/images").catch(() => null)
    ]);

    const colorMap = {};
    const processSources = (sources) => {
      sources.forEach(doc => {
        let imagesArray = [];
        if (doc.fields?.images?.arrayValue?.values) imagesArray = doc.fields.images.arrayValue.values;
        else if (doc.mapValue?.fields) imagesArray = [doc];
        imagesArray.forEach(item => {
          const fields = item.mapValue?.fields || {};
          const id = (fields.id?.stringValue || fields.name?.stringValue || '').trim().toLowerCase();
          if (!id) return;
          colorMap[id] = {
            url_small:         fields.url_small?.stringValue || null,
            url_micro:         fields.url_micro?.stringValue || null,
            top_text_color:    fields.top_text_color?.stringValue    || '#000000',
            middle_text_color: fields.middle_text_color?.stringValue || '#ffffff',
          };
        });
      });
    };

    const localData = colorRes && colorRes.ok ? await colorRes.json().catch(() => null) : null;
    const fsData    = fsRes   && fsRes.ok    ? await fsRes.json().catch(() => null)    : null;
    const sources = [];
    if (localData?.documents) sources.push(...localData.documents);
    if (fsData?.documents)    sources.push(...fsData.documents);
    processSources(sources);
    _navColorMap = colorMap;

    const DB_BASE = {
      realmExport: 'json/realmExport.json',
      updates:     'https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents/updates/',
      sbcGroups:   'https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents/sbcGroups/',
      objectives:  'https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents/objectives/',
      evosElite:   'https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents/evosElite/',
      draftCups:   'https://firestore.googleapis.com/v1/projects/trivela-madfut/databases/(default)/documents/draftCups/',
      ltm:         '26assets/Txt/ltm.json',
    };

    const allPromises = [];

    ['realmExport', 'ltm'].forEach(dbName => {
      allPromises.push(
        fetch(DB_BASE[dbName])
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (!data) return [];
            const players = data.fields?.players?.arrayValue?.values || [];
            return players.map(p => ({ fields: p?.mapValue?.fields || {}, createTime: data.createTime || '', database: dbName }));
          })
          .catch(() => [])
      );
    });

    ['updates','sbcGroups','objectives','evosElite','draftCups'].forEach(dbName => {
      allPromises.push(_fetchCollection(DB_BASE[dbName], dbName));
    });

    const results    = (await Promise.all(allPromises)).flat();
    const dbPriority = ['objectives','sbcGroups','draftCups','ltm','realmExport','evosElite','updates'];
    const getPrio    = db => { const i = dbPriority.indexOf(db); return i === -1 ? 999 : i; };

    const idMap = new Map();
    results.forEach(entry => {
      const id = entry.fields?.id?.stringValue;
      if (!id) return;
      const existing = idMap.get(id);
      if (!existing) { idMap.set(id, entry); return; }
      if (getPrio(entry.database) < getPrio(existing.database)) idMap.set(id, entry);
    });

    _navPlayers    = Array.from(idMap.values());
    _navDataLoaded = true;
  } catch (err) {
    console.warn('[NavSearch] Failed to load player data', err);
  } finally {
    _navDataLoading = false;
  }
}

_loadNavData();

function _buildPlayerResult(entry, query) {
  const f       = entry.fields;
  const name    = f.name?.stringValue    || 'Unknown';
  const rating  = f.rating?.integerValue || '?';
  const pos     = f.position?.stringValue || '';
  const color   = (f.color?.stringValue  || 'default').trim().toLowerCase();
  const id      = (f.id?.stringValue     || '').replace('id', '');
  const baseId  = f.baseId?.integerValue || id;
  const dbName  = entry.database || 'realmExport';

  const design  = _navColorMap[color] || {};
  const cardImg = design.url_small
    || design.url_micro
    || `https://mf-data.b-cdn.net/26/Colors/${color}_small.png`;
  const faceImg = `https://trivela.b-cdn.net/26/faces/p${id}_small.png`;

  function hlName(text, q) {
    if (!q) return text;
    const norm  = _navNorm(text);
    const normQ = _navNorm(q);
    const idx   = norm.indexOf(normQ);
    if (idx === -1) return text;
    return text.slice(0, idx) + '<em>' + text.slice(idx, idx + q.length) + '</em>' + text.slice(idx + q.length);
  }

  const href = `/26/Card-Detail.html?id=${id}&color=${color}&db=${dbName}`;

  const a = document.createElement('a');
  a.className = 'search-result search-result--player';
  a.href      = href;
  a.setAttribute('role', 'option');

  a.innerHTML = `
    <div class="sr-card-thumb">
      <img class="sr-card-bg" src="${cardImg}" alt="" loading="lazy"
           onerror="this.src='https://mf-data.b-cdn.net/26/Colors/default_small.png'">
      <img class="sr-card-face" src="${faceImg}" data-face-type="dynamic" alt="${name}" loading="lazy"
           onerror="
             if(!this.dataset.step){
               this.dataset.step='normal';
               this.dataset.faceType='normal';
               this.src='https://trivela.b-cdn.net/26/normalFacesSmall/${id}.png';
             } else if(this.dataset.step==='normal'){
               this.dataset.step='base';
               this.src='https://trivela.b-cdn.net/26/normalFacesSmall/${baseId}.png';
             } else {
               this.onerror=null;
               this.src='Main Assets/boo.png';
             }
           ">
    </div>
    <div class="sr-player-info">
      <span class="sr-player-name">${hlName(name, query)}</span>
      <span class="sr-player-meta">${rating}${pos ? ' · ' + pos : ''}</span>
    </div>
  `;

  return a;
}

// ─────────────────────────────────────────────
// Page results for search
// ─────────────────────────────────────────────
const yearSlugs = [
  ...colAData.items.map(i => ({ slug: i.slug, label: i.label })),
  ...colBData.items.map(i => ({ slug: i.slug, label: i.label })),
  ...colCData.items.filter(i => !i.global).map(i => ({ slug: i.slug, label: i.label })),
];

const navPages = [];
["26","25","24"].forEach(yr => {
  yearSlugs.forEach(p => navPages.push({ label: p.label, href: "/" + yr + "/" + p.slug + ".html", year: yr }));
});
[
  ...colMiscData.map(p => ({ label: p.label, href: p.href })),
  ...colDataData.map(p => ({ label: p.label, href: p.href })),
  { label: "CODES",       href: "/codes.html" },
  { label: "INSTAGRAM",   href: "https://www.instagram.com/madfoot1910" },
  { label: "YOUTUBE",     href: "https://www.youtube.com/@madfut1910" },
  { label: "TIKTOK",      href: "https://www.tiktok.com/@madfut1910" },
].forEach(p => navPages.push(p));

const searchInput    = document.getElementById("searchInput");
const searchDropdown = document.getElementById("searchDropdown");
let hlIdx = -1;

function hlText(text, q) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return text;
  return text.slice(0,i) + "<em>" + text.slice(i, i+q.length) + "</em>" + text.slice(i+q.length);
}

let _renderTimer = null;
function debounce(fn, ms) {
  return (...args) => {
    clearTimeout(_renderTimer);
    _renderTimer = setTimeout(() => fn(...args), ms);
  };
}

function renderDrop(query) {
  searchDropdown.innerHTML = "";
  hlIdx = -1;
  const q    = query.trim();
  const qNorm = _navNorm(q);

  if (q.length >= 1) {
    const matchedPlayers = _navPlayers
      .filter(entry => _navNorm(entry.fields?.name?.stringValue || '').includes(qNorm))
      .sort((a, b) => {
        const aName = _navNorm(a.fields?.name?.stringValue || '');
        const bName = _navNorm(b.fields?.name?.stringValue || '');
        const aPrefix = aName.startsWith(qNorm) ? 0 : 1;
        const bPrefix = bName.startsWith(qNorm) ? 0 : 1;
        if (aPrefix !== bPrefix) return aPrefix - bPrefix;
        return (parseInt(b.fields?.rating?.integerValue || 0)) - (parseInt(a.fields?.rating?.integerValue || 0));
      })
      .slice(0, 8);

    if (matchedPlayers.length > 0) {
      const hdr = document.createElement('div');
      hdr.className   = 'search-section-hdr';
      hdr.textContent = 'PLAYERS';
      searchDropdown.appendChild(hdr);

      if (!_navDataLoaded) {
        const loading = document.createElement('div');
        loading.className   = 'search-loading';
        loading.textContent = 'Loading player data…';
        searchDropdown.appendChild(loading);
      } else {
        matchedPlayers.forEach(entry => {
          searchDropdown.appendChild(_buildPlayerResult(entry, q));
        });
      }
    } else if (_navDataLoaded && q.length >= 2) {
      const hdr = document.createElement('div');
      hdr.className   = 'search-section-hdr';
      hdr.textContent = 'PLAYERS';
      searchDropdown.appendChild(hdr);

      const none = document.createElement('div');
      none.className   = 'search-no-results search-no-results--small';
      none.textContent = 'No players found';
      searchDropdown.appendChild(none);
    } else if (!_navDataLoaded) {
      const hdr = document.createElement('div');
      hdr.className   = 'search-section-hdr';
      hdr.textContent = 'PLAYERS';
      searchDropdown.appendChild(hdr);
      const loading = document.createElement('div');
      loading.className   = 'search-loading';
      loading.textContent = 'Loading player data…';
      searchDropdown.appendChild(loading);
    }
  }

  let pageResults;
  if (!q) {
    pageResults = navPages.filter(p => !p.year || p.year === activeYear).slice(0, 10);
  } else {
    pageResults = navPages.filter(p => {
      const full = (p.year ? p.year + " " : "") + p.label;
      return full.toLowerCase().includes(q.toLowerCase()) || p.label.toLowerCase().includes(q.toLowerCase());
    });
  }

  if (pageResults.length > 0) {
    if (q.length >= 1) {
      const hdr = document.createElement('div');
      hdr.className   = 'search-section-hdr';
      hdr.textContent = 'PAGES';
      searchDropdown.appendChild(hdr);
    }

    pageResults.forEach(page => {
      const a = document.createElement("a");
      a.className = "search-result";
      a.href = page.href;
      if (page.year && (page.year === "25" || page.year === "24") && page.label === "EVOLUTION") {
        a.style.cssText = "opacity:0.35;pointer-events:none;cursor:default;";
      }
      const labelSpan = document.createElement("span");
      labelSpan.innerHTML = hlText(page.label, q);
      a.appendChild(labelSpan);
      if (page.year) {
        const tag = document.createElement("span");
        tag.className = "search-year-tag";
        tag.textContent = page.year;
        a.appendChild(tag);
      }
      searchDropdown.appendChild(a);
    });
  }

  if (searchDropdown.children.length === 0) {
    searchDropdown.innerHTML = '<div class="search-no-results">No results found</div>';
  }

  searchDropdown.classList.add("show");
}

const debouncedRender = debounce(renderDrop, 120);

searchInput.addEventListener("input",  () => debouncedRender(searchInput.value));
searchInput.addEventListener("focus",  () => renderDrop(searchInput.value));
searchInput.addEventListener("keydown", e => {
  const items = searchDropdown.querySelectorAll(".search-result");
  if (e.key === "ArrowDown") {
    e.preventDefault();
    hlIdx = Math.min(hlIdx+1, items.length-1);
    items.forEach((el,i) => el.classList.toggle("highlighted", i===hlIdx));
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    hlIdx = Math.max(hlIdx-1, -1);
    items.forEach((el,i) => el.classList.toggle("highlighted", i===hlIdx));
  } else if (e.key === "Enter" && hlIdx >= 0 && items[hlIdx]) {
    items[hlIdx].click();
  } else if (e.key === "Escape") {
    searchDropdown.classList.remove("show");
    searchInput.blur();
  }
});

document.getElementById("bcYearLabel").textContent = "MADFUT " + PAGE_YEAR;
document.querySelectorAll(".bc-year-drop-item").forEach(b => {
  const sel = b.dataset.year === PAGE_YEAR;
  b.classList.toggle("active", sel);
  b.setAttribute("aria-selected", String(sel));
});

setYear(activeYear, true);