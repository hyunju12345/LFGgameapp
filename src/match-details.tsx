import React from "react";
import { Text, View } from "react-native";
import { Asset } from "expo-asset";
import { SvgUri } from "react-native-svg";
import { Player } from "./data";
const markers = {
  match: { color: "#b9ffc6", image: require("../assets/figma/b2812.svg"), label: "Matches" },
  partial: { color: "#fed036", image: require("../assets/figma/27b5b.svg"), label: "Partial match" },
  different: { color: "#ff7575", image: require("../assets/figma/964cc.svg"), label: "Does not match" },
};
export function MatchDetails({ player, demo }: { player: Player; demo: boolean }) {
  const items: NonNullable<Player["compatibility"]> = demo ? [
    { label: "3 games in common", status: "match" },
    { label: "Same rank in Valorant", status: "match" },
    { label: "Both play for fun", status: "match" },
    { label: "usually play at night", status: "partial" },
    { label: "Different voice chat preferences", status: "different" },
  ] : player.compatibility || [{ label: player.reason || "Compatibility details not available yet", status: "partial" }];
  return <View style={{ gap: 12 }}>{items.map(item => <View key={item.label} accessibilityLabel={`${item.label}: ${markers[item.status].label}`} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
    <Text style={{ flex: 1, color: markers[item.status].color, fontFamily: "Pretendard-Regular", fontSize: 12, lineHeight: 14 }}>{item.label}</Text>
    <SvgUri uri={Asset.fromModule(markers[item.status].image).uri} width={item.status === "partial" ? 9.52628 : 8} height={item.status === "partial" ? 8.25 : 8} />
  </View>)}</View>;
}
