import React, { useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../../store";
import { avatars } from "../../data";
import {
  Avatar,
  Button,
  Empty,
  ErrorText,
  GameBanner,
  Heading,
  Screen,
  Tags,
  styles,
} from "../../ui";
export default function PartyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, demo, request, refresh } = useStore();
  const p = data.parties.find((p) => p.id === id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!p)
    return (
      <Screen title="Party">
        <Empty
          title="Party unavailable"
          detail="This party may have closed. Find another from the Games tab."
        />
        <Button title="Find a game" onPress={() => router.replace("/games")} />
      </Screen>
    );
  const joined = p.members.some((m) => m.id === data.user.id);
  async function join() {
    if (demo) {
      router.push("/auth");
      return;
    }
    setBusy(true);
    try {
      await request(`/parties/${id}/join`, "POST");
      await refresh();
      router.push({ pathname: "/chat", params: { id } });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen title={demo ? "Join May’s game" : p.name}>
      <View style={styles.row}>
        <Avatar
          name={p.members[0]?.name || "Raina"}
          source={demo ? require("../../../assets/figma/1c437.png") : undefined}
          size={80}
          online={p.members[0]?.online}
        />
        <View style={{ gap: 8 }}>
          <Text style={styles.title}>{p.members[0]?.name}</Text>
          <Text style={styles.muted}>
            {demo
              ? "In match • 18 min"
              : `${p.members.length}/${p.capacity} players · ${p.is_open ? "Open party" : "Private party"}`}
          </Text>
        </View>
      </View>
      <View style={styles.section}>
        <Heading title="Currently playing" />
        <GameBanner game={p.game} subtitle={p.mode} height={184} />
      </View>
      <View style={styles.section}>
        <Heading title="Party members" />
        <View
          style={[
            styles.card,
            {
              flexDirection: "row",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            },
          ]}
        >
          {p.members.map((m) => (
            <View key={m.id} style={{ alignItems: "center", gap: 8 }}>
              <Avatar
                name={m.name}
                source={
                  demo && m.name === "May"
                    ? avatars.partyMay
                    : demo && m.name === "Alex"
                      ? avatars.partyAlex
                      : undefined
                }
              />
              <Text style={styles.muted}>{m.name}</Text>
            </View>
          ))}
          {p.members.length < p.capacity && (
            <View style={{ alignItems: "center", gap: 8 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: "#999",
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={styles.title}>＋</Text>
              </View>
              <Text style={styles.muted}>Open spot</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.section}>
        <Heading title="Party’s playstyle" />
        <Tags tags={p.tags} />
      </View>
      <ErrorText message={error} />
      {joined ? (
        <Button
          title="Open party chat"
          onPress={() => router.push({ pathname: "/chat", params: { id } })}
        />
      ) : (
        <Button
          title={
            p.members.length >= p.capacity ? "Party full" : "Join current game"
          }
          disabled={p.members.length >= p.capacity}
          busy={busy}
          onPress={() => void join()}
        />
      )}
      <Text style={[styles.muted, { textAlign: "center" }]}>
        PartyUp helps you coordinate. Launch the game separately to play.
      </Text>
    </Screen>
  );
}
