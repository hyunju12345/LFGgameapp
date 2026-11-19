import React, { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { CatalogueGame, Game, registerGames } from "./data";
import { LibraryGameCard } from "./game-cards";
import { useGameLibrary } from "./game-library";
import { useStore } from "./store";
import { Empty, ErrorText, Field, colors, styles } from "./ui";
import { DesignIcon } from "./figma-screens";
export function PartyGamePicker({ visible, onClose, onSelect }: { visible: boolean; onClose: () => void; onSelect: (game: Game) => void }) {
  const { games } = useGameLibrary();
  const { request } = useStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!visible || !query.trim()) return;
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const page = await request<{ items: CatalogueGame[] }>(`/games/search?q=${encodeURIComponent(query.trim())}`);
        if (active) setResults(registerGames(page.items));
      } catch (e) { if (active) setError((e as Error).message); }
      finally { if (active) setLoading(false); }
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [query, visible, request]);
  const filteredSaved = games.filter(game => game.name.toLowerCase().includes(query.trim().toLowerCase()));
  const items = query.trim() ? [...new Map([...filteredSaved, ...results].map(game => [game.id, game])).values()] : games;
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,.6)", justifyContent: "flex-end", alignItems: "center" }}>
      <Pressable accessibilityViewIsModal onPress={() => {}} style={{ width: "100%", maxWidth: 402, height: "82%", backgroundColor: colors.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 24 }}>
        <Text style={styles.title}>Game to play</Text>
        <View style={[styles.row, { backgroundColor: colors.field, borderRadius: 12, paddingHorizontal: 8, gap: 8 }]}><DesignIcon name="search" size={16} /><Field accessibilityLabel="Search games for your party" placeholder="Search" value={query} onChangeText={value => { setQuery(value); setResults([]); setError(""); }} style={{ flex: 1, backgroundColor: "transparent" }} /></View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 24, paddingBottom: 24 }}>
          {items.map(game => <LibraryGameCard key={game.id} game={game} onPress={() => { onSelect(game); onClose(); }} />)}
          {loading && <ActivityIndicator color={colors.brand} />}
          <ErrorText message={error} />
          {!items.length && !loading && !error && <Empty title="No games found" detail="Try another game name." />}
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>;
}
