(function () {
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
      <input type="text" id="searchInput" placeholder="SEARCH FOR PLAYERS OR PAGES" aria-label="Search" autocomplete="off">
      <div class="search-year-filter" id="searchYearFilter">
        <button class="search-year-filter-btn" id="searchYearFilterBtn" aria-haspopup="listbox" aria-expanded="false" title="Filter by year">
          <img class="syf-img" id="syfImg" src="https://mf-data.b-cdn.net/web/Icons/madfut_24.png" alt="Year filter" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
          <span class="syf-img-fallback" id="syfFallback">24</span>
        </button>
        <div class="search-year-filter-drop" id="syfDrop" role="listbox">
          <button class="syf-drop-item" data-year="26" role="option" aria-selected="false">
            <img src="https://mf-data.b-cdn.net/web/Icons/madfut_26.png" alt="" onerror="this.style.display='none'">MADFUT 26
            <span class="syf-check"><svg viewBox="0 0 12 9"><polyline points="1,4.5 4.5,8 11,1"/></svg></span>
          </button>
          <button class="syf-drop-item" data-year="25" role="option" aria-selected="false">
            <img src="https://mf-data.b-cdn.net/web/Icons/madfut_25.png" alt="" onerror="this.style.display='none'">MADFUT 25
            <span class="syf-check"><svg viewBox="0 0 12 9"><polyline points="1,4.5 4.5,8 11,1"/></svg></span>
          </button>
          <button class="syf-drop-item active" data-year="24" role="option" aria-selected="true">
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
      <a href="#" class="gen-btn" data-year="26" aria-label="Madfut 26" aria-pressed="false">
        <img src="https://mf-data.b-cdn.net/web/Icons/madfut_26.png" alt="Madfut 26" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
        <span class="gen-fallback">26</span>
      </a>
      <a href="#" class="gen-btn" data-year="25" aria-label="Madfut 25" aria-pressed="false">
        <img src="https://mf-data.b-cdn.net/web/Icons/madfut_25.png" alt="Madfut 25" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
        <span class="gen-fallback">25</span>
      </a>
      <a href="#" class="gen-btn selected" data-year="24" aria-label="Madfut 24" aria-pressed="true">
        <img src="https://mf-data.b-cdn.net/web/Icons/madfut_24.png" alt="Madfut 24" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
        <span class="gen-fallback">24</span>
      </a>
    </div>

    <div class="drawer-body">
      <div class="content-area">
        <div class="content-col-a">
          <div class="sec-head">CONTENT</div>
          <ul class="drawer-links" id="colA"></ul>
        </div>
        <div class="col-bc">
          <div class="sec-head col-bc-head" style="display:none;">&nbsp;</div>
          <ul class="drawer-links" id="colB"></ul>
          <div class="group-gap"></div>
          <ul class="drawer-links" id="colC"></ul>
        </div>
        <div class="content-col-d">
          <div class="sec-head blank-head">&nbsp;</div>
          <ul class="drawer-links" id="colD"></ul>
        </div>
      </div>

      <div class="drawer-sep" aria-hidden="true"></div>

      <div class="right-panel">
        <div class="misc-col">
          <div class="sec-head">MISC</div>
          <ul class="drawer-links">
            <li><a href="/asset-library.html">ASSET LIBRARY</a></li>
            <li><a href="/creator-studio.html">CREATOR STUDIO</a></li>
            <li><a href="/squad-builder.html">SQUAD BUILDER</a></li>
            <li><a href="/codes.html">CODE POSTS</a></li>
          </ul>
        </div>
        <div class="data-col">
          <div class="sec-head">DATA</div>
          <ul class="drawer-links">
            <li><a href="/index.html">HOME PAGE</a></li>
            <li><a href="/news.html">NEWS</a></li>
            <li><a href="/contact.html">CONTACT US</a></li>
          </ul>
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
        <span id="bcYearLabel">MADFUT 24</span>
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
  return m ? { PAGE_YEAR: m[1], PAGE_SLUG: m[2] } : { PAGE_YEAR: "24", PAGE_SLUG: file };
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

let activeYear = PAGE_YEAR || "24";

const colAData = {
  slugs:  ["Database","SBC","Objective","Evolution","Draft","Ranked","Fatal","Vote-Promo"],
  labels: ["DATABASE","SBC","OBJECTIVE","EVOLUTION","DRAFT","RANKED","FATAL","VOTE / PROMO"]
};
const colBData = {
  slugs:  ["Cards","LivePlayers","LTMCards","Rarity-Groups"],
  labels: ["CARDS","LIVE PLAYERS","LTM CARDS","RARITY / GROUPS"]
};
const colCData = {
  slugs:  ["Nation","League","Club"],
  labels: ["NATION","LEAGUE","CLUB"]
};
const colDData = {
  slugs:  ["LTMGamemodes","LTMMarket","DraftPackBonuses","PackWeights","DailyLogin","Badges","Formations","LevelRewards"],
  labels: ["LTM / GAMEMODES","LTM MARKET","DRAFT / PACK BONUSES","PACK WEIGHTS","DAILY LOGIN","BADGES","FORMATIONS","LEVEL REWARDS"]
};

function buildList(id, data, year) {
  const ul = document.getElementById(id);
  if (!ul) return;
  ul.innerHTML = "";
  data.slugs.forEach((slug, i) => {
    const li = document.createElement("li");
    const a  = document.createElement("a");
    a.href = "/" + year + "/" + slug + ".html";
    a.textContent = data.labels[i];
    if (slug === "Evolution" && (year === "25" || year === "24")) {
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
  buildList("colD", colDData, yr);

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

const yearSlugs = [
  {slug:"Database",         label:"DATABASE"},
  {slug:"SBC",              label:"SBC"},
  {slug:"Objective",        label:"OBJECTIVE"},
  {slug:"Evolution",        label:"EVOLUTION"},
  {slug:"Draft",            label:"DRAFT"},
  {slug:"Ranked",           label:"RANKED"},
  {slug:"Fatal",            label:"FATAL"},
  {slug:"Vote-Promo",       label:"VOTE / PROMO"},
  {slug:"Cards",            label:"CARDS"},
  {slug:"LivePlayers",      label:"LIVE PLAYERS"},
  {slug:"LTMCards",         label:"LTM CARDS"},
  {slug:"Rarity-Groups",    label:"RARITY / GROUPS"},
  {slug:"Nation",           label:"NATION"},
  {slug:"League",           label:"LEAGUE"},
  {slug:"Club",             label:"CLUB"},
  {slug:"DraftCoop",        label:"DRAFT CO-OP"},
  {slug:"LTMMarket",        label:"LTM MARKET"},
  {slug:"DraftPackBonuses", label:"DRAFT / PACK BONUSES"},
  {slug:"PackWeights",      label:"PACK WEIGHTS"},
  {slug:"DailyLogin",       label:"DAILY LOGIN"},
  {slug:"Badges",           label:"BADGES"},
  {slug:"Formations",       label:"FORMATIONS"},
  {slug:"LevelRewards",     label:"LEVEL REWARDS"},
];

const navPages = [];
["26","25","24"].forEach(yr => {
  yearSlugs.forEach(p => navPages.push({ label: p.label, href: "/" + yr + "/" + p.slug + ".html", year: yr }));
});
[
  {label:"HOME PAGE",      href:"index.html"},
  {label:"NEWS",           href:"news.html"},
  {label:"CONTACT US",     href:"contact.html"},
  {label:"ASSET LIBRARY",  href:"asset-library.html"},
  {label:"CREATOR STUDIO", href:"creator-studio.html"},
  {label:"SQUAD BUILDER",  href:"squad-builder.html"},
  {label:"CODE POSTS",     href:"codes.html"},
  {label:"INSTAGRAM",      href:"https://www.instagram.com/madfoot1910"},
  {label:"YOUTUBE",        href:"https://www.youtube.com/@madfut1910"},
  {label:"TIKTOK",         href:"https://www.tiktok.com/@madfut1910"},
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

function renderDrop(query) {
  searchDropdown.innerHTML = "";
  hlIdx = -1;
  const q = query.trim().toLowerCase();
  let results;
  if (!q) {
    results = navPages.filter(p => !p.year || p.year === activeYear).slice(0, 30);
  } else {
    results = navPages.filter(p => {
      const full = (p.year ? p.year + " " : "") + p.label;
      return full.toLowerCase().includes(q) || p.label.toLowerCase().includes(q);
    });
  }
  if (!results.length) {
    searchDropdown.innerHTML = '<div class="search-no-results">No pages found</div>';
    searchDropdown.classList.add("show");
    return;
  }
  results.forEach(page => {
    const a = document.createElement("a");
    a.className = "search-result";
    a.href = page.href;
    if (page.year && (page.year === "25" || page.year === "24") && page.label === "EVOLUTION") {
      a.style.cssText = "opacity:0.35;pointer-events:none;cursor:default;";
    }
    const labelSpan = document.createElement("span");
    labelSpan.innerHTML = hlText(page.label, query.trim());
    a.appendChild(labelSpan);
    if (page.year) {
      const tag = document.createElement("span");
      tag.className = "search-year-tag";
      tag.textContent = page.year;
      a.appendChild(tag);
    }
    searchDropdown.appendChild(a);
  });
  searchDropdown.classList.add("show");
}

searchInput.addEventListener("input",  () => renderDrop(searchInput.value));
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