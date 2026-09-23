/* ============================================================
   EDITA SOLO ESTE BLOQUE PARA RENOVAR LOS ENLACES Y EPISODIOS
   ============================================================ */
// Enlace del podcast en Spotify. Mientras esté vacío, los botones de Spotify
// muestran el aviso de "enlace por conectar".
const SPOTIFY_URL = "";

const content = {
  brand: "Palma Al Día",
  intro: "Actualidad, análisis y conversaciones sobre la palmicultura venezolana. Todo en un mismo lugar.",
  links: [
    { label: "Web", short: "WEB", url: "https://palmaaldia.com/" },
    { label: "Instagram", short: "IG", url: "https://www.instagram.com/palmaaldia/" },
    { label: "WhatsApp", short: "WA", url: "https://wa.me/584245686789" },
    { label: "YouTube", short: "YT", url: "https://www.youtube.com/@Palmaaldia" },
    { label: "Spotify", short: "SP", url: SPOTIFY_URL }
  ],
  // Los episodios se leen de este archivo, que GitHub Actions regenera desde YouTube
  // (ver scripts/actualizar-youtube.mjs). Si no carga, se usa el respaldo de abajo.
  episodesUrl: "assets/data/youtube.json",
  fallback: {
    series: "Viviendo entre Palmas",
    latest: {
      number: 8,
      title: "UNDERPLANTING: La FALSA PROMESA del negocio de la palma aceitera",
      description: "En este episodio de Viviendo entre Palmas, conversamos con el ingeniero Álvaro Carmona sobre la renovación de plantaciones de palma aceitera.",
      thumbnail: "https://i.ytimg.com/vi/kXXuxv9rHPE/maxresdefault.jpg",
      url: "https://www.youtube.com/watch?v=kXXuxv9rHPE",
      published: "2026-09-10T23:00:06+00:00"
    },
    top: []
  }
};

/* ============================================================
   Utilidades
   ============================================================ */
const SAFE_PROTOCOL = /^(https?:\/\/|mailto:|tel:)/i;

const $ = (selector) => document.querySelector(selector);

/** Escapa el texto que se inserta como HTML, para que una comilla no rompa el marcado. */
const esc = (text) => String(text ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

/** Atributos de un enlace: si la URL no es válida queda inerte y muestra el aviso. */
function linkAttrs(url) {
  const ready = SAFE_PROTOCOL.test(url ?? "");
  return ready
    ? `href="${esc(url)}" data-ready="true" target="_blank" rel="noopener noreferrer"`
    : 'href="#" data-ready="false"';
}

/* ============================================================
   Aviso flotante para enlaces aún sin configurar
   ============================================================ */
let toastTimer;

function placeholderNotice(event) {
  if (event.currentTarget.dataset.ready !== "false") return;

  event.preventDefault();
  const toast = $("#toast");
  toast.textContent = "Este enlace está listo para conectar con tu URL definitiva.";
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

/* ============================================================
   Render
   ============================================================ */
function renderHeader() {
  document.title = `${content.brand} — Enlaces y podcast`;
  $("#intro-copy").textContent = content.intro;
  $("#brand-footer").textContent = `© ${new Date().getFullYear()} ${content.brand}`;
}

function renderLinks() {
  $("#main-links").innerHTML = content.links.map((item) => `
    <a class="link-card" ${linkAttrs(item.url)}>
      <span class="link-label">
        <span class="icon" aria-hidden="true">${esc(item.short)}</span>${esc(item.label)}
      </span>
      <span class="arrow" aria-hidden="true">↗</span>
    </a>`).join("");
}

const fmtViews = new Intl.NumberFormat("es");
const fmtDate = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric" });

function renderLatest({ series, latest }) {
  const cover = $("#latest-image");
  cover.src = latest.thumbnail;
  cover.alt = `Miniatura del episodio ${latest.number}: ${latest.title}`;

  $("#latest-number").textContent = `EP. ${latest.number}`;
  $("#latest-meta").textContent = [series, `EP. ${latest.number}`, latest.published && fmtDate.format(new Date(latest.published))]
    .filter(Boolean).join(" · ");
  $("#latest-title").textContent = latest.title;

  const summary = $("#latest-summary");
  summary.textContent = latest.description;
  summary.scrollTop = 0;

  const platforms = [
    { label: "Ver episodio", url: latest.url, primary: true },
    { label: "Escuchar en Spotify", url: SPOTIFY_URL, primary: false }
  ];
  $("#listen-links").innerHTML = platforms.map((item) => `
    <a class="btn ${item.primary ? "primary" : ""}" ${linkAttrs(item.url)}>${esc(item.label)}</a>`).join("");
}

function renderTop({ top }) {
  $("#episode-grid").innerHTML = top.map((item, index) => `
    <article class="mini">
      <div class="mini-thumb">
        <img src="${esc(item.thumbnail)}" alt="" loading="lazy">
        <span class="mini-head">
          <span class="mini-rank">Top ${index + 1}</span>
          <span class="mini-num">EP. ${esc(item.number)}</span>
        </span>
      </div>
      <div class="mini-body">
        <h4>${esc(item.title)}</h4>
        <p class="mini-views">${fmtViews.format(item.views)} ${item.views === 1 ? "vista" : "vistas"}</p>
        ${item.description ? `
        <details class="mini-desc">
          <summary>Leer descripción</summary>
          <p tabindex="0">${esc(item.description)}</p>
        </details>` : ""}
        <div class="mini-actions">
          <a class="btn primary" ${linkAttrs(item.url)}>Ver</a>
          <a class="btn" ${linkAttrs(SPOTIFY_URL)}>Escuchar</a>
        </div>
      </div>
    </article>`).join("");
  $("#recommendations").hidden = top.length === 0;
}

async function loadEpisodes() {
  try {
    const res = await fetch(content.episodesUrl, { cache: "no-cache" });
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch {
    return content.fallback;
  }
}

function bindLinks() {
  document.querySelectorAll("[data-ready]").forEach((el) => {
    el.addEventListener("click", placeholderNotice);
  });
}

/* ============================================================
   Arranque
   ============================================================ */
renderHeader();
renderLinks();
renderLatest(content.fallback);
renderTop(content.fallback);

loadEpisodes().then((data) => {
  renderLatest(data);
  renderTop(data);
  bindLinks();
});
