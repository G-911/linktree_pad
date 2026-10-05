/* ============================================================
   EDITA SOLO ESTE BLOQUE PARA RENOVAR LOS ENLACES Y EPISODIOS
   ============================================================ */
// YouTube Music abre los mismos vídeos del canal: basta con el ID del vídeo.
const YT_MUSIC_CHANNEL = "https://music.youtube.com/channel/UCo2-SOFL1tcb0Ib0GaK4iog";
const ytMusicUrl = (id) => `https://music.youtube.com/watch?v=${encodeURIComponent(id)}`;

const content = {
  brand: "Palma Al Día",
  intro: "Actualidad, análisis y conversaciones sobre la palmicultura venezolana. Todo en un mismo lugar.",
  links: [
    { label: "Web", icon: "web", url: "https://palmaaldia.com/" },
    { label: "Instagram", icon: "instagram", url: "https://www.instagram.com/palmaaldia/" },
    { label: "WhatsApp", icon: "whatsapp", url: "https://wa.me/584245686789" },
    { label: "YouTube", icon: "youtube", url: "https://www.youtube.com/@Palmaaldia" },
    { label: "YouTube Music", icon: "music", url: YT_MUSIC_CHANNEL }
  ],
  // Los episodios se leen de este archivo, que GitHub Actions regenera desde YouTube
  // (ver scripts/actualizar-youtube.mjs). Si no carga, se usa el respaldo de abajo.
  episodesUrl: "assets/data/youtube.json",
  fallback: {
    series: "Viviendo entre Palmas",
    latest: {
      id: "kXXuxv9rHPE",
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

/* Iconos de trazo (24×24, heredan el color del texto) */
const ICONS = {
  youtube: '<rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="m10 9 5 3-5 3z" fill="currentColor"/>',
  music: '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="5"/><path d="m10.5 9.8 3.4 2.2-3.4 2.2z" fill="currentColor" stroke="none"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/>',
  whatsapp: '<path d="M4.5 19.5 5.6 16A8.5 8.5 0 1 1 8.4 18.6Z"/><path d="M9.2 8.6c.2 2.8 3.4 6 6.2 6.2l.9-1.5-1.8-1-.9.8c-.9-.4-1.8-1.3-2.2-2.2l.8-.9-1-1.8Z" fill="currentColor" stroke="none"/>',
  web: '<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c2.6 2.8 3.8 6 3.8 9.5s-1.2 6.7-3.8 9.5c-2.6-2.8-3.8-6-3.8-9.5s1.2-6.7 3.8-9.5Z"/>'
};

const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] ?? ""}</svg>`;

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
        <span class="icon">${icon(item.icon)}</span>${esc(item.label)}
      </span>
      <span class="arrow" aria-hidden="true">↗</span>
    </a>`).join("");
}

const fmtViews = new Intl.NumberFormat("es");
const fmtDate = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric" });

/** Quita el degradado inferior de una descripción cuando ya no queda texto por leer. */
function markSummaryEnd(summary) {
  summary.classList.toggle("at-end", summary.scrollTop + summary.clientHeight >= summary.scrollHeight - 4);
}

function renderLatest({ series, latest }) {
  const cover = $("#latest-image");
  cover.src = latest.thumbnail;
  cover.parentElement.style.setProperty("--art", `url("${latest.thumbnail}")`);
  cover.alt = `Miniatura del episodio ${latest.number}: ${latest.title}`;

  $("#latest-number").textContent = `EP. ${latest.number}`;
  $("#latest-meta").textContent = [series, `EP. ${latest.number}`, latest.published && fmtDate.format(new Date(latest.published))]
    .filter(Boolean).join(" · ");
  $("#latest-title").textContent = latest.title;

  const summary = $("#latest-summary");
  summary.textContent = latest.description;
  summary.scrollTop = 0;
  markSummaryEnd(summary);

  const platforms = [
    { label: "Ver episodio", url: latest.url, primary: true },
    { label: "Escuchar en YouTube Music", url: ytMusicUrl(latest.id), primary: false }
  ];
  $("#listen-links").innerHTML = platforms.map((item) => `
    <a class="btn ${item.primary ? "primary" : ""}" ${linkAttrs(item.url)}>${esc(item.label)}</a>`).join("");
}

/** Etiqueta de la tarjeta: número de episodio, o el tipo de vídeo si no es un episodio. */
const KIND_LABEL = { short: "Short", live: "Directo", video: "Vídeo" };
const badge = (item) => (item.number != null ? `EP. ${item.number}` : KIND_LABEL[item.kind] ?? "");

function renderTop({ top }) {
  $("#episode-grid").innerHTML = top.map((item, index) => `
    <article class="mini">
      <div class="mini-thumb">
        <img src="${esc(item.thumbnail)}" alt="" loading="lazy">
        <span class="mini-head">
          <span class="mini-rank">Top ${index + 1}</span>
          ${badge(item) ? `<span class="mini-num">${esc(badge(item))}</span>` : ""}
        </span>
      </div>
      <div class="mini-body">
        <h4>${esc(item.title)}</h4>
        <p class="mini-views">${fmtViews.format(item.views)} ${item.views === 1 ? "vista" : "vistas"}</p>
        ${item.description ? `
        <p class="summary mini-summary" tabindex="0" aria-label="Descripción del vídeo">${esc(item.description)}</p>` : ""}
        <div class="mini-actions">
          <a class="btn primary" ${linkAttrs(item.url)}>Ver</a>
          <a class="btn" ${linkAttrs(ytMusicUrl(item.id))}>Escuchar</a>
        </div>
      </div>
    </article>`).join("");
  $("#recommendations").hidden = top.length === 0;
  document.querySelectorAll(".mini-summary").forEach(markSummaryEnd);
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
// El scroll de un elemento no burbujea: se escucha en captura para todas las descripciones.
document.addEventListener("scroll", ({ target }) => {
  if (target.classList?.contains("summary")) markSummaryEnd(target);
}, { capture: true, passive: true });
renderLatest(content.fallback);
renderTop(content.fallback);

loadEpisodes().then((data) => {
  renderLatest(data);
  renderTop(data);
  bindLinks();
});
