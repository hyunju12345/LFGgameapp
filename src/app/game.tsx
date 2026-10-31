import React from "react";
import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { gameById } from "../data";
import { useStore } from "../store";
import {
  Avatar,
  Button,
  Empty,
  GameBanner,
  Heading,
  Screen,
  Tags,
  styles,
} from "../ui";
export default function Game() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = gameById(id);
  const { data } = useStore();
  const parties = data.parties.filter((p) => p.game === game.id);
  return (
    <Screen title={game.name}>
      <GameBanner game={game.id} />
      <Button
        title="Make party"
        onPress={() =>
          router.push({ pathname: "/create-party", params: { game: game.id } })
        }
      />
      <Heading
        title="Find your teammates"
        action="View players"
        onPress={() =>
          router.push({ pathname: "/players", params: { game: game.id } })
        }
      />
      <Heading title="Open parties" />
      {parties.length === 0 ? (
        <Empty
          title="Be the first to gather a squad"
          detail="Create an open party so other players can join you."
        />
      ) : (
        parties.map((p) => (
          <Pressable
            style={styles.card}
            key={p.id}
            onPress={() => router.push(`/party/${p.id}`)}
          >
            <View style={styles.spread}>
              <Text style={styles.label}>{p.name}</Text>
              <Text style={styles.link}>
                {p.members.length}/{p.capacity} ›
              </Text>
            </View>
            <Text style={styles.muted}>{p.mode}</Text>
            <View style={styles.row}>
              {p.members.map((m) => (
                <Avatar key={m.id} name={m.name} size={32} />
              ))}
            </View>
            <Tags tags={p.tags} />
          </Pressable>
        ))
      )}
    </Screen>
  );
}
