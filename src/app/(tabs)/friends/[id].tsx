import React, { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { RecommendedProfile } from "../../../recommended-profile";
import { gameById } from "../../../data";
import { DesignHeader, DesignIcon, PreviewStatusBar, GameRow, Portrait, design, friendPhotos, portraits } from "../../../figma-screens";
import { useStore } from "../../../store";
import { Empty, ErrorText, Tags, colors, styles } from "../../../ui";

export default function FriendProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, demo } = useStore();
  const [info, setInfo] = useState("");
  const player = data.users.find(p => p.id === id) ?? (demo && id === "lia"
    ? { id: "lia", name: "Lia", online: false, game: "lol", style: "Chill", rank: "Casual" }
    : undefined);
  const party = data.parties.find(p => p.members.some(m => m.id === id));
  const shared = party?.members.some(m => m.id === data.user.id);
  const game = gameById(party?.game ?? player?.game);
  const isMay = demo && player?.name === "May";

  if (player && player.friendStatus !== "accepted" && id !== "lia") return <RecommendedProfile player={player} />;
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.page}>
      <PreviewStatusBar />
      <DesignHeader onBack={() => router.replace("/friends")} title={player?.name ?? "Friend"} action={player && (
        <Pressable accessibilityRole="button" accessibilityLabel="Profile options" onPress={() => setInfo(info ? "" : "Player profile")} hitSlop={8}>
          <DesignIcon name="more" />
        </Pressable>
      )} />
      <ScrollView contentContainerStyle={[design.content, { paddingTop: 21.5 }]}>
        {!player ? <Empty title="Player unavailable" detail="This player is no longer in your list." /> : (
          <>
            <View style={[design.identity, { gap: 13.5, marginBottom: 8 }]}>
              <Portrait name={player.name} source={isMay ? portraits.May : friendPhotos[player.name]} online={player.online && (!demo || player.name !== "Lemon")} />
              <Text style={design.identityName}>{player.name}</Text>
              <Pressable accessibilityRole="button" style={[design.pill, { backgroundColor: "transparent", borderColor: "white", borderWidth: 1 }]} onPress={() => {
                if (demo) router.push({ pathname: "/preview-conversation", params: { id: player.id } });
                else if (shared && party) router.push({ pathname: "/chat", params: { id: party.id } });
                else setInfo("Join a shared party to chat.");
              }}><Text style={design.pillText}>Message</Text></Pressable>
            </View>
            <ErrorText message={info} />
            {party && (
              <View style={styles.section}>
                <Text style={design.title}>Current party</Text>
                <View style={styles.card}>
                  <View style={[styles.row, { gap: 16, alignItems: "flex-start" }]}>
                    <Image source={game.image} style={{ width: 80, height: 80, borderRadius: 8 }} />
                    <View style={{ flex: 1, gap: 8 }}>
                      <Text style={design.rowText}>{game.name}</Text>
                      <Text style={styles.muted}>{isMay ? "In Lobby • Summoner’s Rift" : party.mode}</Text>
                      <Text style={[design.badge, { alignSelf: "flex-start", color: colors.brand, backgroundColor: "#624b7a" }]}>{party.is_open ? "Open party" : "Private party"}</Text>
                    </View>
                  </View>
                  <Pressable accessibilityRole="button" onPress={() => router.push(`/party/${party.id}`)} style={{ backgroundColor: colors.brand, borderRadius: 15, alignItems: "center", paddingVertical: 6, marginTop: 10 }}>
                    <Text style={[styles.link, { color: "white" }]}>{shared ? "View party" : "Join"}</Text>
                  </Pressable>
                </View>
              </View>
            )}
            <View style={styles.section}>
              <Text style={design.title}>Play preferences</Text>
              <Tags tags={isMay ? ["Chill", "Every night", "For fun", "Voice chat"] : [player.style]} />
            </View>
            <View style={styles.section}>
              <Text style={design.title}>Games</Text>
              <GameRow image={gameById(player.game).image} name={gameById(player.game).name} tags={isMay ? ["Iron 3", "ADC"] : [player.rank]} />
              {isMay && <GameRow image={gameById("valorant").image} name="VALORANT" tags={["Unranked"]} />}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
