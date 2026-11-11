import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useStore } from "../../../store";
import { FriendCodeSearch } from "../../../friend-code-search";
import { gameById } from "../../../data";
import { Avatar, Empty, ErrorText, colors, styles } from "../../../ui";
import { DesignIcon, PreviewStatusBar, design, friendPhotos } from "../../../figma-screens";

export default function Friends() {
  const { data, demo, request, refresh } = useStore();
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const friends = data.users.filter(p => p.friendStatus === "accepted");
  const others = data.users.filter(p => p.friendStatus !== "accepted" && !(p.friendStatus === "pending" && p.incoming));
  const previewDetails: Record<string, string> = {
    May: "Playing League of Legend", Jessica: "VALORANT • Lobby",
    Lemon: "Last seen 3h ago", Lia: "Last seen 3h ago",
  };
  const rows = demo ? [...friends.map(p => ({ ...p, online: p.name !== "Lemon" })), {
    id: "lia", name: "Lia", online: false, game: "lol", style: "Chill", rank: "Casual",
  }] : friends;

  async function add(id: string) {
    if (demo) { router.push("/auth"); return; }
    setPending(id);
    setError("");
    try {
      await request("/friends", "POST", { userId: id });
      await refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setPending(""); }
  }
  return (
    <SafeAreaView edges={["top"]} style={styles.page}>
      <PreviewStatusBar />
      <View style={[styles.header, { paddingHorizontal: 24, paddingTop: 24.8, paddingBottom: 16 }]}>
        <Text style={styles.title}>Friends</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[design.content, { paddingTop: 32 }]}>
      <FriendCodeSearch />
      <ErrorText message={error} />
      {!rows.length && <Empty title="Find your people" detail="Send a friend request to a recommended teammate." />}
      {rows.map(p => (
        <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={p.name}
          onPress={() => router.push({ pathname: "/friends/[id]", params: { id: p.id } })}
          style={[styles.card, styles.row, { minHeight: 80 }]}>
          <Avatar name={p.name} source={friendPhotos[p.name]} online={p.online} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.label}>{p.name}</Text>
            <Text style={[styles.muted, p.online && { color: colors.brand }]}>
              {demo ? previewDetails[p.name] : `${gameById(p.game).name} · ${p.online ? "Online" : "Offline"}`}
            </Text>
          </View>
          <DesignIcon name="next" size={16} />
        </Pressable>
      ))}
      <View style={{ marginTop: 16 }}><Text style={[styles.title, { paddingLeft: 4 }]}>Recommended teammates</Text></View>
      {!others.length && <Empty title="No other players yet" detail="Ask a friend to create an account on the same server." />}
      {[...others].sort((a, b) => (b.match ?? 0) - (a.match ?? 0)).map(p => (
        <View key={p.id} style={[styles.card, styles.row, { minHeight: 80 }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={p.name}
            onPress={() => router.push({ pathname: "/friends/[id]", params: { id: p.id } })}
            style={[styles.row, { flex: 1 }]}>
            <Avatar name={p.name} online={p.online} />
            <View style={{ flex: 1, gap: 4 }}>
              <View style={[styles.row, { gap: 8, flexWrap: "wrap" }]}>
                <Text style={styles.label}>{p.name}</Text>
                {p.match !== undefined && <Text style={styles.link}>{p.match}% match</Text>}
              </View>
              <Text style={styles.muted}>{p.reason || gameById(p.game).name}</Text>
            </View>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Add ${p.name}`}
            disabled={!!pending || (p.friendStatus === "pending" && !p.incoming)}
            onPress={() => void add(p.id)}
            style={[styles.row, { gap: 2, backgroundColor: colors.brand, padding: 8, borderRadius: 12 }]}>
            {p.friendStatus !== "pending" && pending !== p.id && <DesignIcon name="friendAdd" size={10} />}
            <Text style={[styles.link, { color: "white" }]}>{pending === p.id ? "…" : p.friendStatus === "pending" ? p.incoming ? "Accept" : "Requested" : "add"}</Text>
          </Pressable>
        </View>
      ))}
      </ScrollView>
    </SafeAreaView>
  );
}
