import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Asset } from "expo-asset";
import { SvgUri } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Avatar, colors, styles } from "./ui";
import { DesignIcon } from "./figma-screens";
import { Party, gameById } from "./data";
const faces = [require("../assets/figma/a6ea2.png"), require("../assets/figma/08dd4.png"), require("../assets/figma/dfbf2.png"), require("../assets/figma/05e26.png")];
export function ActivePartyCard({ party, demo = false, compact = false }: { party?: Party; demo?: boolean; compact?: boolean }) {
  if (!party) return null;
  const game = gameById(party?.game || "lol");
  const isActive = party?.active ?? !compact;
  const name = party?.name || "Team Korea";
  const exampleFaces = !demo ? null : !party || party.id === "team-korea" ? faces : party.id === "team-parsons" ? [faces[1], faces[0], require("../assets/figma/97223.png")] : party.id.startsWith("toad-lover") ? [faces[3], faces[1], faces[0], require("../assets/figma/97223.png")] : null;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${name}`}
    onPress={() => router.push({ pathname: "/party/[id]", params: { id: party?.id || "team-korea" } })} style={[s.card, compact && { minHeight: 120 }]}>
    <Image source={party?.game === "mario-kart" ? require("../assets/figma/b14d6.png") : game.image} style={s.background} resizeMode="cover" />
    <LinearGradient colors={[isActive ? colors.brand : "black", "rgba(0,0,0,.3)"]} start={{ x: 0, y: .5 }} end={{ x: 1, y: .5 }} style={StyleSheet.absoluteFill} />
    <View style={{ flex: 1, gap: 16 }}>
      <View style={{ gap: 4 }}>
        {compact ? <View style={[styles.row, { gap: 4 }]}>{isActive && <SvgUri uri={Asset.fromModule(require("../assets/figma/ddc35.svg")).uri} width={6} height={6} />}<Text style={s.name}>{name}</Text></View> : <><View style={[styles.row, { gap: 4 }]}><SvgUri uri={Asset.fromModule(require("../assets/figma/ddc35.svg")).uri} width={6} height={6} /><Text style={s.live}>Live</Text></View><Text style={s.name}>{name}</Text></>}
        <View style={{ gap: 4, opacity: .8 }}><Text style={s.subtitle}>{party && party.owner !== "preview" && demo ? `${party.owner === "harry" ? "Harry" : "Toad"}’s party` : "Your party"} • {game.name}</Text><Text style={s.caption}>{party?.status || (demo ? "In match • 18 min" : `${party?.members.length}/${party?.capacity} players`)}</Text></View>
      </View>
      <View style={[styles.row, { gap: 6 }]}>
        <View style={[styles.row, { gap: 0 }]}>{exampleFaces ? exampleFaces.map((source, i) => <Image key={i} source={source} style={[s.avatar, i < exampleFaces.length - 1 && { marginRight: -4 }]} />) : party?.members.slice(0, 4).map((member, i) => <View key={member.id} style={i < 3 ? { marginRight: -4 } : undefined}><Avatar name={member.name} source={demo && member.id === "harry" || demo && member.id === "toad" ? require("../assets/figma/97223.png") : undefined} size={24} /></View>)}</View>
        {((demo && (!party || party.id === "team-korea")) || (party?.members.length || 0) > 4) && <View style={s.more}><Text style={s.moreText}>+{demo && (!party || party.id === "team-korea") ? 1 : party!.members.length - 4}</Text></View>}
      </View>
    </View>
    <DesignIcon name="editNext" size={24} />
  </Pressable>;
}
const s = StyleSheet.create({
  card: { borderWidth: 1, borderColor: "black", borderRadius: 8, padding: 12, overflow: "hidden", flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 138 },
  background: { position: "absolute", left: 0, top: 0, width: "100%", height: "100%" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#00ff22" },
  live: { fontFamily: "Pretendard-Bold", fontSize: 12, lineHeight: 14, color: "white" },
  name: { fontFamily: "Pretendard-Black", fontSize: 16, lineHeight: 19, color: "white" },
  subtitle: { fontFamily: "Pretendard-Medium", fontSize: 12, lineHeight: 16.8, color: "white" },
  caption: { fontFamily: "Pretendard-Light", fontSize: 8, lineHeight: 10, color: "white" },
  avatar: { width: 24, height: 24, borderRadius: 12 },
  more: { backgroundColor: "white", borderRadius: 16, paddingHorizontal: 8, paddingVertical: 4 },
  moreText: { color: colors.brand, fontFamily: "Pretendard-Bold", fontSize: 10, lineHeight: 12 },
});
