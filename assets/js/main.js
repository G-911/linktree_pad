/* EDITA SOLO ESTE BLOQUE PARA RENOVAR LOS ENLACES Y EPISODIOS */
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

const toast = document.querySelector("#toast");
let toastTimer;
function placeholderNotice(event) {
  if (event.currentTarget.dataset.ready === "false") {
    event.preventDefault();
    toast.textContent = "Este enlace está listo para conectar con tu URL definitiva.";
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }
}
function safeLink(url) { return url && /^(https?:\/\/|mailto:|tel:)/i.test(url) ? url : "#"; }
function linkState(url) { return url && /^(https?:\/\/|mailto:|tel:)/i.test(url) ? "true" : "false"; }

document.querySelector("#brand-footer").textContent = `© ${new Date().getFullYear()} ${content.brand}`;
document.querySelector("#intro-copy").textContent = content.intro;
document.title = `${content.brand} — Enlaces y podcast`;

document.querySelector("#main-links").innerHTML = content.links.map(item => `
  <a class="link-card" href="${safeLink(item.url)}" data-ready="${linkState(item.url)}" ${item.url ? 'target="_blank" rel="noopener noreferrer"' : ''}>
    <span class="link-label"><span class="icon" aria-hidden="true">${item.short}</span>${item.label}</span><span class="arrow" aria-hidden="true">↗</span>
  </a>`).join("");

document.querySelector("#latest-number").textContent = content.latest.number;
document.querySelector("#latest-image").src = content.latest.image;
document.querySelector("#latest-meta").textContent = content.latest.meta;
document.querySelector("#latest-title").textContent = content.latest.title;
document.querySelector("#latest-summary").textContent = content.latest.summary;
document.querySelector("#listen-links").innerHTML = content.latest.platforms.map(item => `
  <a class="btn ${item.primary ? "primary" : ""}" href="${safeLink(item.url)}" data-ready="${linkState(item.url)}" ${item.url ? 'target="_blank" rel="noopener noreferrer"' : ''}>${item.label}</a>`).join("");

document.querySelector("#episode-grid").innerHTML = content.promoted.map(item => `
  <a class="mini" href="${safeLink(item.url)}" data-ready="${linkState(item.url)}" ${item.url ? 'target="_blank" rel="noopener noreferrer"' : ''}>
    <span class="mini-num">${item.number}</span><h4>${item.title}</h4><span class="mini-footer"><span>${item.duration}</span><span aria-hidden="true">Escuchar ↗</span></span>
  </a>`).join("");
document.querySelectorAll("[data-ready]").forEach(el => el.addEventListener("click", placeholderNotice));
