import React, { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../../store";
import { gameById, games } from "../../data";
import {
  Avatar,
  Button,
  ErrorText,
  Field,
  Heading,
  Screen,
  Tags,
  styles,
} from "../../ui";
export default function Profile() {
  const { data } = useStore();
  return <ProfileForm key={data.user.id} />;
}
function ProfileForm() {
  const { data, demo, request, refresh, signOut } = useStore();
  const [name, setName] = useState(data.user.name);
  const [game, setGame] = useState(data.user.game);
  const [style, setStyle] = useState(data.user.style);
  const [rank, setRank] = useState(data.user.rank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function save() {
    if (demo) {
      router.push("/auth");
      return;
    }
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await request("/profile", "PATCH", { name, game, style, rank });
      await refresh();
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen title="My profile" back={false}>
      <View style={{ alignItems: "center", gap: 12 }}>
        <Avatar name={data.user.name} size={80} />
        <Text style={styles.title}>{data.user.name}</Text>
        <Text style={styles.muted}>
          {demo ? "Design preview account" : "Your next teammate is out there."}
        </Text>
      </View>
      <Heading title="Display name" />
      <Field
        accessibilityLabel="Display name"
        value={name}
        onChangeText={setName}
        maxLength={30}
      />
      <Heading title="Favorite game" />
      <Tags
        tags={games.map((g) => g.name)}
        selected={[gameById(game).name]}
        onToggle={(n) => setGame(games.find((g) => g.name === n)!.id)}
      />
      <Heading title="Playstyle" />
      <Tags
        tags={["Chill", "Competitive", "For fun"]}
        selected={[style]}
        onToggle={setStyle}
      />
      <Heading title="Rank" />
      <Tags
        tags={["Casual", "Bronze", "Silver", "Gold", "Platinum", "Diamond"]}
        selected={[rank]}
        onToggle={setRank}
      />
      <ErrorText message={error} />
      {saved && <Text style={styles.link}>Profile saved.</Text>}
      <Button title="Save profile" busy={busy} onPress={() => void save()} />
      {demo ? (
        <Button
          title="Create account / Sign in"
          secondary
          onPress={() => router.push("/auth")}
        />
      ) : (
        <Button
          title="Sign out"
          secondary
          onPress={() => void signOut().then(() => router.replace("/"))}
        />
      )}
    </Screen>
  );
}
