import { useEffect, useSyncExternalStore } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { Party, Player, preview, registerGames } from "./data";
const member = (id: string, name: string): Player => ({ id, name, game: "lol", style: "Chill", rank: "Casual", online: true });
const squad = [preview.user, member("ian", "Ian"), member("martin", "Martin"), preview.users[1], preview.users[0]];
export const demoParties: Party[] = [
  { id: "team-korea", owner: "preview", name: "Team Korea", game: "lol", mode: "Normal Draft", tags: ["Chill", "For fun"], capacity: 5, is_open: false, members: squad, status: "In match • 18 min", active: true },
  { id: "team-parsons", owner: "harry", name: "Team Parsons", game: "valorant", mode: "Unrated", tags: ["For fun"], capacity: 5, is_open: false, members: [squad[1], squad[0], member("harry", "Harry")], status: "Last played 3d ago" },
  ...["toad-lover", "toad-lover-2"].map(id => ({ id, owner: "toad", name: "Toad Lover", game: "mario-kart", mode: "Grand Prix", tags: ["For fun"], capacity: 4, is_open: false, members: [squad[3], squad[1], squad[0], member("toad", "Toad")], status: "Last played 23d ago" })),
];
registerGames([{ id: "mario-kart", name: "Mario Kart", modes: ["Grand Prix", "VS Race", "Battle"] }]);
const key = "tomoru.preview.parties.v1";
let saved: Party[] = [];
let hydrated = false;
const listeners = new Set<() => void>();
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
const snapshot = () => saved;
async function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    let value: string | null = null;
    if (Platform.OS === "web") value = localStorage.getItem(key);
    else {
      const count = Number(await SecureStore.getItemAsync(key + ".count")) || 0;
      if (count) value = (await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}.${i}`)))).join("");
    }
    if (value) { const parsed = JSON.parse(value); if (Array.isArray(parsed)) saved = [...saved, ...parsed.filter((party: Party) => !saved.some(item => item.id === party.id))]; }
    saved.forEach(party => { if (party.gameInfo) registerGames([party.gameInfo]); });
    listeners.forEach(listener => listener());
  } catch {}
}
export function usePreviewParties() {
  const created = useSyncExternalStore(subscribe, snapshot, snapshot);
  useEffect(() => { void hydrate(); }, []);
  return [...created, ...demoParties.filter(party => !created.some(item => item.id === party.id))];
}
export async function savePreviewParty(party: Party) {
  await hydrate();
  const next = [party, ...saved.filter(item => item.id !== party.id)];
  const value = JSON.stringify(next);
  if (Platform.OS === "web") localStorage.setItem(key, value);
  else {
    const chunks = value.match(/[\s\S]{1,450}/g) || ["[]"];
    for (let i = 0; i < chunks.length; i++) await SecureStore.setItemAsync(`${key}.${i}`, chunks[i]);
    await SecureStore.setItemAsync(key + ".count", String(chunks.length));
  }
  saved = next;
  listeners.forEach(listener => listener());
}
