import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../../store";
import { gameById } from "../../data";
import {
  Avatar,
  Empty,
  ErrorText,
  Field,
  Heading,
  Screen,
  styles,
} from "../../ui";
export default function Friends() {
  const { data, demo, request, refresh } = useStore();
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const filtered = data.users.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );
  const friends = filtered.filter((p) => p.friendStatus === "accepted");
  const others = filtered.filter((p) => p.friendStatus !== "accepted");
  async function add(id: string) {
    if (demo) {
      router.push("/auth");
      return;
    }
    setPending(id);
    setError("");
    try {
      await request("/friends", "POST", { userId: id });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending("");
    }
  }
  return (
    <Screen title="Friends" back={false}>
      <Field
        accessibilityLabel="Search players"
        placeholder="Search players by name"
        value={search}
        onChangeText={setSearch}
      />
      <ErrorText message={error} />
      <Heading title={`Your friends · ${friends.length}`} />
      {!friends.length && (
        <Empty
          title="Find your people"
          detail="Send a friend request below. Incoming requests can be accepted here."
        />
      )}
      {friends.map((p) => {
        const party = data.parties.find((v) =>
          v.members.some((m) => m.id === p.id),
        );
        return (
          <Pressable
            key={p.id}
            style={[styles.card, styles.row]}
            disabled={!party}
            onPress={() => party && router.push(`/party/${party.id}`)}
          >
            <Avatar name={p.name} online={p.online} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.label}>{p.name}</Text>
              <Text style={styles.muted}>
                {gameById(p.game).name} · {p.online ? "Online" : "Offline"}
              </Text>
            </View>
            {party && <Text style={styles.link}>View party ›</Text>}
          </Pressable>
        );
      })}
      <Heading title="Discover players" />
      {!others.length && (
        <Empty
          title="No other players yet"
          detail="Ask a friend to create an account on the same server."
        />
      )}
      {others.map((p) => (
        <View key={p.id} style={[styles.card, styles.row]}>
          <Avatar name={p.name} online={p.online} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.label}>{p.name}</Text>
            <Text style={styles.muted}>{gameById(p.game).name}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={
              !!pending || (p.friendStatus === "pending" && !p.incoming)
            }
            onPress={() => void add(p.id)}
          >
            <Text style={styles.link}>
              {pending === p.id
                ? "Saving…"
                : p.friendStatus === "pending"
                  ? p.incoming
                    ? "Accept"
                    : "Requested"
                  : "＋ Add"}
            </Text>
          </Pressable>
        </View>
      ))}
    </Screen>
  );
}
