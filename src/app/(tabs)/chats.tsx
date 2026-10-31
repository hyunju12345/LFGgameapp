import React from "react";
import { Pressable, Text } from "react-native";
import { router } from "expo-router";
import { useStore } from "../../store";
import { gameById } from "../../data";
import { Button, Empty, Screen, styles } from "../../ui";
export default function Chats() {
  const { data, demo } = useStore();
  const parties = data.parties.filter((p) =>
    p.members.some((m) => m.id === data.user.id),
  );
  return (
    <Screen title="Party chats" back={false}>
      {parties.length === 0 && (
        <Empty
          title="A place for your squad"
          detail="Join or create a party to start a conversation."
        />
      )}
      {demo ? (
        <Button title="Sign in to chat" onPress={() => router.push("/auth")} />
      ) : (
        parties.map((p) => (
          <Pressable
            key={p.id}
            style={styles.card}
            onPress={() =>
              router.push({ pathname: "/chat", params: { id: p.id } })
            }
          >
            <Text style={styles.label}>{p.name}</Text>
            <Text style={styles.muted}>
              {gameById(p.game).name} · {p.members.length} members
            </Text>
            <Text style={styles.link}>Open conversation ›</Text>
          </Pressable>
        ))
      )}
      <Button
        secondary
        title="Find a party"
        onPress={() => router.push("/games")}
      />
    </Screen>
  );
}
