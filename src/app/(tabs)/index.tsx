import React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Avatar,
  Empty,
  ErrorText,
  Heading,
  Icon,
  colors,
  styles,
} from "../../ui";
import { useStore } from "../../store";
import { gameById, games } from "../../data";
export default function Home() {
  const { width } = useWindowDimensions();
  const tile = (width - 40) * 0.31;
  const { data, demo, loading, error, refresh } = useStore();
  const friends = data.users.filter(
    (p) => p.friendStatus === "accepted" && p.online,
  );
  const mine = data.parties.filter((p) =>
    p.members.some((m) => m.id === data.user.id),
  );
  return (
    <SafeAreaView edges={["top"]} style={styles.page}>
      <ScrollView
        contentContainerStyle={[styles.content, { gap: 20, paddingTop: 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.spread,
            {
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.card,
            },
          ]}
        >
          <Pressable
            style={[styles.row, { flex: 1, gap: 16 }]}
            onPress={() => router.push("/profile")}
          >
            <Avatar name={data.user.name} size={56} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.title}>Hello, {data.user.name}</Text>
              <Text style={styles.muted}>Who are you playing with today?</Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityLabel="Friend requests"
            onPress={() => router.push("/friends")}
          >
            <Icon name="bell" size={32} />
          </Pressable>
        </View>
        {demo && (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/auth")}
            style={{
              padding: 10,
              backgroundColor: "#2a2234",
              borderRadius: 10,
            }}
          >
            <Text style={styles.link}>
              Design preview · Sign in to play with real friends ›
            </Text>
          </Pressable>
        )}
        {loading && <ActivityIndicator color={colors.brand} />}
        {Boolean(error) && (
          <Pressable onPress={() => void refresh()}>
            <ErrorText message={error + " Tap to retry."} />
          </Pressable>
        )}
        <View style={styles.section}>
          <Heading
            title={`Online friends ${friends.length}`}
            action="View all"
            onPress={() => router.push("/friends")}
          />
          {friends.length === 0 ? (
            <Empty
              title="Your squad starts here"
              detail="Find players and add friends to see who’s online."
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {friends.map((friend) => {
                const party = data.parties.find((p) =>
                  p.members.some((m) => m.id === friend.id),
                );
                return (
                  <Pressable
                    key={friend.id}
                    onPress={() =>
                      router.push(party ? `/party/${party.id}` : "/friends")
                    }
                    style={[
                      styles.card,
                      {
                        width: 129,
                        height: 139,
                        alignItems: "center",
                        gap: 16,
                        padding: 12,
                      },
                    ]}
                  >
                    <Avatar name={friend.name} />
                    <View style={{ alignItems: "center", gap: 4 }}>
                      <View style={[styles.row, { gap: 4 }]}>
                        <Text style={styles.label}>{friend.name}</Text>
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: colors.green,
                          }}
                        />
                      </View>
                      <Text
                        numberOfLines={1}
                        style={[styles.text, { fontSize: 12 }]}
                      >
                        {gameById(friend.game).name}
                      </Text>
                      <Text
                        style={[styles.muted, { fontSize: 8, lineHeight: 10 }]}
                      >
                        {demo
                          ? friend.id === "may"
                            ? "In match • 18 min"
                            : friend.id === "jessica"
                              ? "Lobby • 2/5"
                              : "In match • 31 min"
                          : party
                            ? `In party • ${party.members.length}/${party.capacity}`
                            : "Online"}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
        <View style={styles.section}>
          <Heading
            title="Pick a game to play"
            action="View all"
            onPress={() => router.push("/games")}
          />
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              rowGap: 16,
            }}
          >
            {games.map((game) => (
              <Pressable
                accessibilityRole="button"
                key={game.id}
                style={{ width: "31%", gap: 4 }}
                onPress={() =>
                  router.push({ pathname: "/game", params: { id: game.id } })
                }
              >
                <Image
                  source={game.image}
                  style={{ width: tile, height: tile, borderRadius: 8 }}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.text,
                    { fontSize: 12, fontFamily: "Pretendard-SemiBold" },
                  ]}
                >
                  {game.name}
                </Text>
                <Text style={[styles.muted, { fontSize: 8, lineHeight: 11 }]}>
                  {
                    data.users.filter(
                      (u) =>
                        u.friendStatus === "accepted" && u.game === game.id,
                    ).length
                  }{" "}
                  friends playing
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        {!demo && (
          <View style={styles.section}>
            <Heading
              title="Your parties"
              action="Create"
              onPress={() => router.push("/create-party")}
            />
            {mine.length ? (
              mine.map((p) => (
                <Pressable
                  key={p.id}
                  style={styles.card}
                  onPress={() => router.push(`/party/${p.id}`)}
                >
                  <Text style={styles.label}>{p.name}</Text>
                  <Text style={styles.muted}>
                    {gameById(p.game).name} · {p.members.length}/{p.capacity}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Empty
                title="Ready for a game?"
                detail="Create a party or join one from a game page."
              />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
