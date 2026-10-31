import React from "react";
import {
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { games } from "../../data";
import { Screen, styles } from "../../ui";
export default function Games() {
  const { width } = useWindowDimensions();
  const tile = (width - 40) * 0.47;
  return (
    <Screen title="Find your game" back={false}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        {games.map((g) => (
          <Pressable
            key={g.id}
            style={{ width: "47%", gap: 8 }}
            onPress={() =>
              router.push({ pathname: "/game", params: { id: g.id } })
            }
          >
            <Image
              source={g.image}
              style={{ width: tile, height: tile, borderRadius: 12 }}
            />
            <Text style={styles.label}>{g.name}</Text>
            <Text style={styles.link}>Find a party ›</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
