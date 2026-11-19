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
export function MatchDetails({ player }: { player: Player }) {
  const items = player.compatibility || [{ label: player.reason || "Compatibility details not available yet", status: "partial" as const }];
  return <View style={{ gap: 12 }}>{items.map(item => <View key={item.label} accessibilityLabel={`${item.label}: ${markers[item.status].label}`} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
    <Text style={{ flex: 1, color: markers[item.status].color, fontFamily: "Pretendard-Regular", fontSize: 12, lineHeight: 14 }}>{item.label}</Text>
    <SvgUri uri={Asset.fromModule(markers[item.status].image).uri} width={item.status === "partial" ? 9.52628 : 8} height={item.status === "partial" ? 8.25 : 8} />
  </View>)}</View>;
}
