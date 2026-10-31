import React, { useEffect, useRef, useState } from "react";
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  type ScrollViewInstance,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Message, gameById } from "../data";
import { useStore } from "../store";
import {
  Avatar,
  Button,
  Empty,
  ErrorText,
  Field,
  Screen,
  colors,
  styles,
} from "../ui";
export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, demo, request, refresh } = useStore();
  const party = data.parties.find((p) => p.id === id);
  const joined = party?.members.some((m) => m.id === data.user.id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  useEffect(() => {
    let active = true;
    async function load() {
      if (demo || !joined) return;
      try {
        const m = await request<Message[]>(`/parties/${id}/messages`);
        if (active) {
          setMessages(m);
          setError("");
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    }
    void load();
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void load();
    }, 2500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [demo, joined, id, request]);
  async function send() {
    if (sending || !draft.trim()) return;
    setSending(true);
    try {
      const m = await request<Message[]>(`/parties/${id}/messages`, "POST", {
        body: draft,
      });
      setMessages(m);
      setDraft("");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }
  async function leave() {
    setLeaving(true);
    try {
      await request(`/parties/${id}/leave`, "POST");
      await refresh();
      router.replace("/chats");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLeaving(false);
    }
  }
  if (!party || !joined)
    return (
      <Screen title="Party chat">
        <Empty
          title="Join a party to chat"
          detail="Only party members can read or send messages."
        />
        <Button
          title={demo ? "Sign in" : "Find a party"}
          onPress={() => router.replace(demo ? "/auth" : "/games")}
        />
      </Screen>
    );
  return (
    <Screen title={party.name} scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ paddingHorizontal: 20, paddingVertical: 12, gap: 10 }}>
          <Text style={styles.muted}>
            {gameById(party.game).name} · {party.members.length} members
          </Text>
          <View style={styles.row}>
            {party.members.map((m) => (
              <Avatar key={m.id} name={m.name} size={28} />
            ))}
          </View>
          <View style={[styles.card, { padding: 12 }]}>
            <Text style={styles.label}>Voice Chat</Text>
            <Text style={styles.muted}>
              Voice calling is not available in this version. Use text chat to
              coordinate.
            </Text>
          </View>
        </View>
        <ScrollView
          ref={scroll}
          onContentSizeChange={() =>
            scroll.current?.scrollToEnd({ animated: true })
          }
          contentContainerStyle={{ padding: 20, gap: 18, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {!messages.length && (
            <Empty
              title="Say hello to your squad"
              detail="Messages are visible to everyone in this party."
            />
          )}
          {messages.map((m) => {
            const mine = m.user_id === data.user.id;
            return (
              <View
                key={m.id}
                style={{ alignItems: mine ? "flex-end" : "flex-start", gap: 4 }}
              >
                {!mine && <Text style={styles.muted}>{m.name}</Text>}
                <View
                  style={{
                    backgroundColor: mine ? "#8e3de7" : colors.field,
                    borderRadius: 20,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    maxWidth: "85%",
                  }}
                >
                  <Text style={[styles.text, { fontSize: 16, lineHeight: 23 }]}>
                    {m.body}
                  </Text>
                </View>
                <Text style={[styles.muted, { fontSize: 10 }]}>
                  {new Date(m.created).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            );
          })}
        </ScrollView>
        <View style={{ padding: 12, gap: 10 }}>
          <ErrorText message={error} />
          <View style={styles.row}>
            <Field
              accessibilityLabel="Message"
              placeholder="메시지 입력"
              value={draft}
              onChangeText={setDraft}
              maxLength={2000}
              multiline
              style={{ flex: 1, maxHeight: 100 }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              disabled={sending || !draft.trim()}
              onPress={() => void send()}
              style={[
                styles.button,
                { opacity: sending || !draft.trim() ? 0.5 : 1 },
              ]}
            >
              <Text style={styles.buttonText}>{sending ? "…" : "➤"}</Text>
            </Pressable>
          </View>
          {confirmLeave ? (
            <View style={{ gap: 10 }}>
              <Text style={styles.muted}>
                Leave this party? You will lose access to its chat.
              </Text>
              <Button
                title="Leave party"
                onPress={() => void leave()}
                busy={leaving}
              />
              <Pressable onPress={() => setConfirmLeave(false)}>
                <Text style={[styles.link, { textAlign: "center" }]}>
                  Stay in party
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setConfirmLeave(true)}>
              <Text style={[styles.muted, { textAlign: "center" }]}>
                Leave party
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
