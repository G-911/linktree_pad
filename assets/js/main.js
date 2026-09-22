/* ============================================================
   EDITA SOLO ESTE BLOQUE PARA RENOVAR LOS ENLACES Y EPISODIOS
   ============================================================ */
const content = {
  brand: "Palma Al Día",
  intro: "Actualidad, análisis y conversaciones sobre la palmicultura venezolana. Todo en un mismo lugar.",
  links: [
    { label: "Web en construcción", short: "WEB", url: "https://palmaaldia.com/" },
    { label: "Instagram", short: "IG", url: "https://www.instagram.com/palmaaldia/" },
    { label: "WhatsApp", short: "WA", url: "https://wa.me/584245686789" },
    { label: "YouTube", short: "YT", url: "https://www.youtube.com/@Palmaaldia" }
  ],
  latest: {
    number: "EP. 008",
    image: "https://i.ytimg.com/vi/kXXuxv9rHPE/hqdefault.jpg",
    imageAlt: "Portada del episodio más reciente de Viviendo Entre Palmas",
    meta: "VIVIENDO ENTRE PALMAS · EP. 008",
    title: "Underplanting: la falsa promesa del negocio de la palma aceitera",
    summary: "Una conversación que pone bajo la lupa el underplanting y sus implicaciones para el negocio de la palma aceitera.",
    platforms: [
      { label: "Ver episodio", url: "https://www.youtube.com/watch?v=kXXuxv9rHPE", primary: true },
      { label: "Canal de YouTube", url: "https://www.youtube.com/@Palmaaldia", primary: false }
    ]
  },
  promoted: [
    { number: "EP. 007", title: "El biochar es la oportunidad para transformar la palma en Venezuela", duration: "Ver episodio", url: "https://www.youtube.com/watch?v=N0Tx9yvKHDU" },
    { number: "EP. 006", title: "Las pérdidas que genera un fruto de palma de baja calidad", duration: "Ver episodio", url: "https://www.youtube.com/watch?v=-DgV6JoWCI0" },
    { number: "EP. 005", title: "¿Quién define el precio de la fruta?", duration: "Ver episodio", url: "https://www.youtube.com/watch?v=L5_gbszoDvs" }
  ]
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

function renderLatest() {
  const { number, image, imageAlt, meta, title, summary, platforms } = content.latest;

  const cover = $("#latest-image");
  cover.src = image;
  cover.alt = imageAlt;

  $("#latest-number").textContent = number;
  $("#latest-meta").textContent = meta;
  $("#latest-title").textContent = title;
  $("#latest-summary").textContent = summary;

  $("#listen-links").innerHTML = platforms.map((item) => `
    <a class="btn ${item.primary ? "primary" : ""}" ${linkAttrs(item.url)}>${esc(item.label)}</a>`).join("");
}

function renderPromoted() {
  $("#episode-grid").innerHTML = content.promoted.map((item) => `
    <a class="mini" ${linkAttrs(item.url)}>
      <span class="mini-num">${esc(item.number)}</span>
      <h4>${esc(item.title)}</h4>
      <span class="mini-footer">
        <span>${esc(item.duration)}</span>
        <span aria-hidden="true">Escuchar ↗</span>
      </span>
    </a>`).join("");
}

/* ============================================================
   Arranque
   ============================================================ */
renderHeader();
renderLinks();
renderLatest();
renderPromoted();

document.querySelectorAll("[data-ready]").forEach((el) => {
  el.addEventListener("click", placeholderNotice);
});
