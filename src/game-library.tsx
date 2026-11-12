import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { CatalogueGame, Game, gameById, libraryDefaults, registerGames, updateCatalogueGame } from "./data";
import { useStore } from "./store";
const storageKey = "partyup.demo.games.v1";
async function readLocal(): Promise<CatalogueGame[] | null> {
  if (Platform.OS === "web") return JSON.parse(localStorage.getItem(storageKey) || "null");
  const count = Number(await SecureStore.getItemAsync(storageKey + ".count")) || 0;
  if (!count) return null;
  const chunks = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${storageKey}.${i}`)));
  return JSON.parse(chunks.join(""));
}
async function writeLocal(games: CatalogueGame[]) {
  const json = JSON.stringify(games);
  if (Platform.OS === "web") { localStorage.setItem(storageKey, json); return; }
  // SecureStore has a small per-value limit; split catalogue metadata into bounded chunks.
  const chunks = json.match(/[\s\S]{1,450}/g) || ["[]"];
  for (let i = 0; i < chunks.length; i++) await SecureStore.setItemAsync(`${storageKey}.${i}`, chunks[i]);
  await SecureStore.setItemAsync(storageKey + ".count", String(chunks.length));
}
const encode = (game: Game): CatalogueGame => ({ id: game.id, steamId: game.steamId, name: game.name, modes: game.modes, imageUrl: typeof game.image === "object" && "uri" in game.image ? game.image.uri : undefined });
const Context = createContext<{ games: Game[]; loading: boolean; error: string; add: (games: CatalogueGame[], removeIds?: string[]) => Promise<void>; reload: () => Promise<void> } | null>(null);
export function GameLibraryProvider({ children }: { children: React.ReactNode }) {
  const { data, demo, request } = useStore();
  const [games, setGames] = useState<Game[]>(libraryDefaults);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const current = ++generation.current;
    await Promise.resolve();
    setLoading(true); setError("");
    try {
      const saved = demo ? await readLocal() : await request<CatalogueGame[]>("/games/library");
      if (current === generation.current) setGames(saved ? registerGames(saved) : libraryDefaults);
    } catch (e) { if (current === generation.current) setError((e as Error).message); }
    finally { if (current === generation.current) setLoading(false); }
  }, [demo, request]);
  useEffect(() => {
    let active = true;
    const source = demo ? readLocal() : request<CatalogueGame[]>("/games/library");
    void source.then(saved => { if (active) { setGames(saved ? registerGames(saved) : libraryDefaults); setError(""); } })
      .catch(e => { if (active) { setGames(libraryDefaults); setError((e as Error).message); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [demo, request, data.user.id]);
  async function add(items: CatalogueGame[], removeIds: string[] = []) {
    if (demo) {
      const map = new Map(games.map(game => [game.id, encode(game)]));
      removeIds.forEach(id => map.delete(id));
      for (const item of items) map.set(item.id, item);
      const saved = [...map.values()];
      await writeLocal(saved);
      setGames(registerGames(saved));
    } else {
      const saved = await request<CatalogueGame[]>("/games/library", "POST", { ids: items.map(game => game.id), removeIds });
      setGames(registerGames(saved));
    }
  }
  return <Context.Provider value={{ games, loading, error, add, reload }}>{children}</Context.Provider>;
}
export function useGameLibrary() {
  const context = useContext(Context);
  if (!context) throw new Error("Game library missing");
  return context;
}
export function useResolvedGame(id?: string) {
  const { request } = useStore();
  const [resolved, setResolved] = useState<{ id?: string; game: Game; error: string } | null>(null);
  useEffect(() => {
    let active = true;
    if (id?.startsWith("steam:")) void request<CatalogueGame>(`/games/${id}`).then(item => {
      if (active) setResolved({ id, game: updateCatalogueGame(item), error: "" });
    }).catch(e => { if (active) setResolved({ id, game: gameById(id), error: (e as Error).message }); });
    return () => { active = false; };
  }, [id, request]);
  return resolved && resolved.id === id ? resolved : { game: gameById(id), error: "" };
}
