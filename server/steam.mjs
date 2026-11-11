// Steam's public storefront search; keep this server-side for browser CORS support.
const cache = new Map();
const flights = new Map();
const decode = (s) => s.replace(/&#(x[0-9a-f]+|\d+);|&(amp|quot|apos|lt|gt|nbsp);/gi, (_, n, key) => n ? String.fromCodePoint(n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n)) : ({amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '}[key.toLowerCase()]));
export function parseSteamSearch(payload, start = 0) {
  if (!payload?.success || typeof payload.results_html !== 'string') throw new Error('Invalid Steam response');
  const items = [];
  const rows = [...payload.results_html.matchAll(/<a\b[^>]*data-ds-appid="(\d+)"[^>]*>([\s\S]*?)<\/a>/g)];
  for (const [, appid, html] of rows) {
    const name = html.match(/<span class="title">([\s\S]*?)<\/span>/)?.[1];
    const image = html.match(/<img\b[^>]*src="(https:\/\/[^" ]+)"/)?.[1];
    if (!name || !image) continue;
    const imageUrl = decode(image);
    if (!/^https:\/\/[^/]*steamstatic\.com\//.test(imageUrl)) continue;
    items.push({ id: `steam:${appid}`, steamId: Number(appid), name: decode(name.replace(/<[^>]+>/g, '')), imageUrl, modes: ['Default'] });
  }
  const nextStart = start + rows.length;
  return { items, total: Number(payload.total_count) || 0, nextStart, hasMore: rows.length > 0 && nextStart < Number(payload.total_count) };
}
async function steamJson(url) {
  const key = url.toString();
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;
  if (flights.has(key)) return flights.get(key);
  const pending = (async () => {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(7000), headers: { 'Accept': 'application/json' } });
      if (!response.ok) throw new Error('Steam unavailable');
      const value = await response.json();
      if (cache.size >= 200) cache.delete(cache.keys().next().value);
      cache.set(key, { value, expires: Date.now() + 300000 });
      return value;
    } catch { throw Object.assign(new Error('Steam search is temporarily unavailable. Please retry.'), { status: 502 }); }
    finally { flights.delete(key); }
  })();
  flights.set(key, pending);
  return pending;
}
export async function searchSteam(query, start = 0) {
  const url = new URL('https://store.steampowered.com/search/results/');
  url.search = new URLSearchParams({ term: query, start: String(start), count: '30', infinite: '1', json: '1', category1: '998' }).toString();
  try { return parseSteamSearch(await steamJson(url), start); }
  catch (error) { if (error.status) throw error; throw Object.assign(new Error('Steam search is temporarily unavailable. Please retry.'), { status: 502 }); }
}
export async function steamGame(id) {
  if (!/^steam:[1-9]\d{0,9}$/.test(id)) throw Object.assign(new Error('Choose a valid Steam game.'), { status: 400 });
  const appid = id.slice(6);
  const payload = await steamJson(new URL(`https://store.steampowered.com/api/appdetails?appids=${appid}&l=english`));
  const app = payload[appid];
  if (!app?.success || app.data.type !== 'game') throw Object.assign(new Error('This Steam game is not available.'), { status: 404 });
  return { id, steamId: Number(appid), name: app.data.name, imageUrl: app.data.header_image, modes: ['Default'] };
}
