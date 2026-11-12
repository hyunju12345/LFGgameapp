import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PreviewStatusBar } from "../figma-screens";
import { useNotifications } from "../notifications";
import { useStore } from "../store";
import { Avatar, Empty, ErrorText, colors, styles } from "../ui";

export default function Notifications() {
  const { notifications, completePreview } = useNotifications();
  const { demo, request, refresh } = useStore();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  async function act(item: (typeof notifications)[number]) {
    if (busy) return;
    setBusy(item.id); setError(""); setFeedback("");
    try {
      if (demo) {
        completePreview(item.id);
        if (item.kind === "party") router.push("/preview-conversation?id=party");
        else setFeedback(`${item.name}’s friend request accepted. This is a preview.`);
      } else if (item.kind === "friend") {
        await request("/friends", "POST", { userId: item.targetId });
        await refresh();
        setFeedback(`You and ${item.name} are now friends.`);
      } else {
        await request(`/parties/${item.targetId}/join`, "POST");
        await refresh();
        router.push(`/chat?id=${item.targetId}`);
      }
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(""); }
  }
  return <SafeAreaView edges={["top", "bottom"]} style={styles.page}>
    <PreviewStatusBar />
    <View style={s.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={12} onPress={() => router.canGoBack() ? router.back() : router.replace("/")}><Text style={s.back}>‹</Text></Pressable>
      <Text style={styles.title}>Notifications</Text>
    </View>
    <ScrollView contentContainerStyle={s.content}>
      {demo && <Text style={s.muted}>Preview notifications</Text>}
      <ErrorText message={error} />
      {!!feedback && <Text accessibilityLiveRegion="polite" style={s.feedback}>{feedback}</Text>}
      {!notifications.length && <Empty title="You’re all caught up" detail="Friend requests and party invitations will appear here." />}
      {notifications.map(item => <View key={item.id} style={s.card}>
        <View style={s.summary}><Avatar name={item.name} size={48} /><View style={{ flex: 1, gap: 8 }}>
          <Text style={s.kind}>{item.kind === "friend" ? "Friend request" : "Party invitation"}</Text>
          <Text style={s.title}>{item.title}</Text><Text style={s.muted}>{item.detail}</Text>
        </View></View>
        <Pressable accessibilityRole="button" accessibilityLabel={item.kind === "friend" ? `Accept ${item.name}’s friend request` : `Join ${item.detail}`} disabled={!!busy} onPress={() => void act(item)} style={[s.action, !!busy && { opacity: .6 }]}>
          {busy === item.id ? <ActivityIndicator color="white" /> : <Text style={s.actionText}>{item.kind === "friend" ? "Accept" : "Join party"}</Text>}
        </Pressable>
      </View>)}
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 16, padding: 24, borderBottomWidth: 1, borderBottomColor: colors.card },
  back: { fontSize: 40, lineHeight: 40, color: "white" },
  content: { padding: 24, gap: 16 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 16 },
  summary: { flexDirection: "row", alignItems: "center", gap: 16 },
  kind: { color: colors.brand, fontFamily: "Pretendard-SemiBold", fontSize: 12 },
  title: { color: "white", fontFamily: "Pretendard-Bold", fontSize: 16, lineHeight: 24 },
  muted: { color: colors.muted, fontFamily: "Pretendard-Regular", fontSize: 12, lineHeight: 16 },
  feedback: { color: colors.brand, fontFamily: "Pretendard-Medium", fontSize: 14, lineHeight: 24 },
  action: { backgroundColor: colors.brand, borderRadius: 16, padding: 8, minHeight: 40, alignItems: "center", justifyContent: "center", alignSelf: "flex-end", minWidth: 104 },
  actionText: { color: "white", fontFamily: "Pretendard-Bold", fontSize: 14 },
});
