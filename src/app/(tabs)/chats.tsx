import React, { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useStore } from "../../store";
import { gameById } from "../../data";
import { Button, Empty, Field, colors, styles } from "../../ui";
import { DesignIcon, PreviewStatusBar, design } from "../../figma-screens";
import { previewConversations, usePreviewMessages } from "../../conversation-preview";

export default function Chats() {
  const { data, demo } = useStore();
  const sentMessages = usePreviewMessages();
  const [query, setQuery] = useState("");
  const rows = demo ? previewConversations.map(row => ({ ...row, preview: sentMessages[row.id]?.at(-1)?.body || row.preview })) : data.parties
    .filter(p => p.members.some(m => m.id === data.user.id))
    .map(p => ({
      id: p.id, name: p.name, count: p.members.length, preview: gameById(p.game).name,
      image: gameById(p.game).image, time: "", unread: 0,
    }));
  const filtered = rows.filter(row => row.name.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <SafeAreaView edges={["top"]} style={styles.page}>
      <PreviewStatusBar />
      <ScrollView contentContainerStyle={[design.content, { paddingTop: 32 }]} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 16 }}>
          <Text style={[styles.title, { fontSize: 24, lineHeight: 29, marginLeft: 4 }]}>Chat</Text>
          <View style={[styles.row, { backgroundColor: colors.field, borderRadius: 12, paddingHorizontal: 8, gap: 6 }]}>
            <DesignIcon name="search" size={16} />
            <Field accessibilityLabel="Search conversations" placeholder="Search" value={query} onChangeText={setQuery} style={{ minHeight: 27, paddingHorizontal: 0, paddingVertical: 3, flex: 1 }} />
          </View>
        </View>
        <View style={{ gap: 16 }}>
          {filtered.map(row => (
            <Pressable key={row.id} accessibilityRole="button" accessibilityLabel={row.name} onPress={() => router.push({
              pathname: demo ? "/preview-conversation" : "/chat", params: { id: row.id },
            })} style={[styles.card, styles.row, { minHeight: 80, gap: 16 }]}>
              <Image source={row.image} style={design.thumbnail} />
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={[styles.label, { fontFamily: "Pretendard-Bold" }]}>{row.name}{row.count ? <Text style={{ color: colors.brand }}> {row.count}</Text> : null}</Text>
                <Text numberOfLines={1} style={[styles.muted, row.unread > 0 && { color: "white" }]}>{row.preview}</Text>
              </View>
              <View style={{ alignSelf: "stretch", alignItems: "flex-end", gap: 6 }}>
                <Text style={[styles.muted, row.unread > 0 && { color: colors.brand }]}>{row.time}</Text>
                {row.unread > 0 && <Text style={[styles.link, { backgroundColor: "#dec0ff", color: "#8736e9", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }]}>{row.unread}</Text>}
              </View>
            </Pressable>
          ))}
          {!filtered.length && <Empty title={query ? "No matches" : "A place for your squad"} detail={query ? "Try another name." : "Join or create a party to start a conversation."} />}
          {!rows.length && <Button secondary title="Find a party" onPress={() => router.push("/games")} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
