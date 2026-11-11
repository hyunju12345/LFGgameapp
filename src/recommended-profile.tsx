import React, { useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Player, gameById } from "./data";
import { Avatar, Empty, ErrorText, colors, styles } from "./ui";
import { DesignHeader, DesignIcon, PreviewStatusBar } from "./figma-screens";
import { useStore } from "./store";
const history = [
  { game: "lol", mode: "ARAM", date: "Nov 9, 2026", result: "Defeat" },
  { game: "valorant", mode: "Unrated", date: "Nov 8, 2026", result: "Defeat" },
  { game: "valorant", mode: "Unrated", date: "Nov 8, 2026", result: "Victory" },
];
export function RecommendedProfile({ player }: { player: Player }) {
  const { demo, request, refresh } = useStore();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const match = Math.max(0, Math.min(100, player.match || 0));
  async function add() {
    if (demo) { router.push("/auth"); return; }
    setBusy(true); setError("");
    try { await request("/friends", "POST", { userId: player.id }); await refresh(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <SafeAreaView edges={["top"]} style={styles.page}>
    <PreviewStatusBar />
    <View style={{ paddingHorizontal: 4 }}><DesignHeader title={player.name} action={<View style={{ width: 28, alignItems: "center" }}><DesignIcon name="more" /></View>} /></View>
    <ScrollView ref={scroll} showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
      <View style={s.hero}>
        <View style={s.identity}>
          <View style={{ width: 104, height: 104 }}>
            {demo && player.id === "alex" ? <Image source={require("../assets/figma/b3cb9.png")} style={s.portrait} /> : <Avatar name={player.name} size={104} />}
            {player.online && <View style={s.online}><DesignIcon name="online" size={24} /></View>}
          </View>
          <Text style={s.name}>{player.name}</Text>
        </View>
        <LinearGradient colors={["#303030", "#715695"]} start={{ x: 0, y: 0 }} end={{ x: 1.1547, y: .31 }} style={s.compatibility}>
          <View style={{ gap: 4 }}><Text style={s.name}>{match}% Match</Text><Text style={s.caption}>{demo ? "Both are in similar rank, play fun, Evening players" : player.reason || "Compare your play preferences"}</Text></View>
          <View style={s.track}><LinearGradient colors={["#aaacff", colors.brand]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.progress, { width: `${match}%` }]} /></View>
        </LinearGradient>
        <View style={s.actions}>
          <Pressable accessibilityRole="button" onPress={() => demo ? router.push({ pathname: "/preview-conversation", params: { id: player.id } }) : setError("Join a shared party to chat.")} style={[s.action, s.message]}><Text style={s.actionText}>Message</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={busy || (player.friendStatus === "pending" && !player.incoming)} onPress={() => void add()} style={[s.action, { backgroundColor: colors.brand }]}><Text style={s.actionText}>{busy ? "…" : player.friendStatus === "pending" ? player.incoming ? "Accept" : "Requested" : "Add friend"}</Text></Pressable>
        </View>
      </View>
      {!!error && <ErrorText message={error} />}
      <View style={{ gap: 24 }}>
        <View style={{ gap: 16 }}><Text style={s.title}>Play preferences</Text>
          <View style={s.tags}>{(demo ? ["Chill", "Every night", "For fun", "Voice chat"] : [player.style]).map(tag => <View key={tag} style={[s.tag, { minWidth: ({ Chill: 60, "Every night": 99, "For fun": 74, "Voice chat": 94 } as Record<string, number>)[tag] }]}><Text style={s.tagText}>{tag}</Text></View>)}</View>
        </View>
        <View style={{ gap: 16 }}>
          <View style={[styles.spread, { paddingHorizontal: 4 }]}><Text style={[s.title, { paddingHorizontal: 0 }]}>Play history</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="View all play history" onPress={() => scroll.current?.scrollToEnd({ animated: true })} style={[styles.row, { gap: 0 }]}><Text style={s.link}>View all</Text><DesignIcon name="next" size={12} /></Pressable>
          </View>
          {demo ? history.map((item, index) => <View key={index} style={s.historyCard}>
            <Image source={gameById(item.game).image} style={s.game} />
            <View style={{ gap: 8, flex: 1 }}><View style={{ gap: 4 }}><Text style={s.mode}>{item.mode}</Text><Text style={[s.caption, { opacity: .8 }]}>{item.date}</Text></View>
              <View style={[s.result, { backgroundColor: item.result === "Victory" ? "rgba(0,128,255,.5)" : "rgba(255,0,0,.5)" }]}><Text style={s.caption}>{item.result}</Text></View>
            </View><DesignIcon name="editNext" size={24} />
          </View>) : <Empty title="No play history yet" detail="Game results will appear when play history is available." />}
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32, gap: 32 },
  hero: { gap: 24 }, identity: { alignItems: "center", gap: 16 },
  portrait: { width: 104, height: 104, borderRadius: 1000, borderWidth: 1, borderColor: "black" },
  online: { position: "absolute", left: 80, top: -.2 },
  name: { color: "white", fontFamily: "Pretendard-Bold", fontSize: 20, lineHeight: 24 },
  caption: { color: "white", fontFamily: "Pretendard-Regular", fontSize: 12, lineHeight: 14 },
  compatibility: { padding: 16, borderRadius: 12, gap: 16 }, track: { height: 12, borderRadius: 16, backgroundColor: "rgba(0,0,0,.2)", overflow: "hidden" }, progress: { height: 12, borderRadius: 16 },
  actions: { flexDirection: "row", gap: 16, paddingHorizontal: 4 }, action: { flex: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, alignItems: "center", justifyContent: "center", height: 32 },
  message: { borderWidth: 1, borderColor: "white" }, actionText: { color: "white", fontFamily: "Pretendard-SemiBold", fontSize: 12, lineHeight: 14 },
  title: { color: "white", fontFamily: "Pretendard-SemiBold", fontSize: 16, lineHeight: 19, paddingHorizontal: 4 },
  tags: { flexDirection: "row", gap: 12, flexWrap: "wrap" }, tag: { borderWidth: 1, borderColor: colors.brand, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, alignItems: "center" }, tagText: { color: colors.brand, fontFamily: "Pretendard-Bold", fontSize: 12, lineHeight: 16.8 },
  historyCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, padding: 16, gap: 16, borderRadius: 12 },
  game: { width: 67, height: 67, borderRadius: 8 }, mode: { color: "white", fontFamily: "Pretendard-Medium", fontSize: 16, lineHeight: 19 },
  result: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" }, link: { color: colors.brand, fontFamily: "Pretendard-SemiBold", fontSize: 12, lineHeight: 14 },
});
