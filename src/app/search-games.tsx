import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Asset } from "expo-asset";
import { SvgUri } from "react-native-svg";
import { router } from "expo-router";
import { CatalogueGame, Game, registerGames, updateCatalogueGame } from "../data";
import { DesignIcon, PreviewStatusBar } from "../figma-screens";
import { LibraryGameCard } from "../game-cards";
import { useGameLibrary } from "../game-library";
import { useStore } from "../store";
import { Empty, ErrorText, colors, styles } from "../ui";
type SearchPage = { items: CatalogueGame[]; nextStart: number; total: number; hasMore: boolean };
export default function SearchGames() {
  const { games: saved, add } = useGameLibrary();
  const { request, demo } = useStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Game[]>([]);
  const [selected, setSelected] = useState<Game[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState({ nextStart: 0, hasMore: false });
  const generation = useRef(0);
  const inFlight = useRef(false);
  const savedIds = new Set(saved.map(game => game.id));
  useEffect(() => {
    const current = ++generation.current;
    inFlight.current = false;
    const term = query.trim();
    if (!term) return;
    let active = true;
    const timer = setTimeout(async () => {
      inFlight.current = true;
      try {
        const next = await request<SearchPage>(`/games/search?q=${encodeURIComponent(term)}`);
        if (active && generation.current === current) { setResults(registerGames(next.items)); setPage(next); }
      } catch (e) { if (active && generation.current === current) setError((e as Error).message); }
      finally { if (active && generation.current === current) { setLoading(false); inFlight.current = false; } }
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [query, request]);
  function changeQuery(value: string) {
    generation.current++;
    setQuery(value); setLoading(Boolean(value.trim())); setResults([]); setError(""); setPage({ nextStart: 0, hasMore: false });
  }
  async function more() {
    if (loading || inFlight.current || !page.hasMore) return;
    const current = generation.current;
    inFlight.current = true; setLoading(true); setError("");
    try {
      const next = await request<SearchPage>(`/games/search?q=${encodeURIComponent(query.trim())}&start=${page.nextStart}`);
      if (current === generation.current) { setResults(old => [...new Map([...old, ...registerGames(next.items)].map(game => [game.id, game])).values()]); setPage(next); }
    } catch (e) { if (current === generation.current) setError((e as Error).message); }
    finally { if (current === generation.current) { setLoading(false); inFlight.current = false; } }
  }
  async function save() {
    if ((!selected.length && !removed.length) || saving) return;
    setSaving(true); setError("");
    try {
      const details = demo ? await Promise.all(selected.map(game => request<CatalogueGame>(`/games/${game.id}`))) : selected;
      const items: CatalogueGame[] = details.map(item => 'image' in item ? { id: item.id } : item);
      if (demo) items.forEach(updateCatalogueGame);
      await add(items, removed);
      router.back();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }
  const items = query.trim() ? results : [...saved, ...selected.filter(game => !savedIds.has(game.id))];
  const changed = selected.length > 0 || removed.length > 0;
  return <SafeAreaView edges={["top", "bottom"]} style={styles.page}>
    <PreviewStatusBar />
    <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace("/games")}><View style={{ transform: [{ rotate: "180deg" }] }}><SvgUri uri={Asset.fromModule(require("../../assets/figma/07a18.svg")).uri} width={36} height={36} /></View></Pressable><Text style={styles.title}>Games</Text></View>
    <View style={s.body}>
      <View style={s.search}><DesignIcon name="search" size={16} />
        <TextInput accessibilityLabel="Search Steam games" placeholder="Search" placeholderTextColor={colors.muted} value={query} onChangeText={changeQuery} autoCapitalize="none" autoCorrect={false} returnKeyType="search" style={s.input} />
      </View>
      <FlatList data={items} keyExtractor={game => game.id} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 24, paddingBottom: 104 }} onEndReached={() => void more()} onEndReachedThreshold={.5}
        renderItem={({ item }) => <LibraryGameCard game={item} selectable selected={(savedIds.has(item.id) && !removed.includes(item.id)) || selected.some(game => game.id === item.id)} disabled={saving}
          onPress={() => { if (savedIds.has(item.id)) { setRemoved(old => old.includes(item.id) ? old.filter(id => id !== item.id) : [...old, item.id]); return; } setSelected(old => old.some(game => game.id === item.id) ? old.filter(game => game.id !== item.id) : old.length < 30 ? [...old, item] : old); }} />}
        ListEmptyComponent={!loading && !error ? <Empty title="No new games found" detail="Search for a game to add to your list." /> : undefined}
        ListFooterComponent={<View style={{ gap: 12 }}>{loading && <ActivityIndicator color={colors.brand} />}{!!error && <Pressable onPress={() => changeQuery(query + " ")}><ErrorText message={error + " Tap to retry."} /></Pressable>}</View>} />
    </View>
    <View style={s.footer}><Pressable accessibilityRole="button" accessibilityLabel="Add games" disabled={!changed || saving} onPress={() => void save()} style={[s.button, (!changed || saving) && { opacity: .6 }]}>
      {saving ? <ActivityIndicator color="white" /> : <Text style={s.buttonText}>Add games</Text>}
    </Pressable></View>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  header: { paddingTop: 24.8, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", gap: 8 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 24, gap: 32 },
  search: { backgroundColor: colors.field, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8, height: 27 },
  input: { flex: 1, padding: 0, color: "white", fontFamily: "Pretendard-SemiBold", fontSize: 16, lineHeight: 19, outlineWidth: 0 },
  footer: { position: "absolute", left: 20, right: 20, bottom: 32 },
  button: { backgroundColor: colors.brand, height: 35, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  buttonText: { fontFamily: "Pretendard-Bold", fontSize: 16, lineHeight: 19, color: "white" },
});
