/* ============================================================
   Descarga el feed RSS del canal de YouTube y genera
   assets/data/youtube.json con el último episodio y el top
   de vídeos más vistos del canal. Sin dependencias: Node 18+.

   El feed solo trae los 15 vídeos más recientes, así que el JSON
   guarda un catálogo con todo lo visto hasta ahora: un vídeo que sale
   del feed sigue contando para el top con sus últimas vistas conocidas.
   Con YOUTUBE_API_KEY (YouTube Data API v3) se refrescan las vistas
   de todo el catálogo.

   Uso: node scripts/actualizar-youtube.mjs
   ============================================================ */
import { readFile, writeFile, mkdir } from "node:fs/promises";

const CHANNEL_ID = "UCo2-SOFL1tcb0Ib0GaK4iog";
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const OUTPUT = new URL("../assets/data/youtube.json", import.meta.url);
const TOP_SIZE = 3;

/** Solo cuentan como episodios los vídeos con "EP #008" (o "EP 8") en el título. */
const EPISODE_RE = /\bEP\.?\s*#?\s*(\d+)/i;

/**
 * Título para la página: sin el sufijo "| EP #008 Viviendo Entre Palmas" (se muestra aparte),
 * sin emojis iniciales ("🚨", "🔴") y sin el prefijo "LIVE |".
 */
const cleanTitle = (title) => title
  .replace(/\s*\|\s*EP\.?\s*#?\s*\d+.*$/i, "")
  .replace(/^[^\p{L}\p{N}¿¡]+/u, "")
  .replace(/^LIVE\s*\|\s*/i, "")
  .trim();

/** Episodio del podcast, short o directo: la página lo indica en la tarjeta. */
function kindOf(link, rawTitle, number) {
  if (number !== null) return "episode";
  if (link.includes("/shorts/")) return "short";
  if (/\bLIVE\b|en vivo|en directo/i.test(rawTitle)) return "live";
  return "video";
}

const decode = (text) => text
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&amp;/g, "&");

const pick = (xml, re) => decode(xml.match(re)?.[1] ?? "");

function parseEntry(xml) {
  const id = pick(xml, /<yt:videoId>([^<]+)<\/yt:videoId>/);
  const rawTitle = pick(xml, /<title>([^<]*)<\/title>/);
  const match = rawTitle.match(EPISODE_RE)?.[1];
  const number = match ? Number(match) : null;
  const link = pick(xml, /<link rel="alternate" href="([^"]+)"/);

  return {
    id,
    kind: kindOf(link, rawTitle, number),
    number,
    title: cleanTitle(rawTitle),
    rawTitle,
    description: pick(xml, /<media:description>([\s\S]*?)<\/media:description>/).trim(),
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    // Los shorts se abren en su reproductor vertical.
    url: link.includes("/shorts/") ? link : `https://www.youtube.com/watch?v=${id}`,
    published: pick(xml, /<published>([^<]+)<\/published>/),
    views: Number(pick(xml, /<media:statistics views="(\d+)"/) || 0)
  };
}

const res = await fetch(FEED_URL);
if (!res.ok) throw new Error(`YouTube respondió ${res.status}`);
const feed = await res.text();

const series = pick(feed, /<title>([^<]*)<\/title>/);
const videos = [...feed.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, entry]) => parseEntry(entry));
const episodes = videos
  .filter((video) => video.kind === "episode")
  .sort((a, b) => b.published.localeCompare(a.published));

if (!episodes.length) throw new Error("El feed no trae ningún episodio; no se toca el JSON.");

/* Catálogo: lo que ya había en el JSON, actualizado con lo que trae el feed. */
const previous = await readFile(OUTPUT, "utf8").then(JSON.parse).catch(() => ({}));
const catalog = new Map((previous.catalog ?? []).map((video) => [video.id, video]));
for (const video of videos) catalog.set(video.id, video);

/** Vistas al día de todo el catálogo (lotes de 50 IDs, 1 unidad de cuota por lote). */
async function refreshViews(apiKey) {
  const ids = [...catalog.keys()];
  for (let i = 0; i < ids.length; i += 50) {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.search = new URLSearchParams({ part: "statistics", id: ids.slice(i, i + 50).join(","), key: apiKey });
    const res = await fetch(url);
    if (!res.ok) throw new Error(`YouTube Data API respondió ${res.status}`);
    const { items = [] } = await res.json();
    for (const item of items) catalog.get(item.id).views = Number(item.statistics.viewCount ?? 0);
  }
}

if (process.env.YOUTUBE_API_KEY) await refreshViews(process.env.YOUTUBE_API_KEY);

/** Miniatura más nítida disponible: no todos los vídeos tienen maxres. */
async function bestThumbnail(id) {
  for (const quality of ["maxresdefault", "sddefault"]) {
    const url = `https://i.ytimg.com/vi/${id}/${quality}.jpg`;
    const head = await fetch(url, { method: "HEAD" }).catch(() => null);
    if (head?.ok) return url;
  }
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

const [latest] = episodes;
latest.thumbnail = await bestThumbnail(latest.id);
// Top del canal entero (episodios, shorts y directos); el último episodio ya tiene su bloque.
const top = [...catalog.values()]
  .filter((video) => video.id !== latest.id)
  .sort((a, b) => b.views - a.views)
  .slice(0, TOP_SIZE);

const data = {
  channelUrl: `https://www.youtube.com/channel/${CHANNEL_ID}`,
  series,
  latest,
  top,
  catalog: [...catalog.values()]
    .sort((a, b) => b.published.localeCompare(a.published))
    .map(({ rawTitle, ...video }) => video)
};

await mkdir(new URL(".", OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Último: EP ${latest.number} · Top: ${top.map((v) => `${v.title.slice(0, 30)} (${v.views})`).join(" | ")}`);
