/* ============================================================
   Descarga el feed RSS del canal de YouTube y genera
   assets/data/youtube.json con el último episodio y el top
   de episodios más vistos. Sin dependencias: Node 18+.

   Uso: node scripts/actualizar-youtube.mjs
   ============================================================ */
import { writeFile, mkdir } from "node:fs/promises";

const CHANNEL_ID = "UCo2-SOFL1tcb0Ib0GaK4iog";
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const OUTPUT = new URL("../assets/data/youtube.json", import.meta.url);
const TOP_SIZE = 3;

/** Solo cuentan como episodios los vídeos con "EP #008" (o "EP 8") en el título. */
const EPISODE_RE = /\bEP\.?\s*#?\s*(\d+)/i;

/** Quita el sufijo "| EP #008 Viviendo Entre Palmas" que ya se muestra aparte. */
const cleanTitle = (title) => title.replace(/\s*\|\s*EP\.?\s*#?\s*\d+.*$/i, "").trim();

const decode = (text) => text
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&amp;/g, "&");

const pick = (xml, re) => decode(xml.match(re)?.[1] ?? "");

function parseEntry(xml) {
  const id = pick(xml, /<yt:videoId>([^<]+)<\/yt:videoId>/);
  const rawTitle = pick(xml, /<title>([^<]*)<\/title>/);
  const number = rawTitle.match(EPISODE_RE)?.[1];

  return {
    id,
    number: number ? Number(number) : null,
    title: cleanTitle(rawTitle),
    rawTitle,
    description: pick(xml, /<media:description>([\s\S]*?)<\/media:description>/).trim(),
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${id}`,
    published: pick(xml, /<published>([^<]+)<\/published>/),
    views: Number(pick(xml, /<media:statistics views="(\d+)"/) || 0)
  };
}

const res = await fetch(FEED_URL);
if (!res.ok) throw new Error(`YouTube respondió ${res.status}`);
const feed = await res.text();

const series = pick(feed, /<title>([^<]*)<\/title>/);
const episodes = [...feed.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
  .map(([, entry]) => parseEntry(entry))
  .filter((video) => video.number !== null)
  .sort((a, b) => b.published.localeCompare(a.published));

if (!episodes.length) throw new Error("El feed no trae ningún episodio; no se toca el JSON.");

const [latest] = episodes;
const top = episodes
  .filter((video) => video.id !== latest.id)
  .sort((a, b) => b.views - a.views)
  .slice(0, TOP_SIZE);

const data = {
  channelUrl: `https://www.youtube.com/channel/${CHANNEL_ID}`,
  series,
  latest,
  top
};

await mkdir(new URL(".", OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Último: EP ${latest.number} · Top: ${top.map((v) => `EP ${v.number} (${v.views})`).join(", ")}`);
