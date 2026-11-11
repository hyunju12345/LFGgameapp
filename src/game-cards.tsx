import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Asset } from "expo-asset";
import { SvgUri } from "react-native-svg";
import { Game } from "./data";
import { colors } from "./ui";
const circle = require("../assets/figma/b30b5.svg");
export function LibraryGameCard({ game, onPress, selectable, selected, disabled }: { game: Game; onPress: () => void; selectable?: boolean; selected?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole={selectable ? "checkbox" : "button"} accessibilityLabel={game.name}
    accessibilityState={{ checked: selectable ? !!selected : undefined, disabled: !!disabled }} disabled={disabled} onPress={onPress} style={s.card}>
    <Image source={game.image} resizeMode="cover" style={s.image} />
    <LinearGradient colors={["rgba(255,255,255,0.2)", "rgba(0,0,0,0.2)"]} style={StyleSheet.absoluteFill} />
    <Text numberOfLines={2} style={s.name}>{game.name}</Text>
    {selectable && <View style={s.circle}>
      <SvgUri uri={Asset.fromModule(circle).uri} width={24} height={24} />
      {selected && <View style={s.selected} />}
    </View>}
  </Pressable>;
}
const s = StyleSheet.create({
  card: { width: "100%", height: 104, borderRadius: 12, overflow: "hidden", backgroundColor: colors.card, padding: 16, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12 },
  image: { position: "absolute", left: 0, top: 0, width: "100%", height: 104 },
  name: { fontFamily: "Pretendard-Bold", fontSize: 16, lineHeight: 22.4, color: "white", flex: 1 },
  circle: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  selected: { position: "absolute", width: 14, height: 14, borderRadius: 7, backgroundColor: colors.brand },
});
