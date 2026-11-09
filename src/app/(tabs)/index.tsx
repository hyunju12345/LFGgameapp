import React, { useState } from "react";
import { ActivityIndicator, Image, ImageSourcePropType, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Asset } from "expo-asset";
import { SvgUri } from "react-native-svg";
import { Avatar, Empty, ErrorText, Icon, colors, styles } from "../../ui";
import { PreviewStatusBar } from "../../figma-screens";
import { useStore } from "../../store";
import { gameById, games } from "../../data";

const homePhotos: Record<string, ImageSourcePropType> = {
  May: require("../../../assets/figma/8177c.png"), Jessica: require("../../../assets/figma/548c0.png"),
  Lemon: require("../../../assets/figma/0013e.png"), Alex: require("../../../assets/figma/47017.png"),
  Hailey: require("../../../assets/figma/99fd1.png"), Eric: require("../../../assets/figma/153be.png"),
  Phill: require("../../../assets/figma/2be18.png"), Luke: require("../../../assets/figma/f17e2.png"),
};
const divider = require("../../../assets/figma/99ebb.svg");
const next = require("../../../assets/figma/ba678.svg");
const dot = require("../../../assets/figma/bc2ed.svg");
const online = require("../../../assets/figma/37861.svg");
function SectionHeading({ title, count, onPress }: { title: string; count?: number; onPress: () => void }) {
  return <View style={[styles.spread, { paddingHorizontal: 4 }]}>
    <View style={[styles.row, { gap: 4 }]}><Text style={home.heading}>{title}</Text>
      {count !== undefined && <Text style={[home.heading, { color: colors.muted }]}>{count}</Text>}</View>
    <Pressable accessibilityRole="button" accessibilityLabel={`View all ${title}`} onPress={onPress} style={[styles.row, { gap: 0 }]}>
      <Text style={home.link}>View all</Text><SvgUri uri={Asset.fromModule(next).uri} width={12} height={12} />
    </Pressable>
  </View>;
}
export default function Home() {
  const { data, demo, loading, error, refresh, request } = useStore();
  const [pending, setPending] = useState("");
  const [addError, setAddError] = useState("");
  const friends = data.users.filter(p => p.friendStatus === "accepted" && p.online);
  const cards = demo && friends[2] ? [...friends, friends[2], friends[2]] : friends;
  const recommended = data.users.filter(p => p.friendStatus !== "accepted")
    .sort((a, b) => (b.match ?? 0) - (a.match ?? 0)).slice(0, 5);
  const mine = data.parties.filter(p => p.members.some(m => m.id === data.user.id));
  async function add(id: string) {
    if (demo) { router.push("/auth"); return; }
    setPending(id); setAddError("");
    try { await request("/friends", "POST", { userId: id }); await refresh(); }
    catch (e) { setAddError((e as Error).message); }
    finally { setPending(""); }
  }
  return <SafeAreaView edges={["top"]} style={styles.page}>
    <PreviewStatusBar />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={home.content}>
      <View style={home.header}>
        <View style={[styles.spread, { width: "100%" }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="My profile" onPress={() => router.push("/profile")} style={[styles.row, { flex: 1, gap: 16 }]}>
            <Avatar name={data.user.name} size={56} />
            <View style={{ flex: 1 }}><Text style={styles.title}>Hello, {data.user.name}</Text>
              <Text style={[styles.muted, { color: "#b7b7b7", lineHeight: 17 }]}>Who are you playing with today?</Text></View>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Friend requests" onPress={() => router.push("/friends")} style={home.bell}>
            <Icon name="bell" size={24.44} height={26.07} />
          </Pressable>
        </View>
        <View style={home.divider}><SvgUri uri={Asset.fromModule(divider).uri} width={1} height={370} style={{ position: "absolute", left: 184.5, top: -185, transform: [{ rotate: "90deg" }] }} /></View>
      </View>
      <View style={home.main}>
        {loading && <ActivityIndicator color={colors.brand} />}
        {Boolean(error) && <Pressable onPress={() => void refresh()}><ErrorText message={error + " Tap to retry."} /></Pressable>}
        <View style={home.section}>
          <SectionHeading title="Join friend’s game" count={demo ? 4 : friends.length} onPress={() => router.push("/friends")} />
          {!friends.length ? <Empty title="Your squad starts here" detail="Find players and add friends to see who’s online." /> :
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {cards.map((friend, index) => {
                const party = data.parties.find(p => p.members.some(m => m.id === friend.id));
                return <Pressable key={`${friend.id}-${index}`} accessibilityRole="button" accessibilityLabel={`Join ${friend.name}’s game`}
                  onPress={() => router.push(party ? `/party/${party.id}` : `/friends/${friend.id}`)} style={home.friendCard}>
                  <Avatar name={friend.name} source={homePhotos[friend.name]} size={32} />
                  <View style={{ alignItems: "center", gap: 4 }}>
                    <View style={[styles.row, { gap: 4 }]}><Text style={home.heading}>{friend.name}</Text><SvgUri uri={Asset.fromModule(dot).uri} width={6} height={6} /></View>
                    <Text numberOfLines={1} style={home.gameCaption}>{friend.game === "lol" ? "League of Leg.." : gameById(friend.game).name}</Text>
                    <Text style={home.friendStatus}>{demo ? friend.id === "may" ? "In match • 18 min" : friend.id === "jessica" ? "Lobby • 2/5" : "In match • 31 min" : party ? `In party • ${party.members.length}/${party.capacity}` : "Online"}</Text>
                  </View>
                </Pressable>;
              })}
            </ScrollView>}
        </View>
        <View style={home.section}>
          <SectionHeading title="Pick a game to play" onPress={() => router.push("/games")} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
            {(demo ? [...games.slice(0, 3), games[2]] : games).map((game, index) => {
              const count = friends.filter(p => p.game === game.id).length;
              return <Pressable accessibilityRole="button" accessibilityLabel={`Play ${game.name}`} key={`${game.id}-${index}`} style={{ width: 112, gap: 4 }}
                onPress={() => router.push({ pathname: "/create-party", params: { game: game.id } })}>
                <View style={home.gameImage}><Image source={game.image} style={{ width: 112, height: 112 }} resizeMode="cover" />
                  <LinearGradient colors={["rgba(102,102,102,0)", "rgba(0,0,0,0.5)"]} style={StyleSheet.absoluteFill} /></View>
                <Text numberOfLines={1} style={home.gameName}>{game.id === "overwatch" ? "OVERWATCH" : game.name}</Text>
                <Text style={home.playing}>{count} {count === 1 ? "friend" : "friends"} playing</Text>
              </Pressable>;
            })}
          </ScrollView>
        </View>
        <View style={home.section}>
          <SectionHeading title="Recommended teammates" onPress={() => router.push("/friends")} />
          <ErrorText message={addError} />
          <View style={{ gap: 12 }}>
            {recommended.map(p => <View key={p.id} style={home.recommendation}>
              <Pressable accessibilityRole="button" accessibilityLabel={`${p.name} profile`} onPress={() => router.push(`/friends/${p.id}`)} style={[styles.row, { flex: 1, gap: 12 }]}>
                <View style={{ width: 32, height: 32 }}><Avatar name={p.name} source={homePhotos[p.name]} size={32} />
                  {p.online && <View style={home.online}><SvgUri uri={Asset.fromModule(online).uri} width={9.333} height={9.333} /></View>}</View>
                <View style={{ flex: 1, gap: 4 }}><View style={[styles.row, { gap: 12 }]}>
                  <Text style={home.heading}>{p.name}</Text>{p.match !== undefined && <Text style={home.match}>{p.match}% match</Text>}</View>
                  <Text numberOfLines={1} style={home.reason}>{p.reason || gameById(p.game).name}</Text></View>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`Add ${p.name}`} onPress={() => void add(p.id)}
                disabled={!!pending || (p.friendStatus === "pending" && !p.incoming)} style={home.add}>
                <Text style={home.addText}>{pending === p.id ? "…" : p.friendStatus === "pending" ? p.incoming ? "Accept" : "Requested" : "add"}</Text>
              </Pressable>
            </View>)}
          </View>
        </View>
        {!demo && mine.length > 0 && <View style={home.section}>
          <SectionHeading title="Your parties" onPress={() => router.push("/games")} />
          {mine.map(p => <Pressable key={p.id} style={styles.card} onPress={() => router.push(`/party/${p.id}`)}><Text style={styles.label}>{p.name}</Text><Text style={styles.muted}>{gameById(p.game).name} · {p.members.length}/{p.capacity}</Text></Pressable>)}
        </View>}
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const home = StyleSheet.create({
  content: { paddingTop: 24, paddingBottom: 32, gap: 20 },
  header: { paddingHorizontal: 20, gap: 16, alignItems: "center" },
  bell: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  divider: { height: 0, width: 370, alignSelf: "center" },
  main: { paddingHorizontal: 20, gap: 32 },
  section: { gap: 24 },
  heading: { fontFamily: "Pretendard-SemiBold", color: "white", fontSize: 16, lineHeight: 19 },
  link: { fontFamily: "Pretendard-SemiBold", color: colors.brand, fontSize: 12, lineHeight: 14 },
  friendCard: { width: 104, height: 112, padding: 12, borderRadius: 8, backgroundColor: colors.card, gap: 8, justifyContent: "center", alignItems: "center" },
  gameCaption: { fontFamily: "Pretendard-Medium", color: "white", fontSize: 8, lineHeight: 10 },
  friendStatus: { fontFamily: "Pretendard-Light", color: colors.muted, fontSize: 8, lineHeight: 10 },
  gameImage: { width: 112, height: 112, borderRadius: 8, overflow: "hidden" },
  gameName: { fontFamily: "Pretendard-SemiBold", color: "white", fontSize: 12, lineHeight: 14 },
  playing: { fontFamily: "Pretendard-Medium", color: colors.muted, fontSize: 8, lineHeight: 10 },
  recommendation: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, padding: 12, minHeight: 61, borderRadius: 12, backgroundColor: colors.card },
  online: { position: "absolute", left: 23.333, top: 23.333 },
  match: { fontFamily: "Pretendard-Bold", color: colors.brand, fontSize: 12, lineHeight: 14 },
  reason: { fontFamily: "Pretendard-Medium", color: "#959595", fontSize: 12, lineHeight: 14 },
  add: { backgroundColor: colors.brand, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  addText: { fontFamily: "Pretendard-Bold", color: "white", fontSize: 12, lineHeight: 14 },
});
