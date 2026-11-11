import React, { useState } from "react";
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Asset } from "expo-asset";
import { SvgUri } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { Player } from "../data";
import { useStore } from "../store";
import { PreviewStatusBar } from "../figma-screens";
import { useResolvedGame } from "../game-library";
import { InvitePlayerRow } from "../invite-picker";
import { addDraftInvitee, useDraftInvitees } from "../party-invite-draft";
import { Empty, ErrorText, colors, styles } from "../ui";
export default function Players() {
  const { game: gameId = "lol", draft = "", limit = "4" } = useLocalSearchParams<{ game: string; draft: string; limit: string }>();
  const { game, error: gameError } = useResolvedGame(gameId);
  const { data, demo, request, refresh } = useStore();
  const invited = useDraftInvitees(draft);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const players = data.users.filter(p => p.friendStatus !== "accepted" && (demo || p.game === gameId)).sort((a, b) => (b.match || 0) - (a.match || 0));
  async function add(player: Player) {
    if (draft) { addDraftInvitee(draft, player, Number(limit)); return; }
    if (demo) { router.push("/auth"); return; }
    setBusy(player.id); setError("");
    try { await request("/friends", "POST", { userId: player.id }); await refresh(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(""); }
  }
  return <SafeAreaView edges={["top", "bottom"]} style={styles.page}>
    <PreviewStatusBar />
    <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace("/games")}><View style={{ transform: [{ rotate: "180deg" }] }}><SvgUri uri={Asset.fromModule(require("../../assets/figma/9c63b.svg")).uri} width={36} height={36} /></View></Pressable><Text style={styles.title}>Recommended teammates</Text></View>
    <ScrollView showsVerticalScrollIndicator={false}>
      <ImageBackground source={game.image} style={s.banner} imageStyle={{ width: "100%", height: "100%" }}>
        <LinearGradient colors={["rgba(102,102,102,0)", "rgba(0,0,0,.7)"]} style={[StyleSheet.absoluteFill]} /><Text style={s.gameName}>{game.name}</Text>
      </ImageBackground>
      <View style={s.content}>
        <ErrorText message={error || gameError} />
        {!players.length && <Empty title="No teammates yet" detail="Players who choose this game will appear here." />}
        {players.map(player => <InvitePlayerRow key={player.id} player={player}
          selected={draft ? invited.some(p => p.id === player.id) : player.friendStatus === "pending" && !player.incoming}
          disabled={!!busy || (!!draft && invited.length >= Number(limit))}
          onAdd={() => void add(player)} onProfile={() => router.push(`/friends/${player.id}`)} />)}
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingTop: 24.8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.card, flexDirection: "row", alignItems: "center", gap: 4 },
  banner: { height: 74, justifyContent: "flex-end", paddingHorizontal: 16, paddingVertical: 8 },
  gameName: { color: "white", fontFamily: "Pretendard-Medium", fontSize: 16, lineHeight: 19 },
  content: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 32, gap: 24 },
});
