import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { DesignIcon, PreviewStatusBar } from "../../figma-screens";
import { LibraryGameCard } from "../../game-cards";
import { useGameLibrary } from "../../game-library";
import { Empty, ErrorText, colors, styles } from "../../ui";
export default function Games() {
  const { games, loading, error, reload } = useGameLibrary();
  return <SafeAreaView edges={["top"]} style={styles.page}>
    <PreviewStatusBar />
    <View style={s.header}><Text style={styles.title}>Games</Text></View>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Pressable accessibilityRole="button" accessibilityLabel="Search Steam games" onPress={() => router.push("/search-games")} style={s.search}>
        <DesignIcon name="search" size={16} /><Text style={s.placeholder}>Search</Text>
      </Pressable>
      {loading && <ActivityIndicator color={colors.brand} />}
      {!!error && <Pressable onPress={() => void reload()}><ErrorText message={error + " Tap to retry."} /></Pressable>}
      <View style={{ gap: 24 }}>
        {games.map(game => <LibraryGameCard key={game.id} game={game} onPress={() => router.push({ pathname: "/create-party", params: { game: game.id } })} />)}
        {!loading && !games.length && <Empty title="Add your games" detail="Search Steam to add games to your list." />}
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingTop: 23.8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.card },
  content: { paddingHorizontal: 20, paddingVertical: 32, gap: 32 },
  search: { backgroundColor: colors.field, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8, height: 27 },
  placeholder: { color: colors.muted, fontFamily: "Pretendard-SemiBold", fontSize: 16, lineHeight: 19 },
});
