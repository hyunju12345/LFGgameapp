import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Avatar, Button, ErrorText, Field, Screen, styles } from "../ui";
import { useStore } from "../store";
export default function Auth() {
  const [register, setRegister] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { request, signIn } = useStore();
  async function submit() {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const result = await request<{ token: string }>(
        register ? "/auth/register" : "/auth/login",
        "POST",
        { name, email, password },
      );
      await signIn(result.token);
      router.replace("/");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen title={register ? "Join your next squad" : "Welcome back"}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ gap: 24 }}
      >
        <View style={{ alignItems: "center", gap: 16, paddingVertical: 24 }}>
          <Avatar name="Raina" size={80} />
          <Text style={[styles.title, { fontSize: 32 }]}>PartyUp</Text>
          <Text style={styles.muted}>Good games start with good people.</Text>
        </View>
        {register && (
          <Field
            accessibilityLabel="Display name"
            placeholder="Your display name"
            value={name}
            onChangeText={setName}
            maxLength={30}
            autoComplete="nickname"
          />
        )}
        <Field
          accessibilityLabel="Email"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Field
          accessibilityLabel="Password"
          placeholder="Password (at least 8 characters)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={register ? "new-password" : "current-password"}
          onSubmitEditing={() => void submit()}
        />
        <ErrorText message={error} />
        <Button
          title={register ? "Create account" : "Sign in"}
          onPress={() => void submit()}
          busy={busy}
        />
        <Pressable
          onPress={() => {
            setRegister(!register);
            setError("");
          }}
        >
          <Text style={[styles.link, { textAlign: "center" }]}>
            {register
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </Text>
        </Pressable>
        <Text style={[styles.muted, { textAlign: "center" }]}>
          Your account connects to your PartyUp server. Game accounts are not
          linked automatically.
        </Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}
