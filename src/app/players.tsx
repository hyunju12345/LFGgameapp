import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../store";
import {
  Avatar,
  Empty,
  ErrorText,
  GameBanner,
  Screen,
  colors,
  styles,
} from "../ui";
export default function Players() {
  const { game = "lol" } = useLocalSearchParams<{ game: string }>();
  const { data, demo, request, refresh } = useStore();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const players = [...data.users]
    .filter((p) => p.game === game)
    .sort((a, b) => (b.match || 0) - (a.match || 0));
  async function add(id: string) {
    if (demo) {
      router.push("/auth");
      return;
    }
    setBusy(id);
    try {
      await request("/friends", "POST", { userId: id });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <Screen title="Recommended teammates">
      <GameBanner game={game} height={100} />
      <ErrorText message={error} />
      {players.length === 0 && (
        <Empty
          title="No teammates yet"
          detail="Players who choose this game will appear here."
        />
      )}
      {players.map((p) => (
        <View key={p.id} style={[styles.card, styles.row, { minHeight: 80 }]}>
          <Avatar name={p.name} online={p.online} />
          <View style={{ flex: 1, gap: 4 }}>
            <View style={[styles.row, { gap: 8, flexWrap: "wrap" }]}>
              <Text style={styles.label}>{p.name}</Text>
              <Text style={styles.link}>{p.match ?? 0}% match</Text>
            </View>
            <Text style={styles.muted}>{p.reason || "Same game"}</Text>
          </View>
          <Pressable
            disabled={
              !!busy ||
              p.friendStatus === "accepted" ||
              (p.friendStatus === "pending" && !p.incoming)
            }
            accessibilityRole="button"
            onPress={() => void add(p.id)}
            style={{
              backgroundColor: colors.brand,
              padding: 8,
              borderRadius: 12,
            }}
          >
            <Text style={[styles.text, { fontSize: 12 }]}>
              {busy === p.id
                ? "…"
                : p.friendStatus === "accepted"
                  ? "Friends"
                  : p.friendStatus === "pending"
                    ? p.incoming
                      ? "Accept"
                      : "Sent"
                    : "＋ add"}
            </Text>
          </Pressable>
        </View>
      ))}
      <Text style={styles.muted}>
        {demo
          ? "Preview scores from the design."
          : "Compatibility uses shared game (50%), playstyle (30%), and rank (20%). Update your profile to improve recommendations."}
      </Text>
    </Screen>
  );
}
