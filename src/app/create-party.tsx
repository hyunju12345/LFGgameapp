import React, { useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Party, gameById, games } from "../data";
import { useStore } from "../store";
import {
  Avatar,
  Button,
  ErrorText,
  Field,
  GameBanner,
  Heading,
  Screen,
  Tags,
  colors,
  styles,
} from "../ui";
export default function CreateParty() {
  const params = useLocalSearchParams<{ game: string }>();
  const [game, setGame] = useState(gameById(params.game).id);
  const [mode, setMode] = useState(gameById(params.game).modes[0]);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(5);
  const [open, setOpen] = useState(true);
  const [tags, setTags] = useState(["Chill", "For fun"]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { data, demo, request, refresh } = useStore();
  async function submit() {
    if (demo) {
      router.push("/auth");
      return;
    }
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const p = await request<Party>("/parties", "POST", {
        name,
        game,
        mode,
        tags,
        capacity,
        is_open: open,
      });
      await refresh();
      router.replace(`/party/${p.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen title="Make party">
      <View style={styles.section}>
        <Heading title="Name" />
        <Field
          accessibilityLabel="Party name"
          value={name}
          onChangeText={setName}
          placeholder="Enter party name"
          maxLength={50}
        />
      </View>
      <View style={styles.section}>
        <Heading title="Game to play" />
        <GameBanner game={game} />
        <Tags
          tags={games.map((g) => g.name)}
          selected={[gameById(game).name]}
          onToggle={(name) => {
            const g = games.find((v) => v.name === name)!;
            setGame(g.id);
            setMode(g.modes[0]);
          }}
        />
      </View>
      <View style={styles.section}>
        <Heading title="Party members" />
        <View style={[styles.card, styles.spread]}>
          <View style={{ alignItems: "center", gap: 8 }}>
            <Avatar name={data.user.name} />
            <Text style={styles.muted}>Me</Text>
          </View>
          <Text style={styles.muted}>{capacity - 1} open spots</Text>
          <View style={styles.row}>
            <Pressable
              accessibilityLabel="Decrease party size"
              onPress={() => setCapacity(Math.max(2, capacity - 1))}
              style={{ padding: 8 }}
            >
              <Text style={styles.title}>−</Text>
            </Pressable>
            <Text style={styles.label}>{capacity}</Text>
            <Pressable
              accessibilityLabel="Increase party size"
              onPress={() => setCapacity(Math.min(10, capacity + 1))}
              style={{ padding: 8 }}
            >
              <Text style={styles.title}>＋</Text>
            </Pressable>
          </View>
        </View>
      </View>
      <View style={styles.section}>
        <Heading title="Game map" />
        <Tags
          tags={gameById(game).modes}
          selected={[mode]}
          onToggle={setMode}
        />
      </View>
      <View style={styles.section}>
        <Heading title="Party’s playstyle" />
        <Tags
          tags={[
            "Chill",
            "For fun",
            "Competitive",
            "Every night",
            "Voice chat",
          ]}
          selected={tags}
          onToggle={(t) =>
            setTags(
              tags.includes(t) ? tags.filter((v) => v !== t) : [...tags, t],
            )
          }
        />
      </View>
      <View style={styles.section}>
        <Heading title="Party visibility" />
        <View style={[styles.card, styles.spread]}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.label}>Open party</Text>
            <Text style={styles.muted}>
              Let other players find your party and join.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Open party"
            value={open}
            onValueChange={setOpen}
            trackColor={{ true: colors.brand, false: colors.field }}
          />
        </View>
        {!open && (
          <Text style={styles.muted}>
            Private parties are only visible to their existing members.
          </Text>
        )}
      </View>
      <ErrorText message={error} />
      <Button title="Make party" onPress={() => void submit()} busy={busy} />
    </Screen>
  );
}
